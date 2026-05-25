import React, { useEffect, useMemo, useState } from 'react';
import { studentService, orgService, gamificationService } from '../services/api';
import { useOrganization } from '../contexts/OrganizationContext';
import { MemberRow, MemberStats, MemberStatus, StudentEnrollment } from '../types';

const STATUS_MAP: Record<MemberStatus, { label: string; cls: string }> = {
  enrolled:  { label: 'Pendiente', cls: 'badge-info' },
  active:    { label: 'Activo',    cls: 'badge-success' },
  dropped:   { label: 'Baja',      cls: 'badge-danger' },
  suspended: { label: 'Suspendido', cls: 'badge-warning' },
};

const LEVEL_COLOR = (level: number) => {
  if (level >= 6) return '#a855f7';
  if (level >= 4) return '#f59e0b';
  if (level >= 2) return '#3b82f6';
  return '#64748b';
};

export default function Students() {
  const { selectedOrgId } = useOrganization();
  const [members, setMembers]   = useState<MemberRow[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [statusF, setStatusF]   = useState<'' | MemberStatus>('');
  const [selected, setSelected] = useState<MemberRow | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [editing, setEditing]   = useState<MemberRow | null>(null);
  const [toast, setToast]       = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);

  const fetchMembers = async () => {
    if (!selectedOrgId) { setMembers([]); setLoading(false); return; }
    setLoading(true);
    try {
      const params: Record<string, string> = { organization: selectedOrgId };
      if (search)  params.search = search;
      if (statusF) params.status = statusF;

      const [enrollmentsRes, statsArr] = await Promise.all([
        studentService.list(params),
        gamificationService.memberStats(selectedOrgId).catch(() => [] as MemberStats[]),
      ]);

      const enrollmentsRaw: StudentEnrollment[] = enrollmentsRes.data.results || enrollmentsRes.data;
      // Sin filtro explícito de estado, ocultamos los dados de baja.
      const enrollments = statusF
        ? enrollmentsRaw
        : enrollmentsRaw.filter(e => e.status !== 'dropped');

      const statsByMember = new Map<number, MemberStats>(
        (statsArr as MemberStats[]).map(s => [Number(s.member_id), s])
      );

      const rows: MemberRow[] = enrollments.map(e => {
        const s = statsByMember.get(Number(e.student));
        return {
          ...e,
          total_points:              s?.total_points ?? 0,
          level:                     s?.level ?? 1,
          level_name:                s?.level_name ?? 'Iniciado',
          level_progress_percentage: s?.level_progress_percentage ?? 0,
          points_to_next_level:      s?.points_to_next_level ?? 0,
          current_streak_days:       s?.current_streak_days ?? 0,
          longest_streak_days:       s?.longest_streak_days ?? 0,
          badges_count:              s?.badges.length ?? 0,
          challenges_completed:      s?.challenges_completed ?? 0,
          challenges_in_progress:    s?.challenges_in_progress ?? 0,
          rank:                      s?.rank,
        };
      });

      setMembers(rows);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); /* eslint-disable-next-line */ }, [search, statusF, selectedOrgId]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const handleDrop = async (m: MemberRow) => {
    if (!confirm(`¿Dar de baja a ${m.student_name}? Podrás reactivarlo después editando su estado.`)) return;
    try {
      await studentService.drop(m.id);
      setToast({ kind: 'ok', msg: `${m.student_name} fue dado de baja.` });
      if (selected?.id === m.id) setSelected(null);
      fetchMembers();
    } catch {
      setToast({ kind: 'err', msg: 'No se pudo dar de baja.' });
    }
  };

  const totals = useMemo(() => ({
    total:    members.length,
    active:   members.filter(m => m.status === 'active').length,
    points:   members.reduce((acc, m) => acc + m.total_points, 0),
    badges:   members.reduce((acc, m) => acc + m.badges_count, 0),
  }), [members]);

  return (
    <div className="page fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>Gestión de Integrantes</h2>
          <p className="text-secondary text-sm mt-1">Administra a tu equipo, sus puntos, retos y badges</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="badge badge-info" style={{ fontSize: 14, padding: '6px 14px' }}>
            {totals.total} integrantes
          </div>
          <button className="btn btn-primary" onClick={() => setShowInvite(true)} disabled={!selectedOrgId}>
            ✉️ Invitar miembros
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total',      value: totals.total,  icon: '👥' },
          { label: 'Activos',    value: totals.active, icon: '🟢' },
          { label: 'Puntos eq.', value: totals.points, icon: '⭐' },
          { label: 'Badges',     value: totals.badges, icon: '🏅' },
        ].map(k => (
          <div key={k.label} className="card" style={{ padding: 14 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{k.icon} {k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input className="form-input" style={{ maxWidth: 280 }} placeholder="🔍 Buscar por nombre, email o ID..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="form-input" style={{ maxWidth: 180 }} value={statusF}
          onChange={e => setStatusF(e.target.value as '' | MemberStatus)}>
          <option value="">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="enrolled">Pendientes</option>
          <option value="suspended">Suspendidos</option>
          <option value="dropped">Baja</option>
        </select>
      </div>

      <div>
        {/* Table */}
        <div className="card">
          {loading ? (
            <div className="loading-screen" style={{ minHeight: 200 }}><div className="spinner" /></div>
          ) : members.length === 0 ? (
            <div className="empty-state">
              <div className="icon">👥</div>
              <h3>Sin integrantes</h3>
              <p>Invita a miembros con el botón "Invitar miembros" para empezar.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Integrante</th>
                    <th>Estado</th>
                    <th>Puntos</th>
                    <th>Nivel</th>
                    <th>Racha</th>
                    <th>Retos</th>
                    <th>Badges</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map(m => {
                    const sta = STATUS_MAP[m.status] || STATUS_MAP.enrolled;
                    return (
                      <tr key={m.id} style={{ cursor: 'pointer' }}>
                        <td onClick={() => setSelected(m)}>
                          <strong>{m.student_name || '—'}</strong><br />
                          <span className="text-xs text-secondary">{m.student_email}</span>
                        </td>
                        <td><span className={`badge ${sta.cls}`}>{sta.label}</span></td>
                        <td>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            ⭐ {m.total_points.toLocaleString()}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 130 }}>
                            <span style={{
                              background: LEVEL_COLOR(m.level),
                              color: 'white', borderRadius: 6, padding: '2px 8px',
                              fontSize: 12, fontWeight: 700,
                            }}>
                              Lv{m.level}
                            </span>
                            <span className="text-xs text-secondary" style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {m.level_name}
                            </span>
                          </div>
                        </td>
                        <td>
                          {m.current_streak_days > 0
                            ? <span title={`Récord: ${m.longest_streak_days}d`}>🔥 {m.current_streak_days}d</span>
                            : <span className="text-muted text-xs">—</span>}
                        </td>
                        <td>
                          <span className="text-xs">
                            <strong style={{ color: 'var(--success)' }}>{m.challenges_completed}</strong>
                            <span className="text-muted"> / </span>
                            <span>{m.challenges_in_progress} activos</span>
                          </span>
                        </td>
                        <td>
                          {m.badges_count > 0
                            ? <span>🏅 {m.badges_count}</span>
                            : <span className="text-muted text-xs">—</span>}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-sm btn-ghost" onClick={() => setSelected(m)}>
                              Ver
                            </button>
                            <button className="btn btn-sm btn-ghost" onClick={() => setEditing(m)}>
                              Editar
                            </button>
                            {m.status !== 'dropped' && (
                              <button className="btn btn-sm btn-danger" onClick={() => handleDrop(m)}>
                                Baja
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Detail modal */}
      {selected && (
        <MemberDetail
          member={selected}
          onClose={() => setSelected(null)}
          onEdit={() => { setEditing(selected); setSelected(null); }}
        />
      )}

      {showInvite && selectedOrgId && (
        <InviteModal
          orgId={selectedOrgId}
          onClose={() => setShowInvite(false)}
          onInvited={() => { setShowInvite(false); fetchMembers(); }}
        />
      )}

      {editing && (
        <EditMemberModal
          member={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setEditing(null);
            setToast({ kind: 'ok', msg: `Cambios guardados para ${updated.student_name}.` });
            if (selected?.id === updated.id) setSelected({ ...selected, ...updated });
            fetchMembers();
          }}
          onError={(msg) => setToast({ kind: 'err', msg })}
        />
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 200,
          background: toast.kind === 'ok' ? 'var(--success)' : 'var(--danger)',
          color: 'white', padding: '10px 16px', borderRadius: 10,
          boxShadow: '0 6px 20px rgba(0,0,0,.2)', fontSize: 14,
        }}>
          {toast.kind === 'ok' ? '✓ ' : '⚠ '}{toast.msg}
        </div>
      )}
    </div>
  );
}

// ── Detail panel ─────────────────────────────────────────────────────────────
function MemberDetail({ member, onClose, onEdit }: {
  member: MemberRow;
  onClose: () => void;
  onEdit: () => void;
}) {
  const sta = STATUS_MAP[member.status] || STATUS_MAP.enrolled;
  const lvlColor = LEVEL_COLOR(member.level);
  const initials = (member.student_name || '?')
    .split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  // Completion ratio (info engagement)
  const totalRetos = member.challenges_completed + member.challenges_in_progress;
  const completionRate = totalRetos > 0
    ? Math.round((member.challenges_completed / totalRetos) * 100)
    : 0;

  const rankMedal = (() => {
    if (member.rank === 1) return { emoji: '🥇', label: '1er lugar' };
    if (member.rank === 2) return { emoji: '🥈', label: '2do lugar' };
    if (member.rank === 3) return { emoji: '🥉', label: '3er lugar' };
    return member.rank ? { emoji: '🏅', label: `#${member.rank} en leaderboard` } : null;
  })();

  return (
    <div className="modal-backdrop" onClick={onClose}>
    <div className="modal-card fade-in" onClick={e => e.stopPropagation()}
      style={{ padding: 0, overflow: 'hidden', maxWidth: 560, width: '100%' }}>
      {/* HERO */}
      <div style={{
        position: 'relative',
        background: `linear-gradient(135deg, ${lvlColor}33 0%, ${lvlColor}0d 60%, transparent 100%)`,
        padding: '18px 20px 20px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6,
        }}>
          <button className="btn btn-sm btn-ghost" onClick={onEdit} title="Editar">✏️</button>
          <button className="btn btn-sm btn-ghost" onClick={onClose} title="Cerrar">✕</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Avatar con anillo de nivel */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 76, height: 76, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `conic-gradient(${lvlColor} ${member.level_progress_percentage * 3.6}deg, var(--border) 0)`,
              padding: 3,
            }}>
              <div className="avatar" style={{
                width: 70, height: 70, fontSize: 26, fontWeight: 700,
                background: `linear-gradient(135deg, ${lvlColor}, ${lvlColor}aa)`,
                color: 'white', border: '3px solid var(--bg-elev, var(--bg-base))',
              }}>
                {initials}
              </div>
            </div>
            <div style={{
              position: 'absolute', bottom: -4, right: -4,
              background: lvlColor, color: 'white',
              borderRadius: 12, padding: '2px 8px',
              fontSize: 11, fontWeight: 800,
              boxShadow: '0 2px 8px rgba(0,0,0,.25)',
              border: '2px solid var(--bg-card, var(--bg-base))',
            }}>
              Lv{member.level}
            </div>
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 18, lineHeight: 1.2 }}>
              {member.student_name || '—'}
            </div>
            <div className="text-sm text-secondary" style={{
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2,
            }}>
              {member.student_email}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span className={`badge ${sta.cls}`}>{sta.label}</span>
              {member.institutional_id && (
                <span className="text-xs text-muted">ID: {member.institutional_id}</span>
              )}
            </div>
          </div>
        </div>

        {rankMedal && (
          <div style={{
            marginTop: 14, padding: '8px 12px',
            background: 'rgba(255,255,255,.04)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 20 }}>{rankMedal.emoji}</span>
            <span style={{ fontWeight: 600, fontSize: 13 }}>{rankMedal.label}</span>
          </div>
        )}
      </div>

      {/* BODY */}
      <div style={{ padding: 20 }}>
        {/* Level progress card */}
        <div style={{
          background: 'var(--bg-base)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase' }}>
                Nivel actual
              </div>
              <div style={{ fontWeight: 700, fontSize: 16, marginTop: 2 }}>
                {member.level_name}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 800, fontSize: 22, color: lvlColor, lineHeight: 1 }}>
                {member.total_points.toLocaleString()}
              </div>
              <div className="text-xs text-muted">puntos</div>
            </div>
          </div>
          <div className="progress-bar" style={{ height: 10 }}>
            <div className="progress-fill" style={{
              width: `${member.level_progress_percentage}%`,
              background: `linear-gradient(90deg, ${lvlColor}, ${lvlColor}cc)`,
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span className="text-xs text-muted">{member.level_progress_percentage}% al siguiente nivel</span>
            <span className="text-xs text-secondary" style={{ fontWeight: 600 }}>
              faltan {member.points_to_next_level.toLocaleString()} pts
            </span>
          </div>
        </div>

        {/* Stat tiles */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 10,
          marginBottom: 16,
        }}>
          <StatTile icon="🔥" tint="#ef4444" label="Racha actual"
            value={`${member.current_streak_days}`} suffix="días" />
          <StatTile icon="🏆" tint="#f59e0b" label="Mejor racha"
            value={`${member.longest_streak_days}`} suffix="días" />
          <StatTile icon="🏅" tint="#a855f7" label="Badges ganados"
            value={member.badges_count} />
          <StatTile icon="🎯" tint="#3b82f6" label="Retos activos"
            value={member.challenges_in_progress} />
        </div>

        {/* Engagement (retos) */}
        <div style={{
          background: 'var(--bg-base)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>🎮 Engagement en retos</div>
            <span className="text-xs text-secondary" style={{ fontWeight: 600 }}>
              {member.challenges_completed} de {totalRetos || 0}
            </span>
          </div>
          {totalRetos > 0 ? (
            <>
              <div style={{
                display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden',
                background: 'var(--border)',
              }}>
                <div style={{
                  width: `${completionRate}%`,
                  background: 'linear-gradient(90deg,#10b981,#34d399)',
                  transition: 'width .4s ease',
                }} />
                <div style={{
                  width: `${100 - completionRate}%`,
                  background: 'linear-gradient(90deg,#3b82f6,#60a5fa)',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12 }}>
                <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                  ✓ {member.challenges_completed} completados
                </span>
                <span style={{ color: 'var(--info, #3b82f6)', fontWeight: 600 }}>
                  ⏳ {member.challenges_in_progress} en curso
                </span>
              </div>
            </>
          ) : (
            <div className="text-sm text-muted" style={{ textAlign: 'center', padding: '8px 0' }}>
              Sin retos asignados aún.
            </div>
          )}
        </div>

        {/* Notas internas */}
        {member.instructor_notes ? (
          <div style={{
            background: 'rgba(245, 158, 11, .06)',
            border: '1px solid rgba(245, 158, 11, .3)',
            borderRadius: 12,
            padding: 14,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 16 }}>📝</span>
              <span style={{ fontWeight: 700, fontSize: 13 }}>Notas internas</span>
            </div>
            <p className="text-sm" style={{ whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.5 }}>
              {member.instructor_notes}
            </p>
          </div>
        ) : (
          <button className="btn btn-sm btn-ghost" onClick={onEdit}
            style={{ width: '100%', justifyContent: 'center' }}>
            + Agregar notas internas
          </button>
        )}
      </div>
    </div>
    </div>
  );
}

function StatTile({ icon, tint, label, value, suffix }: {
  icon: string;
  tint: string;
  label: string;
  value: number | string;
  suffix?: string;
}) {
  return (
    <div style={{
      background: 'var(--bg-base)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: 12,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: tint,
      }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `${tint}22`,
          fontSize: 18,
        }}>{icon}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="text-xs text-muted" style={{
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{label}</div>
          <div style={{ fontWeight: 700, fontSize: 18, lineHeight: 1.1, marginTop: 2 }}>
            {value}
            {suffix && <span className="text-xs text-muted" style={{ marginLeft: 4, fontWeight: 500 }}>{suffix}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Edit modal ───────────────────────────────────────────────────────────────
function EditMemberModal({ member, onClose, onSaved, onError }: {
  member: MemberRow;
  onClose: () => void;
  onSaved: (m: MemberRow) => void;
  onError: (msg: string) => void;
}) {
  const [institutionalId, setInstitutionalId] = useState(member.institutional_id || '');
  const [status, setStatus]                   = useState<MemberStatus>(member.status);
  const [notes, setNotes]                     = useState(member.instructor_notes || '');
  const [saving, setSaving]                   = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await studentService.update(member.id, {
        institutional_id: institutionalId,
        status,
        instructor_notes: notes,
      });
      onSaved({ ...member, ...data });
    } catch (e) {
      const err = e as { response?: { data?: { error?: string; detail?: string } } };
      onError(err.response?.data?.error || err.response?.data?.detail || 'No se pudieron guardar los cambios.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">✏️ Editar integrante</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="text-sm text-secondary mb-3">
          {member.student_name} · {member.student_email}
        </div>

        <div className="form-group">
          <label className="form-label">ID interno</label>
          <input className="form-input" value={institutionalId}
            onChange={e => setInstitutionalId(e.target.value)}
            placeholder="Ej: EMP-001" />
        </div>

        <div className="form-group">
          <label className="form-label">Estado</label>
          <select className="form-input" value={status}
            onChange={e => setStatus(e.target.value as MemberStatus)}>
            <option value="enrolled">Pendiente</option>
            <option value="active">Activo</option>
            <option value="suspended">Suspendido</option>
            <option value="dropped">Baja</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Notas internas</label>
          <textarea className="form-input" rows={4} value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notas privadas del equipo administrador..." />
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? '⟳ Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Invite modal (sin cambios funcionales) ───────────────────────────────────
function InviteModal({ orgId, onClose, onInvited }: {
  orgId: string;
  onClose: () => void;
  onInvited: () => void;
}) {
  const [emailsRaw, setEmailsRaw] = useState('');
  const [message, setMessage]     = useState('');
  const [sending, setSending]     = useState(false);
  const [result, setResult]       = useState<{ invitations_created: string[]; errors: { email: string; error: string }[] } | null>(null);
  const [error, setError]         = useState('');

  const parsedEmails = emailsRaw
    .split(/[,;\s\n]+/)
    .map(e => e.trim())
    .filter(e => e.includes('@'));

  const handleSend = async () => {
    if (parsedEmails.length === 0) {
      setError('Ingresá al menos un email válido.');
      return;
    }
    setSending(true); setError('');
    try {
      const data = await orgService.bulkInvite(orgId, parsedEmails, message);
      setResult(data);
    } catch (e) {
      const err = e as { response?: { data?: { error?: string } } };
      setError(err.response?.data?.error || 'Error al enviar invitaciones.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">✉️ Invitar miembros</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {result ? (
          <>
            <div className="alert alert-success">
              ✓ {result.invitations_created.length} invitaciones enviadas correctamente.
            </div>
            {result.invitations_created.length > 0 && (
              <div className="text-xs text-secondary mb-3" style={{ maxHeight: 120, overflowY: 'auto' }}>
                {result.invitations_created.map(e => <div key={e}>· {e}</div>)}
              </div>
            )}
            {result.errors.length > 0 && (
              <div className="alert alert-error">
                ⚠ {result.errors.length} fallaron:
                <div className="text-xs mt-2">
                  {result.errors.map(err => <div key={err.email}>{err.email}: {err.error}</div>)}
                </div>
              </div>
            )}
            <div className="text-sm text-secondary mt-3">
              Los usuarios web verán la invitación al loguearse en su panel (sección "Mis Retos").
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-primary" onClick={onInvited}>Cerrar</button>
            </div>
          </>
        ) : (
          <>
            {error && <div className="alert alert-error">⚠ {error}</div>}

            <div className="form-group">
              <label className="form-label">Emails (separados por coma, espacio o salto de línea)</label>
              <textarea className="form-input" rows={5}
                placeholder="usuario1@ejemplo.com, usuario2@ejemplo.com&#10;usuario3@ejemplo.com"
                value={emailsRaw}
                onChange={e => setEmailsRaw(e.target.value)} />
              {parsedEmails.length > 0 && (
                <div className="text-xs text-secondary mt-1">
                  Detectados: {parsedEmails.length} email(s)
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Mensaje personalizado (opcional)</label>
              <textarea className="form-input" rows={3}
                placeholder="Te invitamos a participar en nuestros retos de trading..."
                value={message}
                onChange={e => setMessage(e.target.value)} />
            </div>

            <div className="text-xs text-muted mt-2">
              Los invitados recibirán acceso para aceptar o rechazar desde su perfil de usuario web.
              Si ya tienen cuenta CriptoSelf, el vínculo es inmediato al aceptar.
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSend}
                      disabled={parsedEmails.length === 0 || sending}>
                {sending ? '⟳ Enviando...' : `Enviar ${parsedEmails.length || ''} invitación(es)`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
