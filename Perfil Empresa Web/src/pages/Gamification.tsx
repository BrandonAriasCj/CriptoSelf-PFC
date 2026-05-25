import React, { useEffect, useState } from 'react';
import { gamificationService } from '../services/api';
import { useOrganization } from '../contexts/OrganizationContext';
import {
  Badge,
  BadgeRarity,
  LeaderboardEntry,
  MemberStats,
  TeamRecord,
} from '../types';

const RARITY_LABEL: Record<BadgeRarity, string> = {
  common: 'Común', rare: 'Raro', epic: 'Épico', legendary: 'Legendario',
};

type Tab = 'leaderboard' | 'badges' | 'records';

function initials(name: string): string {
  return name.split(' ').map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

function rankClass(rank: number): string {
  if (rank === 1) return 'gold';
  if (rank === 2) return 'silver';
  if (rank === 3) return 'bronze';
  return 'normal';
}

function rankChangeChip(change?: number) {
  if (change === undefined || change === 0) {
    return <span className="rank-change flat">─</span>;
  }
  if (change > 0) {
    return <span className="rank-change up">↑{change}</span>;
  }
  return <span className="rank-change down">↓{-change}</span>;
}

export default function Gamification() {
  const { selectedOrgId } = useOrganization();
  const [tab, setTab] = useState<Tab>('leaderboard');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [memberStats, setMemberStats] = useState<MemberStats[]>([]);
  const [badges, setBadges]           = useState<Badge[]>([]);
  const [records, setRecords]         = useState<TeamRecord[]>([]);
  const [loading, setLoading]         = useState(true);
  const [badgeDetail, setBadgeDetail] = useState<Badge | null>(null);

  useEffect(() => {
    if (!selectedOrgId) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      gamificationService.leaderboard(selectedOrgId),
      gamificationService.memberStats(selectedOrgId),
      gamificationService.badges(selectedOrgId),
      gamificationService.records(selectedOrgId),
    ]).then(([lb, ms, bs, rs]) => {
      setLeaderboard(lb);
      setMemberStats(ms);
      setBadges(bs);
      setRecords(rs);
    }).finally(() => setLoading(false));
  }, [selectedOrgId]);

  const summary = {
    totalPoints:    memberStats.reduce((acc, m) => acc + m.total_points, 0),
    totalBadges:    memberStats.reduce((acc, m) => acc + m.badges.length, 0),
    leader:         memberStats[0],
    longestStreak:  memberStats.reduce((max, m) =>
                       m.current_streak_days > (max?.current_streak_days || 0) ? m : max,
                     memberStats[0]),
  };

  return (
    <div className="page fade-in">
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700 }}>🎮 Gamificación</h2>
        <p className="text-secondary text-sm mt-1">Leaderboard, badges y records de tu equipo</p>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon">💎</div>
          <div className="kpi-label">Puntos del equipo</div>
          <div className="kpi-value gold">{summary.totalPoints.toLocaleString()}</div>
          <div className="kpi-delta">acumulados por todos</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">🏅</div>
          <div className="kpi-label">Badges otorgados</div>
          <div className="kpi-value">{summary.totalBadges}</div>
          <div className="kpi-delta">{badges.length} disponibles</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">👑</div>
          <div className="kpi-label">Líder actual</div>
          <div className="kpi-value" style={{ fontSize: 18, lineHeight: 1.2 }}>
            {summary.leader?.member_name?.split(' ')[0] || '—'}
          </div>
          <div className="kpi-delta">{summary.leader?.total_points.toLocaleString() || 0} pts · nivel {summary.leader?.level || '—'}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">🔥</div>
          <div className="kpi-label">Racha más larga activa</div>
          <div className="kpi-value danger" style={{ color: '#fb923c' }}>
            {summary.longestStreak?.current_streak_days || 0}d
          </div>
          <div className="kpi-delta">{summary.longestStreak?.member_name?.split(' ')[0] || '—'}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab-btn ${tab === 'leaderboard' ? 'active' : ''}`} onClick={() => setTab('leaderboard')}>
          🏆 Leaderboard
        </button>
        <button className={`tab-btn ${tab === 'badges' ? 'active' : ''}`} onClick={() => setTab('badges')}>
          🏅 Badges
        </button>
        <button className={`tab-btn ${tab === 'records' ? 'active' : ''}`} onClick={() => setTab('records')}>
          📜 Records
        </button>
      </div>

      {loading ? (
        <div className="card">
          <div className="loading-screen" style={{ minHeight: 240 }}><div className="spinner" /></div>
        </div>
      ) : tab === 'leaderboard' ? (
        <LeaderboardTable entries={leaderboard} memberStats={memberStats} />
      ) : tab === 'badges' ? (
        <BadgesGrid badges={badges} memberStats={memberStats} onSelect={setBadgeDetail} />
      ) : (
        <RecordsGrid records={records} />
      )}

      {badgeDetail && (
        <BadgeDetailModal
          badge={badgeDetail}
          memberStats={memberStats}
          onClose={() => setBadgeDetail(null)}
        />
      )}
    </div>
  );
}

// ── Leaderboard tab ────────────────────────────────────────────────────────
function LeaderboardTable({ entries, memberStats }: { entries: LeaderboardEntry[]; memberStats: MemberStats[] }) {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Ranking global del equipo</div>
          <div className="card-subtitle">Ordenado por puntos acumulados</div>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th style={{ width: 60 }}>#</th>
              <th>Integrante</th>
              <th>Nivel</th>
              <th>Puntos</th>
              <th>Badges</th>
              <th>Racha</th>
              <th style={{ width: 80 }}>Cambio</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(e => {
              const stat = memberStats.find(m => m.member_id === e.member_id);
              return (
                <tr key={e.member_id}>
                  <td>
                    <div className={`rank-pill ${rankClass(e.rank)}`}>{e.rank}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="perf-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                        {initials(e.member_name)}
                      </div>
                      <div>
                        <strong>{e.member_name}</strong><br />
                        <span className="text-xs text-secondary">{e.member_email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="text-gold font-bold">{e.level}</span>
                      <span className="text-xs text-secondary">{e.level_name}</span>
                    </div>
                    {stat && (
                      <div className="progress-bar" style={{ width: 100, marginTop: 4 }}>
                        <div className="progress-fill" style={{ width: `${stat.level_progress_percentage}%` }} />
                      </div>
                    )}
                  </td>
                  <td>
                    <strong className="text-gold">{e.total_points.toLocaleString()}</strong>
                    {stat && stat.points_to_next_level > 0 && (
                      <div className="text-xs text-muted">{stat.points_to_next_level} al siguiente</div>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-gold">🏅 {e.badges_count}</span>
                  </td>
                  <td>
                    {e.current_streak_days > 0 ? (
                      <span className="streak-pill">🔥 {e.current_streak_days}d</span>
                    ) : (
                      <span className="text-muted text-xs">—</span>
                    )}
                  </td>
                  <td>{rankChangeChip(e.rank_change)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Badges tab ─────────────────────────────────────────────────────────────
function BadgesGrid({ badges, memberStats, onSelect }: {
  badges: Badge[];
  memberStats: MemberStats[];
  onSelect: (b: Badge) => void;
}) {
  const holdersOf = (badgeId: string) =>
    memberStats.filter(m => m.badges.some(b => b.badge_id === badgeId));

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">Catálogo de badges</div>
          <div className="card-subtitle">Click en una medalla para ver quién la tiene</div>
        </div>
      </div>
      <div className="badge-grid">
        {badges.map(b => {
          const holders = holdersOf(b.id);
          return (
            <button
              key={b.id}
              className={`badge-medal rarity-bg-${b.rarity}`}
              onClick={() => onSelect(b)}
              style={{ cursor: 'pointer', border: '1px solid' }}
            >
              <div className="badge-medal-icon">{b.icon}</div>
              <div className="badge-medal-name">{b.name}</div>
              <div className={`badge-medal-meta rarity-${b.rarity}`}>{RARITY_LABEL[b.rarity]}</div>
              <div className="badge-medal-desc">{b.description}</div>
              <div className="text-xs text-muted" style={{ marginTop: 4 }}>
                {holders.length} de {memberStats.length} integrantes
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Records tab ────────────────────────────────────────────────────────────
function RecordsGrid({ records }: { records: TeamRecord[] }) {
  return (
    <div className="card-grid">
      {records.map(r => (
        <div key={r.id} className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 36, lineHeight: 1 }}>{r.icon}</div>
            <div style={{ flex: 1 }}>
              <div className="text-xs text-secondary" style={{ textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>
                {r.category_label}
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--gold-400)', lineHeight: 1.1, marginTop: 4 }}>
                {r.value.toLocaleString()}<span style={{ fontSize: 14, color: 'var(--text-secondary)', marginLeft: 4 }}>{r.unit}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'var(--bg-base)', borderRadius: 10 }}>
            <div className="perf-avatar" style={{ width: 30, height: 30, fontSize: 11 }}>
              {initials(r.member_name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="text-sm font-semi">{r.member_name}</div>
              <div className="text-xs text-muted">{new Date(r.achieved_at).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Badge detail modal ─────────────────────────────────────────────────────
function BadgeDetailModal({ badge, memberStats, onClose }: {
  badge: Badge;
  memberStats: MemberStats[];
  onClose: () => void;
}) {
  const holders = memberStats.filter(m => m.badges.some(b => b.badge_id === badge.id));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ fontSize: 36 }}>{badge.icon}</div>
            <div>
              <div className="modal-title">{badge.name}</div>
              <div className={`text-xs font-bold rarity-${badge.rarity}`} style={{ textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 4 }}>
                {RARITY_LABEL[badge.rarity]}
              </div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="text-sm text-secondary mb-3">{badge.description}</div>
        <div className="alert alert-info" style={{ marginBottom: 18 }}>
          <strong>Criterio:</strong>&nbsp;{badge.criteria}
        </div>

        <div className="card-title mb-2">Integrantes que lo tienen ({holders.length})</div>
        {holders.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🔒</div>
            <p>Aún nadie lo ha conseguido.</p>
          </div>
        ) : (
          <div className="perf-list">
            {holders.map(m => {
              const awarded = m.badges.find(b => b.badge_id === badge.id);
              return (
                <div key={m.member_id} className="perf-row">
                  <div className={`rank-pill ${rankClass(m.rank)}`}>{m.rank}</div>
                  <div className="perf-avatar">{initials(m.member_name)}</div>
                  <div className="perf-info">
                    <div className="perf-name">{m.member_name}</div>
                    <div className="perf-meta">
                      Otorgado el {awarded ? new Date(awarded.awarded_at).toLocaleDateString('es-AR') : '—'}
                    </div>
                  </div>
                  <div className="perf-stats">
                    <span className="points-pill">💎 {m.total_points.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
