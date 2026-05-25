import React, { useEffect, useState } from 'react';
import { orgService, challengeService, gamificationService } from '../services/api';
import { useOrganization } from '../contexts/OrganizationContext';
import { Analytics, Challenge, LeaderboardEntry, MemberStats, TeamRecord } from '../types';

function formatMinutes(min: number): string {
  if (!min) return '0 min';
  if (min < 60) return `${min} min`;
  const hours = Math.floor(min / 60);
  const rem = min % 60;
  if (hours < 24) return rem ? `${hours}h ${rem}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

function initials(name: string): string {
  return name.split(' ').map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

function levelColor(level: number): string {
  if (level >= 7) return '#a78bfa';
  if (level >= 6) return 'var(--gold-400)';
  if (level >= 5) return 'var(--gold-500)';
  if (level >= 4) return 'var(--success)';
  if (level >= 3) return 'var(--brand-400)';
  if (level >= 2) return 'var(--info)';
  return 'var(--text-secondary)';
}

function progressColor(pct: number): string | undefined {
  if (pct >= 80) return 'linear-gradient(90deg, var(--success), #34d399)';
  if (pct >= 40) return undefined;
  return 'linear-gradient(90deg, var(--warning), #fbbf24)';
}

function LeaderRow({ entry }: { entry: LeaderboardEntry }) {
  return (
    <div className="perf-row">
      <div className="perf-avatar" style={{
        background: 'linear-gradient(135deg, var(--brand-500), var(--gold-600))',
      }}>
        {initials(entry.member_name)}
      </div>
      <div className="perf-info">
        <div className="perf-name">{entry.member_name}</div>
        <div className="perf-meta">
          Nv. {entry.level} · {entry.level_name}
          {entry.current_streak_days > 0 && ` · ${entry.current_streak_days}d racha`}
          {entry.badges_count > 0 && ` · ${entry.badges_count} insignias`}
        </div>
      </div>
      <div className="perf-stats">
        <div className="perf-grade" style={{ color: levelColor(entry.level) }}>
          {entry.total_points.toLocaleString()} pts
        </div>
      </div>
    </div>
  );
}

function LowEngagementRow({ stats }: { stats: MemberStats }) {
  return (
    <div className="perf-row">
      <div className="perf-avatar" style={{
        background: 'linear-gradient(135deg, var(--danger), #b91c1c)',
      }}>
        {initials(stats.member_name)}
      </div>
      <div className="perf-info">
        <div className="perf-name">{stats.member_name}</div>
        <div className="perf-meta">
          {stats.challenges_in_progress > 0
            ? `${stats.challenges_in_progress} reto(s) sin avance`
            : 'Sin retos en curso'}
          {' · '}
          {stats.total_points.toLocaleString()} pts
        </div>
      </div>
      <div className="perf-stats">
        <div className="perf-grade" style={{ color: 'var(--danger)' }}>
          Nv. {stats.level}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { orgs, selectedOrg, selectedOrgId, isLoading: orgsLoading } = useOrganization();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [memberStats, setMemberStats] = useState<MemberStats[]>([]);
  const [records, setRecords] = useState<TeamRecord[]>([]);

  useEffect(() => {
    if (!selectedOrgId) {
      setAnalytics(null);
      setActiveChallenges([]);
      setLeaderboard([]);
      setMemberStats([]);
      setRecords([]);
      return;
    }
    setLoading(true);
    Promise.all([
      orgService.analytics(selectedOrgId).then(r => r.data).catch(() => null),
      challengeService.list(selectedOrgId, { status: 'active' }).catch(() => [] as Challenge[]),
      gamificationService.leaderboard(selectedOrgId).catch(() => [] as LeaderboardEntry[]),
      gamificationService.memberStats(selectedOrgId).catch(() => [] as MemberStats[]),
      gamificationService.records(selectedOrgId).catch(() => [] as TeamRecord[]),
    ]).then(([a, c, lb, ms, rec]) => {
      setAnalytics(a as Analytics | null);
      setActiveChallenges(c as Challenge[]);
      setLeaderboard(lb as LeaderboardEntry[]);
      setMemberStats(ms as MemberStats[]);
      setRecords(rec as TeamRecord[]);
    }).finally(() => setLoading(false));
  }, [selectedOrgId]);

  if (orgsLoading) return (
    <div className="loading-screen">
      <div className="spinner" />
      <p className="text-secondary">Cargando dashboard...</p>
    </div>
  );

  if (orgs.length === 0) {
    return (
      <div className="page fade-in">
        <div className="card">
          <div className="empty-state">
            <h3>Sin organizaciones</h3>
            <p>Aún no tienes organizaciones registradas. Contacta al administrador de la plataforma.</p>
          </div>
        </div>
      </div>
    );
  }

  const s = analytics?.summary;
  const leader = leaderboard[0] || null;

  const pointsAtStake = activeChallenges.reduce((acc, c) => acc + c.reward_points, 0);
  const totalParticipants = activeChallenges.reduce((acc, c) => acc + c.total_participants, 0);
  const totalCompleted = activeChallenges.reduce((acc, c) => acc + c.completed_count, 0);
  const challengeCompletionRate = totalParticipants > 0
    ? Math.round((totalCompleted / totalParticipants) * 100)
    : 0;
  const avgChallengeProgress = activeChallenges.length > 0
    ? Math.round(
        activeChallenges.reduce((acc, c) => acc + c.average_progress, 0) /
          activeChallenges.length
      )
    : 0;

  const longestStreak = memberStats.reduce(
    (max, m) => (m.longest_streak_days > max ? m.longest_streak_days : max),
    0
  );

  // Distribución por nivel (agrupa por level_name del backend, ordenado por level)
  const levelMap = new Map<number, { level: number; name: string; count: number }>();
  memberStats.forEach(m => {
    const entry = levelMap.get(m.level) || { level: m.level, name: m.level_name, count: 0 };
    entry.count++;
    levelMap.set(m.level, entry);
  });
  const levelGroups = Array.from(levelMap.values()).sort((a, b) => a.level - b.level);
  const totalForDist = memberStats.length || 1;

  // Bajo engagement: integrantes asignados a retos pero sin puntos acumulados
  const lowEngagement = memberStats
    .filter(m => m.total_points === 0)
    .sort((a, b) => b.challenges_in_progress - a.challenges_in_progress)
    .slice(0, 5);

  const topLeaders = leaderboard.slice(0, 5);

  return (
    <div className="page fade-in">
      {/* ── KPIs equipo + retos ────────────────────────────────────────────── */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Integrantes Activos</div>
          <div className="kpi-value gold">{s?.active_students ?? memberStats.length}</div>
          <div className="kpi-delta up">de {s?.total_students ?? memberStats.length} totales</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Retos Activos</div>
          <div className="kpi-value">{activeChallenges.length}</div>
          <div className="kpi-delta">{pointsAtStake.toLocaleString()} pts en juego</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Tasa de Completación</div>
          <div className="kpi-value green">{challengeCompletionRate}%</div>
          <div className="kpi-delta">
            {totalCompleted} / {totalParticipants} asignaciones
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Avance Promedio</div>
          <div className="kpi-value">{avgChallengeProgress}%</div>
          <div className="kpi-delta">en retos en curso</div>
        </div>
      </div>

      {/* ── KPIs rendimiento individual ─────────────────────────────────────── */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Líder del Equipo</div>
          <div className="kpi-value" style={{ fontSize: 18, lineHeight: 1.2 }}>
            {leader?.member_name?.split(' ')[0] || '—'}
          </div>
          <div className="kpi-delta">
            {leader
              ? `${leader.total_points.toLocaleString()} pts · nv. ${leader.level}`
              : 'sin datos'}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Mejor Racha</div>
          <div className="kpi-value gold">{longestStreak}</div>
          <div className="kpi-delta">días consecutivos activos</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Backtests del Equipo</div>
          <div className="kpi-value">{s?.total_backtests_performed ?? '—'}</div>
          <div className="kpi-delta">total acumulado</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Tiempo Invertido</div>
          <div className="kpi-value">
            {s?.total_time_invested_minutes != null
              ? formatMinutes(s.total_time_invested_minutes)
              : '—'}
          </div>
          <div className="kpi-delta">
            avg{' '}
            {s?.average_time_per_student_minutes != null
              ? formatMinutes(s.average_time_per_student_minutes)
              : '—'}{' '}
            por integrante
          </div>
        </div>
      </div>

      {loading && (
        <div className="card mb-3">
          <div className="loading-screen" style={{ minHeight: 120 }}>
            <div className="spinner" />
            <p className="text-secondary text-sm" style={{ marginTop: 8 }}>
              Cargando datos de {selectedOrg?.name}…
            </p>
          </div>
        </div>
      )}

      {/* ── Top integrantes + Bajo engagement ──────────────────────────────── */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Top Integrantes</div>
              <div className="card-subtitle">Ranking por puntos acumulados</div>
            </div>
          </div>
          {topLeaders.length ? (
            <div className="perf-list">
              {topLeaders.map((entry, idx) => (
                <div key={entry.member_id} style={{ position: 'relative' }}>
                  <div className="perf-rank">#{idx + 1}</div>
                  <LeaderRow entry={entry} />
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>Aún no hay integrantes con puntos. Lanza un reto para empezar.</p>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Bajo Engagement</div>
              <div className="card-subtitle">Integrantes asignados sin progreso</div>
            </div>
            {lowEngagement.length > 0 && (
              <span className="badge badge-warning pulse">
                {lowEngagement.length}
              </span>
            )}
          </div>
          {lowEngagement.length ? (
            <div className="perf-list">
              {lowEngagement.map(stats => (
                <LowEngagementRow key={stats.member_id} stats={stats} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>Todos los integrantes con retos asignados están avanzando.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Distribución por nivel + Progreso de retos ─────────────────────── */}
      <div className="grid-2 mt-3">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Distribución por Nivel</div>
              <div className="card-subtitle">Iniciado → Maestro</div>
            </div>
          </div>
          {memberStats.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {levelGroups.map(({ level, name, count }) => {
                const pct = Math.round((count / totalForDist) * 100);
                return (
                  <div key={level}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span className="text-sm text-secondary">
                        Nv. {level} · {name}
                      </span>
                      <span className="text-sm font-semi">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${pct}%`, background: levelColor(level) }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <p>Sin datos de integrantes todavía.</p>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Progreso de Retos Activos</div>
              <div className="card-subtitle">Avance promedio del equipo</div>
            </div>
          </div>
          {activeChallenges.length ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                maxHeight: 360,
                overflowY: 'auto',
                paddingRight: 4,
              }}
            >
              {activeChallenges.map(c => {
                const pct = Math.min(c.average_progress, 100);
                return (
                  <div key={c.id}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 4,
                        gap: 8,
                      }}
                    >
                      <span
                        className="text-sm font-semi"
                        style={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          flex: 1,
                          minWidth: 0,
                        }}
                        title={c.name}
                      >
                        {c.name}
                      </span>
                      <span className="text-sm text-secondary" style={{ flexShrink: 0 }}>
                        {c.completed_count} / {c.total_participants}
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${pct}%`, background: progressColor(pct) }}
                      />
                    </div>
                    <div className="text-xs text-muted" style={{ marginTop: 2 }}>
                      {c.reward_points} pts · {c.average_progress.toFixed(0)}% avance
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <p>No hay retos activos en este momento.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Records del equipo ─────────────────────────────────────────────── */}
      {records.length > 0 && (
        <div className="card mt-3">
          <div className="card-header">
            <div>
              <div className="card-title">Records del Equipo</div>
              <div className="card-subtitle">Mejores marcas alcanzadas</div>
            </div>
          </div>
          <div className="record-grid">
            {records.slice(0, 6).map(r => (
              <div key={r.id} className="record-tile">
                <div className="record-category">{r.category_label}</div>
                <div className="record-value">
                  {r.value.toLocaleString()}{' '}
                  <span className="record-unit">{r.unit}</span>
                </div>
                <div className="record-holder">{r.member_name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Crecimiento del equipo ─────────────────────────────────────────── */}
      <div className="card mt-3">
        <div className="card-header">
          <div>
            <div className="card-title">Crecimiento del Equipo</div>
            <div className="card-subtitle">Nuevas incorporaciones — últimos 6 meses</div>
          </div>
        </div>
        {analytics?.monthly_enrollments?.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {analytics.monthly_enrollments.map(item => {
              const max = Math.max(...analytics.monthly_enrollments.map(x => x.count), 1);
              const pct = Math.round((item.count / max) * 100);
              return (
                <div
                  key={item.month}
                  style={{ display: 'flex', alignItems: 'center', gap: 12 }}
                >
                  <span
                    className="text-xs text-muted"
                    style={{ width: 60, flexShrink: 0 }}
                  >
                    {item.month}
                  </span>
                  <div className="progress-bar" style={{ flex: 1 }}>
                    <div className="progress-fill" style={{ width: `${pct}%` }} />
                  </div>
                  <span
                    className="text-sm font-semi"
                    style={{ width: 28, textAlign: 'right' }}
                  >
                    {item.count}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <p>Sin nuevas incorporaciones aún.</p>
          </div>
        )}
      </div>

      {/* ── Mis organizaciones ─────────────────────────────────────────────── */}
      {orgs.length > 0 && (
        <div className="card mt-3">
          <div className="card-header">
            <div>
              <div className="card-title">Mis Organizaciones</div>
              <div className="card-subtitle">Resumen de suscripciones activas</div>
            </div>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Organización</th>
                  <th>Plan</th>
                  <th>Integrantes</th>
                  <th>Vence en</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {orgs.map(org => (
                  <tr key={org.id} className={org.id === selectedOrgId ? 'row-active' : ''}>
                    <td>
                      <strong>{org.name}</strong>
                      {org.id === selectedOrgId && (
                        <span
                          className="badge badge-info"
                          style={{ marginLeft: 8, fontSize: 10 }}
                        >
                          ACTUAL
                        </span>
                      )}
                      <br />
                      <span className="text-xs text-secondary">
                        {org.city}, {org.country}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-gold">{org.subscription_plan}</span>
                    </td>
                    <td>
                      {org.current_students_count} / {org.max_students}
                    </td>
                    <td>
                      <span
                        className={
                          org.days_until_expiration <= 15
                            ? 'text-danger font-semi'
                            : 'text-secondary'
                        }
                      >
                        {org.days_until_expiration} días
                      </span>
                    </td>
                    <td>
                      {org.is_active ? (
                        <span className="badge badge-success">Activa</span>
                      ) : (
                        <span className="badge badge-danger">Inactiva</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
