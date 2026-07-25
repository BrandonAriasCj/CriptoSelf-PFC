// Suscripciones a digests periódicos de mercado. Sin configuración: solo on/off.

import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CalendarDays, CalendarRange, Clock, LineChart, Loader2 } from 'lucide-react';

import { Card, CardContent } from '../ui/card';
import { Switch } from '../ui/switch';
import { subscriptionsApi } from '../../services/notifications';
import type { SubscriptionKey, SubscriptionsState } from '../../types/alerts';

interface SubscriptionDescriptor {
  key: SubscriptionKey;
  title: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
}

const SUBSCRIPTIONS: SubscriptionDescriptor[] = [
  {
    key: 'hourly',
    title: 'Resumen cada hora',
    description:
      'Precio y cambio % de BTC, ETH y SOL al inicio de cada hora. Útil para seguir el mercado de cerca durante el día.',
    Icon: Clock,
  },
  {
    key: 'daily',
    title: 'Resumen diario',
    description:
      'El cierre de 24h de los principales pares, todos los días a las 09:00 UTC. Una mirada diaria sin saturar.',
    Icon: CalendarDays,
  },
  {
    key: 'weekly',
    title: 'Resumen semanal',
    description:
      'Cómo terminaron la semana los principales pares. Llega los lunes a las 09:00 UTC.',
    Icon: CalendarRange,
  },
  {
    key: 'suggestions',
    title: 'Sugerencias del mercado',
    description:
      'Señales técnicas sobre los principales pares (cruce de medias). Llegan cuando el sistema detecta el patrón. Es información, no una recomendación de inversión.',
    Icon: LineChart,
  },
];

export const MarketSubscriptions: React.FC = () => {
  const [state, setState] = useState<SubscriptionsState>({
    hourly: false,
    daily: false,
    weekly: false,
    suggestions: false,
  });
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<SubscriptionKey | null>(null);

  useEffect(() => {
    subscriptionsApi
      .get()
      .then((s) => setState(s))
      .catch((err) => {
        console.error(err);
        toast.error('No se pudieron cargar las suscripciones');
      })
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (key: SubscriptionKey, next: boolean) => {
    setSavingKey(key);
    // Optimismo local — revertimos si el backend falla.
    const previous = state;
    setState({ ...state, [key]: next });
    try {
      const updated = await subscriptionsApi.update({ [key]: next });
      setState(updated);
      toast.success(next ? 'Suscripción activada' : 'Suscripción desactivada');
    } catch (err) {
      console.error(err);
      setState(previous);
      toast.error('No se pudo actualizar la suscripción');
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10 text-secondary-adaptive">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando suscripciones...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-secondary-adaptive">
        Resúmenes periódicos del mercado, sin configuración. Solo activá los que quieras recibir;
        llegan como una notificación más.
      </p>

      <div className="space-y-2">
        {SUBSCRIPTIONS.map(({ key, title, description, Icon }) => (
          <Card key={key}>
            <CardContent className="py-4 px-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-high-contrast">{title}</p>
                <p className="text-xs text-secondary-adaptive mt-0.5">{description}</p>
              </div>
              <Switch
                checked={state[key]}
                onCheckedChange={(v) => toggle(key, v)}
                disabled={savingKey === key}
                aria-label={`Activar ${title}`}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
