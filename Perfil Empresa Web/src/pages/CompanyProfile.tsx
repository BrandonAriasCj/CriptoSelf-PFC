import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/api';

export default function CompanyProfile() {
  const { user, refreshProfile } = useAuth();
  const cp = user?.company_profile;

  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name:  user?.last_name  || '',
    phone_number: '',
    company_profile: {
      company_name:    cp?.company_name    || '',
      industry:        cp?.industry        || '',
      company_size:    cp?.company_size    || '11-50',
      tax_id:          cp?.tax_id          || '',
      company_website: cp?.company_website || '',
      company_address: cp?.company_address || '',
      company_country: cp?.company_country || '',
      company_city:    cp?.company_city    || '',
      notify_reports:  cp?.notify_reports  ?? true,
      notify_students: cp?.notify_students ?? true,
    },
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError]     = useState('');

  useEffect(() => {
    if (user) {
      setForm(p => ({
        ...p,
        first_name: user.first_name,
        last_name:  user.last_name,
        company_profile: {
          company_name:    user.company_profile?.company_name    || '',
          industry:        user.company_profile?.industry        || '',
          company_size:    user.company_profile?.company_size    || '11-50',
          tax_id:          user.company_profile?.tax_id          || '',
          company_website: user.company_profile?.company_website || '',
          company_address: user.company_profile?.company_address || '',
          company_country: user.company_profile?.company_country || '',
          company_city:    user.company_profile?.company_city    || '',
          notify_reports:  user.company_profile?.notify_reports  ?? true,
          notify_students: user.company_profile?.notify_students ?? true,
        },
      }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      await authService.updateProfile(form as unknown as Record<string, unknown>);
      await refreshProfile();
      setSuccess('Perfil actualizado correctamente.');
    } catch {
      setError('Error al actualizar el perfil.');
    } finally { setLoading(false); }
  };

  const upCp = (k: string, v: string | boolean) =>
    setForm(p => ({ ...p, company_profile: { ...p.company_profile, [k]: v } }));

  const initials = (
    (form.company_profile.company_name[0] || '') +
    (form.company_profile.company_name.split(' ')[1]?.[0] || '')
  ).toUpperCase() || user?.username?.[0]?.toUpperCase() || 'E';

  return (
    <div className="page fade-in">
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Perfil de Empresa</h2>
      <p className="text-secondary text-sm mb-3">Administra los datos corporativos de tu cuenta</p>

      {error   && <div className="alert alert-error">⚠ {error}</div>}
      {success && <div className="alert alert-success">✓ {success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="grid-2" style={{ gap: 20 }}>
          {/* Datos personales */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">👤 Administrador de cuenta</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div className="avatar avatar-lg">{initials}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>
                  {form.first_name} {form.last_name}
                </div>
                <div className="text-sm text-secondary">{user?.email}</div>
                <span className="badge badge-gold" style={{ marginTop: 6 }}>Empresa</span>
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input className="form-input" value={form.first_name}
                  onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Apellido</label>
                <input className="form-input" value={form.last_name}
                  onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Correo (solo lectura)</label>
              <input className="form-input" value={user?.email || ''} readOnly
                style={{ opacity: 0.6, cursor: 'not-allowed' }} />
            </div>
          </div>

          {/* Datos corporativos */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">🏢 Datos Corporativos</div>
            </div>
            <div className="form-group">
              <label className="form-label">Nombre de la empresa</label>
              <input className="form-input" value={form.company_profile.company_name}
                onChange={e => upCp('company_name', e.target.value)} />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">RUC / Tax ID</label>
                <input className="form-input" placeholder="20123456789" value={form.company_profile.tax_id}
                  onChange={e => upCp('tax_id', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Industria</label>
                <input className="form-input" placeholder="Finanzas / Tecnología" value={form.company_profile.industry}
                  onChange={e => upCp('industry', e.target.value)} />
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Tamaño</label>
                <select className="form-input" value={form.company_profile.company_size}
                  onChange={e => upCp('company_size', e.target.value)}>
                  <option value="1-10">Micro (1-10)</option>
                  <option value="11-50">Pequeña (11-50)</option>
                  <option value="51-200">Mediana (51-200)</option>
                  <option value="200+">Grande (200+)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Sitio web</label>
                <input className="form-input" placeholder="https://empresa.com" value={form.company_profile.company_website}
                  onChange={e => upCp('company_website', e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Ubicación */}
        <div className="card mt-3">
          <div className="card-title mb-3">📍 Ubicación</div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">País</label>
              <input className="form-input" placeholder="Perú" value={form.company_profile.company_country}
                onChange={e => upCp('company_country', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Ciudad</label>
              <input className="form-input" placeholder="Lima" value={form.company_profile.company_city}
                onChange={e => upCp('company_city', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Dirección</label>
            <input className="form-input" placeholder="Av. Principal 123" value={form.company_profile.company_address}
              onChange={e => upCp('company_address', e.target.value)} />
          </div>
        </div>

        {/* Notificaciones */}
        <div className="card mt-3">
          <div className="card-title mb-3">🔔 Notificaciones</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { key: 'notify_reports',  label: 'Reportes de rendimiento',  desc: 'Recibir reportes periódicos del progreso de los estudiantes' },
              { key: 'notify_students', label: 'Actividad de estudiantes', desc: 'Recibir alertas sobre la actividad de los integrantes de tu organización' },
            ].map(({ key, label, desc }) => (
              <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', padding: '12px 16px',
                background: 'var(--bg-base)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <input type="checkbox"
                  checked={form.company_profile[key as 'notify_reports' | 'notify_students']}
                  onChange={e => upCp(key, e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: 'var(--brand-500)', cursor: 'pointer' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{label}</div>
                  <div className="text-xs text-secondary">{desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? '⟳ Guardando...' : '💾 Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}
