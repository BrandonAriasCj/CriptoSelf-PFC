import React, { useEffect, useState } from 'react';
import { challengeService, gamificationService } from '../services/api';
import { useOrganization } from '../contexts/OrganizationContext';
import {
  Challenge,
  ChallengeDifficulty,
  ChallengeMetric,
  ChallengeParticipant,
  ChallengeStatus,
  Badge,
} from '../types';

const METRIC_META: Record<ChallengeMetric, { icon: string; label: string; defaultUnit: string; legacy?: boolean }> = {
  // Engagement / avance (recomendadas)
  trades:          { icon: '⚡', label: 'Operaciones realizadas',           defaultUnit: 'trades' },
  backtests:       { icon: '🧠', label: 'Backtests realizados',             defaultUnit: 'backtests' },
  active_days:     { icon: '📅', label: 'Días activos',                     defaultUnit: 'días' },
  streak_days:     { icon: '🔥', label: 'Días consecutivos',                defaultUnit: 'días' },
  distinct_assets: { icon: '🪙', label: 'Criptoactivos distintos operados', defaultUnit: 'cripto' },
  win_rate:        { icon: '🎯', label: 'Win Rate',                         defaultUnit: '%' },
  sharpe_ratio:    { icon: '📐', label: 'Sharpe ratio',                     defaultUnit: '' },
  // Monetarias (legacy)
  pnl:             { icon: '💰', label: 'PnL acumulado',                    defaultUnit: 'USD', legacy: true },
  roi:             { icon: '📈', label: 'ROI',                              defaultUnit: '%',   legacy: true },
  custom:          { icon: '✨', label: 'Personalizado',                    defaultUnit: '' },
};

const DIFFICULTY_LABEL: Record<ChallengeDifficulty, string> = {
  easy: 'Fácil', medium: 'Medio', hard: 'Difícil', epic: 'Épico',
};

const STATUS_LABEL: Record<ChallengeStatus, string> = {
  draft: 'Borrador', active: 'Activo', completed: 'Completado', archived: 'Archivado',
};

const FILTERS: Array<{ key: ChallengeStatus | 'all'; label: string }> = [
  { key: 'all',       label: 'Todos' },
  { key: 'active',    label: 'Activos' },
  { key: 'draft',     label: 'Borradores' },
  { key: 'completed', label: 'Completados' },
  { key: 'archived',  label: 'Archivados' },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
}

function daysLeft(endIso: string): string {
  const diff = Math.ceil((new Date(endIso).getTime() - Date.now()) / 86400000);
  if (diff < 0) return `terminado hace ${-diff}d`;
  if (diff === 0) return 'termina hoy';
  return `quedan ${diff}d`;
}

