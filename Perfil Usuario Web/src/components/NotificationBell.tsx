// Campana de notificaciones para el header.
//
// Muestra el botón con badge de no-leídas y un popover con las últimas 10.
// Las notificaciones llegan por WebSocket via NotificationsContext.

import React, { useState } from 'react';
import { Bell, BellOff, CheckCheck } from 'lucide-react';

import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { cn } from './ui/utils';
import { useNotifications } from '../contexts/NotificationsContext';
import type { Notification, Severity } from '../types/alerts';

const SEVERITY_DOT: Record<Severity, string> = {
  info: 'bg-blue-500',
  warning: 'bg-amber-500',
  critical: 'bg-red-500',
};

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.round(diff / 1000);
  if (sec < 60) return 'hace unos segundos';
  const min = Math.round(sec / 60);
  if (min < 60) return `hace ${min} min`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `hace ${hr} h`;
  const day = Math.round(hr / 24);
  if (day < 30) return `hace ${day} d`;
  return new Date(iso).toLocaleDateString();
}

const NotificationRow: React.FC<{
  notification: Notification;
  onClick: () => void;
}> = ({ notification, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'w-full text-left px-3 py-2.5 rounded-lg transition-colors',
      'hover:bg-muted/60 focus:bg-muted/60 focus:outline-none',
      !notification.is_read && 'bg-muted/30',
    )}
  >
    <div className="flex items-start gap-2.5">
      <span
        className={cn(
          'mt-1.5 inline-block w-2 h-2 rounded-full shrink-0',
          SEVERITY_DOT[notification.severity],
        )}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              'text-sm leading-tight truncate',
              notification.is_read ? 'text-secondary-adaptive' : 'text-high-contrast font-medium',
            )}
          >
            {notification.title}
          </p>
          {!notification.is_read && (
            <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
          )}
        </div>
        {notification.body && (
          <p className="text-xs text-secondary-adaptive mt-0.5 line-clamp-2">
            {notification.body}
          </p>
        )}
        <p className="text-xs text-low-contrast mt-1">
          {formatRelative(notification.created_at)}
        </p>
      </div>
    </div>
  </button>
);

export const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, isConnected, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);

  const badge = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label="Notificaciones"
        >
          {isConnected ? (
            <Bell className="w-5 h-5" />
          ) : (
            <BellOff className="w-5 h-5 text-low-contrast" />
          )}
          {unreadCount > 0 && (
            <span
              className={cn(
                'absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1',
                'rounded-full bg-red-500 text-[10px] font-semibold text-white',
                'flex items-center justify-center leading-none',
              )}
            >
              {badge}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 p-0 overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-primary-adaptive">Notificaciones</p>
            <p className="text-xs text-secondary-adaptive">
              {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al día'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => markAllRead()}
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Marcar todas
            </Button>
          )}
        </div>

        <Separator />

        {notifications.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <Bell className="w-8 h-8 mx-auto text-low-contrast mb-2" />
            <p className="text-sm text-secondary-adaptive">No tenés notificaciones todavía.</p>
            <p className="text-xs text-low-contrast mt-1">
              Configurá alertas para empezar a recibirlas.
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[420px]">
            <div className="p-2 space-y-1">
              {notifications.slice(0, 10).map((n) => (
                <NotificationRow
                  key={n.id}
                  notification={n}
                  onClick={() => {
                    if (!n.is_read) markRead(n.id);
                  }}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
};
