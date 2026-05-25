import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { toast } from 'sonner';
import {
  gamificationService,
  MyChallenge, MyGamificationStats, MyInvitation, MyBadge,
} from '../services/gamification';

const METRIC_ICON: Record<string, string> = {
  trades: '⚡', backtests: '🧠', active_days: '📅', streak_days: '🔥',
  distinct_assets: '🪙', win_rate: '🎯', sharpe_ratio: '📐',
  pnl: '💰', roi: '📈', custom: '✨',
};

// Métricas que son siempre enteras (count). Ratios/% pueden tener decimales.
const INTEGER_METRICS = new Set([
  'trades', 'backtests', 'active_days', 'streak_days', 'distinct_assets',
]);

function formatMetricValue(value: string | number | undefined | null, metric?: string): string {
  if (value === undefined || value === null || value === '') return '0';
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (!isFinite(n)) return '0';
  if (metric && INTEGER_METRICS.has(metric)) return String(Math.floor(n));
  // Para ratios: 2 decimales máximo, sin ceros sobrantes
  return n.toFixed(2).replace(/\.?0+$/, '');
}

const DIFF_LABEL: Record<string, string> = {
  easy: 'Fácil', medium: 'Medio', hard: 'Difícil', epic: 'Épico',
};

const DIFF_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  easy: 'secondary', medium: 'default', hard: 'destructive', epic: 'destructive',
};

export default function MyChallenges() {
  const [invitations, setInvitations] = useState<MyInvitation[]>([]);
  const [challenges,  setChallenges]  = useState<MyChallenge[]>([]);
  const [stats,       setStats]       = useState<MyGamificationStats[]>([]);
  const [badges,      setBadges]      = useState<MyBadge[]>([]);
  const [loading,     setLoading]     = useState(true);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      gamificationService.invitations(),
      gamificationService.challenges(),
      gamificationService.gamification(),
      gamificationService.badges(),
    ]).then(([i, c, s, b]) => {
      setInvitations(i);
      setChallenges(c);
      setStats(s);
      setBadges(b);
    }).catch(() => {
      // El usuario web puede no pertenecer a ninguna org aún — no es error.
    }).finally(() => setLoading(false));
  };

  useEffect(fetchAll, []);

  const handleAccept = async (token: string) => {
    try {
      const res = await gamificationService.acceptInvitation(token);
      toast.success(`Te uniste a ${res.organization_name}`);
      fetchAll();
    } catch {
      toast.error('No se pudo aceptar la invitación.');
    }
  };

  const handleDecline = async (token: string) => {
    try {
      await gamificationService.declineInvitation(token);
      toast('Invitación rechazada.');
      fetchAll();
    } catch {
      toast.error('No se pudo rechazar.');
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">Cargando retos…</div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold">🏆 Mis Retos</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Retos asignados por tus organizaciones, mis puntos y badges
        </p>
      </header>

      {/* Invitaciones pendientes */}
      {invitations.length > 0 && (
        <Card className="border-amber-500/40">
          <CardHeader>
            <CardTitle className="text-amber-500 text-lg">
              ✉️ Invitaciones pendientes ({invitations.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {invitations.map(inv => (
              <div key={inv.token}
                   className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-muted/40 border">
                <div>
                  <div className="font-semibold">{inv.organization_name}</div>
                  <div className="text-xs text-muted-foreground">
                    Te invitó {inv.invited_by || 'un administrador'} · expira {new Date(inv.expires_at).toLocaleDateString('es-AR')}
                  </div>
                  {inv.message && <div className="text-sm mt-2 italic">{inv.message}</div>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => handleDecline(inv.token)}>
                    Rechazar
                  </Button>
                  <Button size="sm" onClick={() => handleAccept(inv.token)}>
                    Aceptar
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Si no pertenece a ninguna org */}
      {stats.length === 0 && invitations.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <div className="text-4xl mb-3">🏢</div>
            <h3 className="font-semibold">No estás en ninguna organización</h3>
            <p className="text-sm mt-1">
              Cuando una empresa te invite a su plataforma vas a poder participar en sus retos.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats por organización */}
      {stats.map(s => (
        <Card key={s.organization_id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{s.organization_name}</span>
              <span className="text-xs font-normal text-muted-foreground">
                Rank #{s.rank ?? '—'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Stat icon="💎" label="Puntos"  value={s.total_points.toLocaleString()} />
              <Stat icon="📊" label={`Nivel ${s.level}`} value={s.level_name} />
              <Stat icon="🔥" label="Racha"   value={`${s.current_streak_days}d`} />
              <Stat icon="🏅" label="Badges"  value={s.badges.length.toString()} />
            </div>

            {s.points_to_next_level > 0 && (
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progreso al siguiente nivel</span>
                  <span>{s.points_to_next_level} pts faltan</span>
                </div>
                <Progress value={s.level_progress_percentage} />
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Retos activos */}
      {challenges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Retos activos ({challenges.filter(c => c.my_progress.status === 'in_progress').length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {challenges.map(c => (
              <div key={c.id} className="p-4 rounded-lg border bg-muted/30">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <div className="font-semibold flex items-center gap-2">
                      <span>{METRIC_ICON[c.metric] || '✨'}</span>
                      <span>{c.name}</span>
                      <Badge variant={DIFF_VARIANT[c.difficulty]}>{DIFF_LABEL[c.difficulty]}</Badge>
                      {c.my_progress.status === 'completed' && (
                        <Badge variant="default" className="bg-emerald-600">✓ Completado</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {c.organization_name} · {c.reward_points} pts
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{Math.round(c.my_progress.progress_percentage)}%</div>
                    <div className="text-xs text-muted-foreground">
                      {formatMetricValue(c.my_progress.current_value, c.metric)} / {formatMetricValue(c.target_value, c.metric)} {c.unit}
                    </div>
                  </div>
                </div>
                {c.description && <div className="text-sm text-muted-foreground mb-2">{c.description}</div>}
                <Progress value={c.my_progress.progress_percentage} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Badges ganados */}
      {badges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>🏅 Mis badges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {badges.map(b => (
                <div key={`${b.badge_id}-${b.organization_id}`}
                     className="p-4 rounded-lg border text-center bg-muted/30">
                  <div className="text-4xl mb-2">{b.badge.icon}</div>
                  <div className="font-semibold text-sm">{b.badge.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">{b.badge.rarity}</div>
                  <div className="text-xs text-muted-foreground mt-1">{b.organization_name}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-background border">
      <div className="text-xs text-muted-foreground flex items-center gap-1">
        <span>{icon}</span> {label}
      </div>
      <div className="text-lg font-bold mt-1">{value}</div>
    </div>
  );
}
