import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/api';
import { LogoMark } from '../components/Logo';

type Mode = 'login' | 'register';

export default function AuthPage() {
  const { login } = useAuth();
  const [mode, setMode]       = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass,  setLoginPass]  = useState('');

  // Register form
  const [reg, setReg] = useState({
    first_name: '', last_name: '', email: '', username: '',
    password: '', password_confirm: '',
    company_name: '', industry: '', company_size: '11-50',
    tax_id: '', company_country: '', company_city: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(loginEmail, loginPass);
    } catch (err: unknown) {
      console.error('Login error:', err);
      const resp = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
      if (resp?.error) {
        setError(String(resp.error));
      } else if (resp?.detail) {
        setError(String(resp.detail));
      } else {
        setError((err as { message?: string })?.message || 'Error al iniciar sesión. Verifica tus credenciales.');
      }
    } finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await authService.register(reg);
      setSuccess('✓ Cuenta creada exitosamente. Ahora puedes iniciar sesión.');
      setMode('login');
      setLoginEmail(reg.email);
    } catch (err: unknown) {
      console.error('Register error:', err);
      const resp = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
      if (!resp) {
        setError((err as { message?: string })?.message || 'Error de red. ¿Está el servidor corriendo?');
        return;
      }
      // 1) error top-level (nuestro formato personalizado)
      if (resp.error) {
        setError(String(resp.error));
        return;
      }
      // 2) errores de campo (DRF estándar): { field: ["msg"] }
      const lines: string[] = [];
      for (const [field, msgs] of Object.entries(resp)) {
        if (field === 'details') continue;
        const arr = Array.isArray(msgs) ? msgs : [msgs];
        arr.forEach(m => lines.push(`• ${field}: ${m}`));
      }
      setError(lines.join('\n') || 'Error desconocido al registrar.');
    } finally { setLoading(false); }
  };


  const updateReg = (k: string, v: string) => setReg(p => ({ ...p, [k]: v }));

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        {/* Logo */}
        <div className="auth-logo">
          <LogoMark size={48} />
          <div>
            <div className="auth-title">CriptoSelf</div>
            <div className="auth-subtitle" style={{ color: 'var(--gold-500)', fontWeight: 600 }}>Plataforma Empresarial</div>
          </div>
        </div>

        {/* Toggle */}
        <div className="auth-toggle">
          <button className={`auth-toggle-btn ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>
            Iniciar Sesión
          </button>
          <button className={`auth-toggle-btn ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>
            Registrar Empresa
          </button>
        </div>

        {error   && (
          <div className="alert alert-error" style={{ whiteSpace: 'pre-wrap', alignItems: 'flex-start' }}>
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}
        {success && <div className="alert alert-success">✓ {success}</div>}

        {mode === 'login' ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Correo corporativo</label>
              <input className="form-input" type="email" placeholder="admin@empresa.com"
                value={loginEmail} onChange={e => setLoginEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input className="form-input" type="password" placeholder="••••••••"
                value={loginPass} onChange={e => setLoginPass(e.target.value)} required />
            </div>
            <button className="btn btn-primary w-full" style={{ justifyContent: 'center' }} disabled={loading}>
              {loading ? '⟳ Ingresando...' : '→ Acceder al Panel'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} style={{ maxHeight: '55vh', overflowY: 'auto', paddingRight: '4px' }}>
            <p className="text-sm text-secondary mb-2" style={{ marginBottom: 16 }}>Datos del administrador</p>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input className="form-input" placeholder="Juan" value={reg.first_name}
                  onChange={e => updateReg('first_name', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Apellido</label>
                <input className="form-input" placeholder="Pérez" value={reg.last_name}
                  onChange={e => updateReg('last_name', e.target.value)} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Correo corporativo</label>
              <input className="form-input" type="email" placeholder="admin@empresa.com" value={reg.email}
                onChange={e => updateReg('email', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Usuario</label>
              <input className="form-input" placeholder="empresa_abc" value={reg.username}
                onChange={e => updateReg('username', e.target.value)} required />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Contraseña</label>
                <input className="form-input" type="password" value={reg.password}
                  onChange={e => updateReg('password', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Confirmar</label>
                <input className="form-input" type="password" value={reg.password_confirm}
                  onChange={e => updateReg('password_confirm', e.target.value)} required />
              </div>
            </div>

            <div className="auth-divider"><span>Datos de la empresa</span></div>

            <div className="form-group">
              <label className="form-label">Nombre de la empresa *</label>
              <input className="form-input" placeholder="Empresa ABC S.A." value={reg.company_name}
                onChange={e => updateReg('company_name', e.target.value)} required />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Industria</label>
                <input className="form-input" placeholder="Tecnología / Finanzas" value={reg.industry}
                  onChange={e => updateReg('industry', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Tamaño</label>
                <select className="form-input" value={reg.company_size}
                  onChange={e => updateReg('company_size', e.target.value)}>
                  <option value="1-10">Micro (1-10)</option>
                  <option value="11-50">Pequeña (11-50)</option>
                  <option value="51-200">Mediana (51-200)</option>
                  <option value="200+">Grande (200+)</option>
                </select>
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">País</label>
                <input className="form-input" placeholder="Perú" value={reg.company_country}
                  onChange={e => updateReg('company_country', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Ciudad</label>
                <input className="form-input" placeholder="Lima" value={reg.company_city}
                  onChange={e => updateReg('company_city', e.target.value)} />
              </div>
            </div>

            <button className="btn btn-gold w-full" style={{ justifyContent: 'center', marginTop: 8 }} disabled={loading}>
              {loading ? '⟳ Registrando...' : '🏢 Crear Cuenta Empresarial'}
            </button>
          </form>
        )}

        <p className="text-xs text-muted" style={{ textAlign: 'center', marginTop: 20 }}>
          Plataforma exclusiva para instituciones educativas y empresas
        </p>
      </div>
    </div>
  );
}
