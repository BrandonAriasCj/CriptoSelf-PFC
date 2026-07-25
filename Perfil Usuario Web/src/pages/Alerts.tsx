// Página /alerts: tres tabs (Notificaciones, Mis reglas, Crear regla).

import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertOctagon,
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCheck,
  Loader2,
  Plus,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { cn } from '../components/ui/utils';
import { RulesList } from '../components/alerts/RulesList';
import { RuleEditor } from '../components/alerts/RuleEditor';
import { MarketSubscriptions } from '../components/alerts/MarketSubscriptions';
import {
  eventTypesApi,
  rulesApi,
} from '../services/notifications';
import { useNotifications } from '../contexts/NotificationsContext';
import type { AlertRule, EventTypeSchema, Notification, Severity } from '../types/alerts';
import './alerts-notifications.css';

// Clase modificadora + icono por severidad. El front no compila Tailwind, así
// que el color vive en alerts-notifications.css (no en utilidades inline).
const SEVERITY_META: Record<Severity, { cls: string; Icon: LucideIcon }> = {
  info: { cls: 'notif--info', Icon: Bell },
  warning: { cls: 'notif--warning', Icon: AlertTriangle },
  critical: { cls: 'notif--critical', Icon: AlertOctagon },
};

// Items que vienen en payload.items de los digests del mercado.
interface DigestItem {
  symbol: string;
  price: number | null;
  change_pct: number | null;
  window?: string;
}

const isDigestPayload = (
  payload: Record<string, any> | undefined,
): payload is { items: DigestItem[]; headline?: string | null } =>
  Array.isArray(payload?.items) && payload!.items.length > 0;

// Antes el backend podía guardar digests "fallidos" (todos los items sin
// precio ni cambio %). El backend ya no los genera, pero los que quedaron en
// la DB los filtramos en cliente para no mostrar la tarjeta vacía.
const isFailedDigest = (n: Notification): boolean => {
  if (!isDigestPayload(n.payload)) return false;
  return n.payload.items.every((it) => it.price === null && it.change_pct === null);
};

