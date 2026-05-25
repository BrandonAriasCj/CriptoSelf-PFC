// Provider de notificaciones: gestiona conexión WebSocket, estado in-memory
// y exposición de helpers (markRead, markAllRead, refresh).
//
// Ubicación esperada: dentro de <AuthProvider> en App.tsx para tener acceso al token.

import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';

import type { Notification, WsInbound } from '../types/alerts';
import { notificationsApi } from '../services/notifications';
import { useAuth } from './AuthContext';

interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

export const useNotifications = () => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotifications debe usarse dentro de <NotificationsProvider>');
  }
  return ctx;
};

const MAX_NOTIFICATIONS_IN_MEMORY = 50;
const PING_INTERVAL_MS = 25_000;
const MAX_BACKOFF_MS = 30_000;

function buildWsUrl(token: string): string {
  // El WS sale por el mismo host que la página y se proxia a través de nginx
  // (igual que `/api/`). En dev, vite proxy /ws → backend:8000. En prod, nginx del
  // frontend proxy /ws → backend con TLS. Así el cliente nunca depende de VITE_PREFIX.
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/ws/alerts/notifications/?token=${encodeURIComponent(token)}`;
}

export const NotificationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<number | null>(null);
  const pingTimerRef = useRef<number | null>(null);
  // Bandera para distinguir cierre intencional (logout) de cierre por error/red.
  const intentionalCloseRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [page, count] = await Promise.all([
        notificationsApi.list({ page: 1 }),
        notificationsApi.unreadCount(),
      ]);
      setNotifications(page.results.slice(0, MAX_NOTIFICATIONS_IN_MEMORY));
      setUnreadCount(count);
    } catch (err) {
      console.error('Error refrescando notificaciones:', err);
    }
  }, [isAuthenticated]);

  const markRead = useCallback(async (id: number) => {
    try {
      const updated = await notificationsApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, ...updated } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Error marcando como leída:', err);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await notificationsApi.markAllRead();
      const now = new Date().toISOString();
      setNotifications((prev) =>
        prev.map((n) => (n.is_read ? n : { ...n, is_read: true, read_at: now })),
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marcando todas como leídas:', err);
    }
  }, []);

  const cleanupSocket = useCallback(() => {
    if (pingTimerRef.current !== null) {
      window.clearInterval(pingTimerRef.current);
      pingTimerRef.current = null;
    }
    if (reconnectTimerRef.current !== null) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (socketRef.current) {
      // El cierre intencional evita que onclose dispare reconexión.
      intentionalCloseRef.current = true;
      try {
        socketRef.current.close();
      } catch {
        /* ignorado */
      }
      socketRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const connect = useCallback(() => {
    if (!token) return;
    if (socketRef.current && socketRef.current.readyState !== WebSocket.CLOSED) return;

    intentionalCloseRef.current = false;
    const ws = new WebSocket(buildWsUrl(token));
    socketRef.current = ws;

    ws.onopen = () => {
      reconnectAttemptsRef.current = 0;
      setIsConnected(true);
      if (pingTimerRef.current === null) {
        pingTimerRef.current = window.setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, PING_INTERVAL_MS);
      }
    };

    ws.onmessage = (event) => {
      let msg: WsInbound;
      try {
        msg = JSON.parse(event.data) as WsInbound;
      } catch {
        return;
      }
      if (msg.type !== 'notification') return;

      const incoming: Notification = {
        id: msg.data.id,
        rule: msg.data.rule_id,
        title: msg.data.title,
        body: msg.data.body,
        severity: msg.data.severity,
        payload: msg.data.payload || {},
        is_read: false,
        read_at: null,
        created_at: msg.data.created_at,
      };

      setNotifications((prev) =>
        [incoming, ...prev.filter((n) => n.id !== incoming.id)].slice(0, MAX_NOTIFICATIONS_IN_MEMORY),
      );
      setUnreadCount((c) => c + 1);

      if (incoming.severity === 'warning') {
        toast.warning(incoming.title, { description: incoming.body || undefined });
      } else if (incoming.severity === 'critical') {
        toast.error(incoming.title, { description: incoming.body || undefined });
      }
    };

    ws.onerror = (err) => {
      console.warn('NotificationsWS error:', err);
    };

    ws.onclose = (event) => {
      setIsConnected(false);
      if (pingTimerRef.current !== null) {
        window.clearInterval(pingTimerRef.current);
        pingTimerRef.current = null;
      }
      if (intentionalCloseRef.current) return;

      // Código 4401 = auth rejected: no reintentar.
      if (event.code === 4401) {
        console.warn('NotificationsWS: token rechazado por el servidor');
        return;
      }
      const attempt = reconnectAttemptsRef.current + 1;
      reconnectAttemptsRef.current = attempt;
      const delay = Math.min(1000 * 2 ** (attempt - 1), MAX_BACKOFF_MS);
      reconnectTimerRef.current = window.setTimeout(connect, delay);
    };
  }, [token]);

  // Ciclo de vida: conectar al login, cerrar al logout / desmontaje.
  useEffect(() => {
    if (!isAuthenticated || !token) {
      cleanupSocket();
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    refresh();
    connect();
    return cleanupSocket;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token]);

  const value = useMemo<NotificationsContextValue>(
    () => ({ notifications, unreadCount, isConnected, markRead, markAllRead, refresh }),
    [notifications, unreadCount, isConnected, markRead, markAllRead, refresh],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};
