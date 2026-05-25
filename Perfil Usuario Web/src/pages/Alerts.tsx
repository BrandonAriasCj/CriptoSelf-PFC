// Página /alerts: tres tabs (Notificaciones, Mis reglas, Crear regla).

import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Bell, CalendarClock, CheckCheck, Loader2, Plus } from 'lucide-react';

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

const SEVERITY_DOT: Record<Severity, string> = {
  info: 'bg-blue-500',
  warning: 'bg-amber-500',
  critical: 'bg-red-500',
};

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
  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Bell className="w-10 h-10 mx-auto text-low-contrast mb-3" />
          <p className="text-secondary-adaptive">No tenés notificaciones todavía.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={onMarkAll}>
            <CheckCheck className="w-4 h-4" />
            Marcar todas como leídas
          </Button>
        </div>
      )}
      {notifications.map((n) => (
        <Card
          key={n.id}
          className={cn('cursor-pointer transition-colors', !n.is_read && 'border-blue-500/40')}
          onClick={() => !n.is_read && onMarkRead(n.id)}
        >
          <CardContent className="py-4 px-4">
            <div className="flex items-start gap-3">
              <span
                className={cn('mt-1.5 w-2 h-2 rounded-full shrink-0', SEVERITY_DOT[n.severity])}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <p
                    className={cn(
                      'truncate',
                      n.is_read ? 'text-secondary-adaptive' : 'text-high-contrast font-medium',
                    )}
                  >
                    {n.title}
                  </p>
                  <span className="text-xs text-low-contrast shrink-0">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>
                {n.body && (
                  <p className="text-sm text-secondary-adaptive mt-0.5">{n.body}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Alerts;