function initials(name: string): string {
  return name.split(' ').map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

const INTEGER_METRICS = new Set([
  'trades', 'backtests', 'active_days', 'streak_days', 'distinct_assets',
]);

function formatMetricValue(value: string | number | undefined | null, metric?: string): string {
  if (value === undefined || value === null || value === '') return '0';
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (!isFinite(n)) return '0';
  if (metric && INTEGER_METRICS.has(metric)) return String(Math.floor(n));
  return n.toFixed(2).replace(/\.?0+$/, '');
}

export default function Challenges() {
  const { selectedOrgId } = useOrganization();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [badges, setBadges]         = useState<Badge[]>([]);
  const [filter, setFilter]         = useState<ChallengeStatus | 'all'>('all');
  const [loading, setLoading]       = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [detailId, setDetailId]     = useState<string | null>(null);
  const [editing, setEditing]       = useState<Challenge | null>(null);

  const fetchData = () => {
    if (!selectedOrgId) { setLoading(false); return; }
    setLoading(true);
    Promise.all([
      challengeService.list(selectedOrgId),
      gamificationService.badges(selectedOrgId),
    ]).then(([cs, bs]) => {
      setChallenges(cs);
      setBadges(bs);
    }).finally(() => setLoading(false));
  };

  useEffect(fetchData, [selectedOrgId]);

  const visible = filter === 'all'
    ? challenges
    : challenges.filter(c => c.status === filter);

  const summary = {
    active:    challenges.filter(c => c.status === 'active').length,
    completed: challenges.filter(c => c.status === 'completed').length,
    drafts:    challenges.filter(c => c.status === 'draft').length,
    points:    challenges.filter(c => c.status === 'active')
                          .reduce((acc, c) => acc + c.reward_points, 0),
  };

  return (
    <div className="page fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>🏆 Retos y Desafíos</h2>
          <p className="text-secondary text-sm mt-1">Crea metas gamificadas para motivar a los integrantes de tu organización</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + Nuevo Reto
        </button>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon">🎯</div>
          <div className="kpi-label">Retos Activos</div>
          <div className="kpi-value gold">{summary.active}</div>
          <div className="kpi-delta">en ejecución ahora</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">✅</div>
          <div className="kpi-label">Completados</div>
          <div className="kpi-value green">{summary.completed}</div>
          <div className="kpi-delta">histórico total</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">📝</div>
          <div className="kpi-label">Borradores</div>
          <div className="kpi-value">{summary.drafts}</div>
          <div className="kpi-delta">listos para lanzar</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon">💎</div>
          <div className="kpi-label">Puntos en juego</div>
          <div className="kpi-value gold">{summary.points.toLocaleString()}</div>
          <div className="kpi-delta">de retos activos</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="chip-row">
        {FILTERS.map(f => (
          <button
            key={f.key}
            className={`chip ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            {' '}
            <span style={{ opacity: 0.6 }}>
              {f.key === 'all'
                ? challenges.length
                : challenges.filter(c => c.status === f.key).length}
            </span>
          </button>
        ))}
      </div>

      {/* Grid de retos */}
      {loading ? (
        <div className="card">
          <div className="loading-screen" style={{ minHeight: 240 }}><div className="spinner" /></div>
        </div>
      ) : visible.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="icon">🏆</div>
            <h3>No hay retos</h3>
            <p>Creá el primero con el botón "Nuevo Reto" arriba.</p>
          </div>
        </div>
      ) : (
        <div className="card-grid">
          {visible.map(c => (
            <ChallengeCard
              key={c.id}
              challenge={c}
              badges={badges}
              onOpen={() => setDetailId(c.id)}
              onEdit={() => setEditing(c)}
              onChanged={fetchData}
            />
          ))}
        </div>
      )}

      {showCreate && selectedOrgId && (
        <CreateChallengeModal
          orgId={selectedOrgId}
          badges={badges}
          existing={null}
          onClose={() => setShowCreate(false)}
          onSaved={() => { setShowCreate(false); fetchData(); }}
        />
      )}

      {editing && selectedOrgId && (
        <CreateChallengeModal
          orgId={selectedOrgId}
          badges={badges}
          existing={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); fetchData(); }}
        />
      )}

      {detailId && (
        <ChallengeDetailModal
          challengeId={detailId}
          challenge={challenges.find(c => c.id === detailId)!}
          badge={badges.find(b => b.id === challenges.find(c => c.id === detailId)?.reward_badge_id)}
          onClose={() => setDetailId(null)}
        />
      )}
    </div>
  );
}

// ── Challenge Card ──────────────────────────────────────────────────────────
function ChallengeCard({ challenge, badges, onOpen, onEdit, onChanged }: {
  challenge: Challenge;
  badges: Badge[];
  onOpen: () => void;
  onEdit: () => void;
  onChanged: () => void;
}) {
  const meta  = METRIC_META[challenge.metric];
  const badge = challenge.reward_badge_id ? badges.find(b => b.id === challenge.reward_badge_id) : undefined;
  const status = challenge.status;
  const [busy, setBusy] = useState(false);

  const publish = async (action: 'publish' | 'archive' | 'draft') => {
    setBusy(true);
    try {
      await challengeService.publish(challenge.id, action);
      onChanged();
    } finally { setBusy(false); }
  };

  const remove = async () => {
    if (!confirm(`¿Eliminar el reto "${challenge.name}"? Esta acción no se puede deshacer.`)) return;
    setBusy(true);
    try {
      await challengeService.delete(challenge.id);
      onChanged();
    } finally { setBusy(false); }
  };

  return (
    <div className="card challenge-card">
      <div className="challenge-head">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="challenge-meta" style={{ marginBottom: 8 }}>
            <span className={`tag diff-${challenge.difficulty}`}>{DIFFICULTY_LABEL[challenge.difficulty]}</span>
            <span className={`badge ${status === 'active' ? 'badge-info' : status === 'completed' ? 'badge-success' : status === 'draft' ? 'badge-warning' : 'badge-danger'}`}>
              {STATUS_LABEL[status]}
            </span>
            {challenge.is_global && <span className="badge badge-gold">Global</span>}
          </div>
          <div className="challenge-title">
            <span style={{ marginRight: 6 }}>{meta.icon}</span>
            {challenge.name}
          </div>
        </div>
      </div>

      <div className="challenge-desc">{challenge.description}</div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="text-xs text-secondary">
          Objetivo: <strong className="text-gold">{formatMetricValue(challenge.target_value, challenge.metric)}{challenge.unit ? ` ${challenge.unit}` : ''}</strong>
        </div>
        <span className="points-pill">💎 {challenge.reward_points} pts</span>
        {badge && <span className="points-pill" style={{ background: 'rgba(192,132,252,0.12)', color: '#c084fc' }}>{badge.icon} {badge.name}</span>}
      </div>

      <div>
        <div className="challenge-progress-label">
          <span>Progreso agregado del equipo</span>
          <span className="font-semi text-primary">{challenge.average_progress}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{
            width: `${challenge.average_progress}%`,
            background: challenge.average_progress >= 100
              ? 'linear-gradient(90deg,#10b981,#34d399)'
              : undefined,
          }} />
        </div>
        <div className="text-xs text-muted mt-1">
          {challenge.completed_count} de {challenge.total_participants} completados ·
          {' '}{challenge.in_progress_count} en curso
        </div>
      </div>

      <div className="challenge-foot">
        <span>{formatDate(challenge.start_date)} → {formatDate(challenge.end_date)}</span>
        <span>{status === 'active' ? daysLeft(challenge.end_date) : ''}</span>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button className="btn btn-ghost btn-sm" onClick={onOpen} disabled={busy}>
          👥 Participantes
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onEdit} disabled={busy}>
          ✏️ Editar
        </button>
        {status === 'draft' && (
          <button className="btn btn-primary btn-sm" onClick={() => publish('publish')} disabled={busy}>
            🚀 Publicar
          </button>
        )}
        {status === 'active' && (
          <button className="btn btn-ghost btn-sm" onClick={() => publish('archive')} disabled={busy}>
            📦 Archivar
          </button>
        )}
        {status === 'archived' && (
          <button className="btn btn-ghost btn-sm" onClick={() => publish('draft')} disabled={busy}>
            ↩️ A borrador
          </button>
        )}
        <button className="btn btn-danger btn-sm" onClick={remove} disabled={busy}
                style={{ marginLeft: 'auto' }}>
          🗑️ Eliminar
        </button>
      </div>
    </div>
  );
}

// ── Create / Edit Modal ─────────────────────────────────────────────────────
function CreateChallengeModal({ orgId, badges, existing, onClose, onSaved }: {
  orgId: string;
  badges: Badge[];
  existing: Challenge | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!existing;
  const initialDays = existing
    ? Math.max(1, Math.round((new Date(existing.end_date).getTime() - new Date(existing.start_date).getTime()) / 86400000))
    : 14;
  const [form, setForm] = useState({
    name: existing?.name || '',
    description: existing?.description || '',
    metric: (existing?.metric || 'trades') as ChallengeMetric,
    target_value: existing ? Number(existing.target_value) : 100,
    unit: existing?.unit || METRIC_META.trades.defaultUnit,
    reward_points: existing?.reward_points || 500,
    reward_badge_id: existing?.reward_badge_id || '',
    difficulty: (existing?.difficulty || 'medium') as ChallengeDifficulty,
    is_global: existing?.is_global ?? true,
    duration_days: initialDays,
  });
  const [saving, setSaving] = useState(false);

  const handleMetricChange = (metric: ChallengeMetric) => {
    setForm(f => ({ ...f, metric, unit: METRIC_META[metric].defaultUnit }));
  };

  const handleSubmit = async (publish: boolean) => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        reward_badge_id: form.reward_badge_id || undefined,
      };
      if (isEdit && existing) {
        await challengeService.update(existing.id, {
          ...payload,
          status: publish ? 'active' : existing.status,
        });
      } else {
        const start = new Date();
        const end = new Date(Date.now() + form.duration_days * 86400000);
        await challengeService.create(orgId, {
          ...payload,
          status: publish ? 'active' : 'draft',
          start_date: start.toISOString(),
          end_date: end.toISOString(),
        });
      }
      onSaved();
    } finally { setSaving(false); }
  };

  const isValid = form.name.trim().length > 2 && form.target_value > 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{isEdit ? '✏️ Editar Reto' : '🏆 Nuevo Reto'}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="form-group">
          <label className="form-label">Nombre del reto *</label>
          <input className="form-input" placeholder="Ej: Maratón de Backtests"
            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>

        <div className="form-group">
          <label className="form-label">Descripción</label>
          <textarea className="form-input" rows={3} placeholder="Qué deben hacer los integrantes y por qué…"
            value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Métrica a medir</label>
            <select className="form-input" value={form.metric}
              onChange={e => handleMetricChange(e.target.value as ChallengeMetric)}>
              {(() => {
                const allowed: ChallengeMetric[] = ['trades', 'backtests', 'distinct_assets'];
                // Si editás un reto con métrica legacy, mantenerla disponible para no perderla
                const options = allowed.includes(form.metric)
                  ? allowed
                  : [form.metric, ...allowed];
                return options.map(k => (
                  <option key={k} value={k}>{METRIC_META[k].icon} {METRIC_META[k].label}</option>
                ));
              })()}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Dificultad</label>
            <select className="form-input" value={form.difficulty}
              onChange={e => setForm({ ...form, difficulty: e.target.value as ChallengeDifficulty })}>
              {Object.entries(DIFFICULTY_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Valor objetivo *</label>
            <input className="form-input" type="number" step="any" min={0}
              value={form.target_value}
              onChange={e => setForm({ ...form, target_value: Number(e.target.value) })} />
          </div>
          <div className="form-group">
            <label className="form-label">Unidad</label>
            <input className="form-input" placeholder="USD, %, trades…"
              value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} />
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Recompensa en puntos</label>
            <input className="form-input" type="number" min={0} step={50}
              value={form.reward_points}
              onChange={e => setForm({ ...form, reward_points: Number(e.target.value) })} />
          </div>
          <div className="form-group">
            <label className="form-label">Duración (días)</label>
            <input className="form-input" type="number" min={1} max={365}
              value={form.duration_days}
              onChange={e => setForm({ ...form, duration_days: Number(e.target.value) })} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Badge de recompensa (opcional)</label>
          <select className="form-input" value={form.reward_badge_id}
            onChange={e => setForm({ ...form, reward_badge_id: e.target.value })}>
            <option value="">Sin badge</option>
            {badges.map(b => (
              <option key={b.id} value={b.id}>{b.icon} {b.name} — {b.rarity}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={form.is_global}
              onChange={e => setForm({ ...form, is_global: e.target.checked })}
              style={{ width: 16, height: 16, accentColor: 'var(--brand-500)' }} />
            <span className="text-sm">Asignar a toda la organización</span>
          </label>
          {!form.is_global && (
            <div className="text-xs text-muted mt-1">
              La selección manual de integrantes se habilitará cuando el backend exponga el endpoint de asignación.
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          {!isEdit && (
            <button className="btn btn-ghost" onClick={() => handleSubmit(false)} disabled={!isValid || saving}>
              Guardar borrador
            </button>
          )}
          {isEdit ? (
            <button className="btn btn-primary" onClick={() => handleSubmit(false)} disabled={!isValid || saving}>
              {saving ? '⟳ Guardando...' : '💾 Guardar cambios'}
            </button>
          ) : (
            <button className="btn btn-primary" onClick={() => handleSubmit(true)} disabled={!isValid || saving}>
              {saving ? '⟳ Lanzando...' : '🚀 Lanzar reto'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Detail Modal ────────────────────────────────────────────────────────────
function ChallengeDetailModal({ challengeId, challenge, badge, onClose }: {
  challengeId: string;
  challenge: Challenge;
  badge?: Badge;
  onClose: () => void;
}) {
  const [participants, setParticipants] = useState<ChallengeParticipant[]>([]);
  const [loading, setLoading]           = useState(true);
  const meta = METRIC_META[challenge.metric];

  useEffect(() => {
    challengeService.participants(challengeId)
      .then(setParticipants)
      .finally(() => setLoading(false));
  }, [challengeId]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card wide" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">
              {meta.icon} {challenge.name}
            </div>
            <div className="text-sm text-secondary mt-1">{challenge.description}</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
          <span className={`tag diff-${challenge.difficulty}`}>{DIFFICULTY_LABEL[challenge.difficulty]}</span>
          <span className="badge badge-info">{STATUS_LABEL[challenge.status]}</span>
          <span className="points-pill">💎 {challenge.reward_points} pts</span>
          <span className="text-sm text-secondary">
            Objetivo: <strong className="text-gold">{formatMetricValue(challenge.target_value, challenge.metric)} {challenge.unit}</strong>
          </span>
          {badge && (
            <span className="points-pill" style={{ background: 'rgba(192,132,252,0.12)', color: '#c084fc' }}>
              {badge.icon} {badge.name}
            </span>
          )}
        </div>

        <div className="card-title mb-2">Leaderboard del reto</div>

        {loading ? (
          <div className="loading-screen" style={{ minHeight: 140 }}><div className="spinner" /></div>
        ) : participants.length === 0 ? (
          <div className="empty-state">
            <div className="icon">👥</div>
            <p>Sin participantes todavía.</p>
          </div>
        ) : (
          <div className="perf-list">
            {participants.map(p => {
              const rankClass = p.rank === 1 ? 'gold' : p.rank === 2 ? 'silver' : p.rank === 3 ? 'bronze' : 'normal';
              return (
                <div key={p.member_id} className="perf-row">
                  <div className={`rank-pill ${rankClass}`}>{p.rank}</div>
                  <div className="perf-avatar">{initials(p.member_name)}</div>
                  <div className="perf-info">
                    <div className="perf-name">{p.member_name}</div>
                    <div className="perf-meta">
                      {formatMetricValue(p.current_value, challenge.metric)}{challenge.unit ? ` ${challenge.unit}` : ''} de {formatMetricValue(challenge.target_value, challenge.metric)}
                      {p.status === 'completed' && <span className="text-success font-semi"> · ✓ completado</span>}
                    </div>
                  </div>
                  <div className="perf-stats">
                    <div className="perf-grade" style={{ color: p.progress_percentage >= 100 ? 'var(--success)' : 'var(--text-primary)' }}>
                      {Math.round(Number(p.progress_percentage))}%
                    </div>
                    <div className="progress-bar perf-progress">
                      <div className="progress-fill" style={{
                        width: `${p.progress_percentage}%`,
                        background: p.progress_percentage >= 100
                          ? 'linear-gradient(90deg,#10b981,#34d399)'
                          : undefined,
                      }} />
                    </div>
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