const formatPrice = (price: number): string => {
  if (price >= 1000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  if (price >= 1) return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${price.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`;
};

// Espejo en TypeScript de alerts/services/templates.py — se usa como fallback
// cuando una notificación vieja no trae payload.headline (los digests creados
// antes de habilitar headlines en el backend). El "seed" es el id de la
// notificación: misma notificación → mismo headline estable entre renders.
const FRIENDLY_NAMES: Record<string, string> = {
  BTC: 'Bitcoin', ETH: 'Ethereum', SOL: 'Solana', ADA: 'Cardano',
  XRP: 'XRP', DOGE: 'Dogecoin', BNB: 'BNB', AVAX: 'Avalanche',
  DOT: 'Polkadot', MATIC: 'Polygon', LINK: 'Chainlink', LTC: 'Litecoin',
  ATOM: 'Cosmos',
};

const friendlyName = (symbol: string): string => {
  const short = symbol.split('/')[0].toUpperCase();
  return FRIENDLY_NAMES[short] ?? short;
};

const HEADLINE_ALL_UP = [
  (leader: string, pct: number) => `Sesión alcista — ${leader} lidera con +${pct.toFixed(1)}%`,
  (leader: string, _pct: number) => `Mercado en verde — todos los principales suben, ${leader} al frente`,
  (leader: string, pct: number) => `Día positivo en cripto, ${leader} marca el ritmo (+${pct.toFixed(1)}%)`,
];

const HEADLINE_ALL_DOWN = [
  (leader: string, pct: number) => `Mercado en rojo — los principales caen, ${leader} encabeza la baja (${pct.toFixed(1)}%)`,
  (leader: string, pct: number) => `Sesión bajista — ${leader} es el más castigado (${pct.toFixed(1)}%)`,
  (leader: string, pct: number) => `Cripto en corrección, ${leader} retrocede ${Math.abs(pct).toFixed(1)}%`,
];

const HEADLINE_MIXED_BULL = [
  (leader: string, pct: number) => `Sesión mixta — ${leader} empuja al alza (+${pct.toFixed(1)}%)`,
  (leader: string, pct: number) => `Cripto dividido, ${leader} es lo más destacado (+${pct.toFixed(1)}%)`,
  (leader: string, pct: number) => `Mercado mixto con sesgo alcista: ${leader} +${pct.toFixed(1)}%`,
];

const HEADLINE_MIXED_BEAR = [
  (leader: string, pct: number) => `Sesión mixta — predominan las caídas, ${leader} cede ${Math.abs(pct).toFixed(1)}%`,
  (leader: string, pct: number) => `Mercado dividido, ${leader} pesa con ${pct.toFixed(1)}%`,
  (leader: string, pct: number) => `Cripto mixto con sesgo bajista: ${leader} ${pct.toFixed(1)}%`,
];

const HEADLINE_FLAT = [
  'Mercado tranquilo — variaciones leves en los principales',
  'Sesión sin grandes sobresaltos en cripto',
  'Mercado plano — movimientos menores al 1%',
];

const computeHeadline = (items: DigestItem[], seed: number): string | null => {
  const usable = items.filter((it) => it.change_pct !== null) as Array<
    DigestItem & { change_pct: number }
  >;
  if (usable.length === 0) return null;

  const pick = <T,>(arr: T[]): T => arr[seed % arr.length];

  const changes = usable.map((it) => it.change_pct);
  const pos = changes.filter((c) => c >= 0);
  const neg = changes.filter((c) => c < 0);

  const leaderUp = usable.reduce((a, b) => (a.change_pct > b.change_pct ? a : b));
  const leaderDown = usable.reduce((a, b) => (a.change_pct < b.change_pct ? a : b));

  const maxMag = Math.max(...changes.map(Math.abs));
  if (maxMag < 1.0) return pick(HEADLINE_FLAT);

  if (neg.length === 0) {
    return pick(HEADLINE_ALL_UP)(friendlyName(leaderUp.symbol), leaderUp.change_pct);
  }
  if (pos.length === 0) {
    return pick(HEADLINE_ALL_DOWN)(friendlyName(leaderDown.symbol), leaderDown.change_pct);
  }
  if (Math.abs(leaderUp.change_pct) >= Math.abs(leaderDown.change_pct)) {
    return pick(HEADLINE_MIXED_BULL)(friendlyName(leaderUp.symbol), leaderUp.change_pct);
  }
  return pick(HEADLINE_MIXED_BEAR)(friendlyName(leaderDown.symbol), leaderDown.change_pct);
};

const DigestItems: React.FC<{ items: DigestItem[] }> = ({ items }) => (
  <div className="notif-digest">
    {items.map((it) => {
      const short = it.symbol.split('/')[0];
      const hasData = it.price !== null && it.change_pct !== null;
      const isUp = (it.change_pct ?? 0) >= 0;
      return (
        <div key={it.symbol} className="notif-chip">
          <span className="notif-chip__sym">{short}</span>
          {hasData ? (
            <div className="notif-chip__data">
              <span className="notif-chip__price">{formatPrice(it.price as number)}</span>
              <span className={cn('notif-chip__chg', isUp ? 'is-up' : 'is-down')}>
                {isUp ? <TrendingUp /> : <TrendingDown />}
                {isUp ? '+' : ''}
                {(it.change_pct as number).toFixed(2)}%
              </span>
            </div>
          ) : (
            <span className="notif-chip__nodata">sin datos</span>
          )}
        </div>
      );
    })}
  </div>
);

const Alerts: React.FC = () => {
  const { notifications, unreadCount, markRead, markAllRead, refresh } = useNotifications();

  const [tab, setTab] = useState<'notifications' | 'rules' | 'create' | 'subscriptions'>(
    'notifications',
  );
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [eventTypes, setEventTypes] = useState<EventTypeSchema[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    try {
      const [r, t] = await Promise.all([rulesApi.list(), eventTypesApi.list()]);
      setRules(r);
      setEventTypes(t);
    } catch (err) {
      console.error(err);
      toast.error('No se pudieron cargar las reglas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    if (tab === 'notifications') refresh();
  }, [tab, refresh]);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notificaciones
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rules">Mis reglas</TabsTrigger>
          <TabsTrigger value="create" className="gap-2">
            <Plus className="w-4 h-4" />
            Crear regla
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="gap-2">
            <CalendarClock className="w-4 h-4" />
            Suscripciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <NotificationsList
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAll={markAllRead}
            onMarkRead={markRead}
          />
        </TabsContent>

        <TabsContent value="rules">
          <RulesList
            rules={rules}
            eventTypes={eventTypes}
            loading={loading}
            onChanged={loadCatalog}
          />
        </TabsContent>

        <TabsContent value="subscriptions">
          <MarketSubscriptions />
        </TabsContent>

        <TabsContent value="create">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-secondary-adaptive">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando tipos de evento...
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <RuleEditor
                  eventTypes={eventTypes}
                  onSaved={() => {
                    loadCatalog();
                    setTab('rules');
                  }}
                  onCancel={() => setTab('rules')}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const NotificationsList: React.FC<{
  notifications: Notification[];
  unreadCount: number;
  onMarkAll: () => void;
  onMarkRead: (id: number) => void;
}> = ({ notifications, unreadCount, onMarkAll, onMarkRead }) => {
  const visible = notifications.filter((n) => !isFailedDigest(n));
  if (visible.length === 0) {
    return (
      <div className="notif-empty">
        <Bell />
        <p>No tenés notificaciones todavía.</p>
      </div>
    );
  }

  return (
    <div className="notif-list">
      {unreadCount > 0 && (
        <div className="notif-toolbar">
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={onMarkAll}>
            <CheckCheck className="w-4 h-4" />
            Marcar todas como leídas
          </Button>
        </div>
      )}
      {visible.map((n) => {
        const isDigest = isDigestPayload(n.payload);
        const digestHeadline = isDigest
          ? (n.payload.headline ??
              computeHeadline((n.payload as { items: DigestItem[] }).items, n.id))
          : null;
        // Las notificaciones de bienvenida llevan un icono propio (Sparkles);
        // el resto usa el icono por severidad.
        const isWelcome = n.payload?.kind === 'welcome';
        const { cls, Icon } = SEVERITY_META[n.severity] ?? SEVERITY_META.info;
        const CardIcon = isWelcome ? Sparkles : Icon;
        return (
          <article
            key={n.id}
            className={cn('notif-card', cls, !n.is_read && 'is-unread')}
            onClick={() => !n.is_read && onMarkRead(n.id)}
          >
            <div className="notif-icon">
              <CardIcon />
            </div>
            <div className="notif-main">
              <div className="notif-head">
                <p className="notif-title">{n.title}</p>
                <span className="notif-time">{new Date(n.created_at).toLocaleString()}</span>
              </div>
              {isDigest ? (
                <>
                  {digestHeadline && <p className="notif-headline">{digestHeadline}</p>}
                  <DigestItems items={(n.payload as { items: DigestItem[] }).items} />
                </>
              ) : (
                n.body && <p className="notif-body">{n.body}</p>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default Alerts;
