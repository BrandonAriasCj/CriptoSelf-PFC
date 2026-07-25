import React, { useEffect, useState } from 'react';
import {
  BellAlertIcon,
  SparklesIcon,
  AdjustmentsHorizontalIcon,
  NewspaperIcon,
  HandRaisedIcon,
} from '@heroicons/react/24/outline';
import {
  alertsDemoService,
  type DemoAlertKind,
  type DemoUser,
  type DemoTriggerResult,
} from '../services/api';

// Catálogo de los 4 tipos de alerta que se pueden disparar en vivo.
interface AlertKindMeta {
  kind: DemoAlertKind;
  label: string;
  description: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  usesSymbol: boolean;
}

const ALERT_KINDS: AlertKindMeta[] = [
  {
    kind: 'welcome',
    label: 'Bienvenida',
    description: 'Notificación introductoria, como la que recibe un usuario al registrarse.',
    Icon: HandRaisedIcon,
    usesSymbol: false,
  },
  {
    kind: 'rule',
    label: 'Basada en regla',
    description: 'Usa el precio real del símbolo y simula el cruce de un umbral de precio.',
    Icon: AdjustmentsHorizontalIcon,
    usesSymbol: true,
  },
  {
    kind: 'suggestion',
    label: 'Sugerencia',
    description: 'Lee indicadores de Binance (cruce de medias) y describe la señal técnica actual.',
    Icon: SparklesIcon,
    usesSymbol: true,
  },
  {
    kind: 'digest',
    label: 'Periódica (resumen)',
    description: 'Construye el resumen diario real del mercado, como la suscripción periódica.',
    Icon: NewspaperIcon,
    usesSymbol: false,
  },
];

const SEVERITY_COLOR: Record<string, string> = {
  info: '#3b82f6',
  warning: '#f59e0b',
  critical: '#ef4444',
};

export default function AlertsTest() {
  const [users, setUsers] = useState<DemoUser[]>([]);
  const [targetEmail, setTargetEmail] = useState('');
  const [symbol, setSymbol] = useState('BTC/USDT');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [sending, setSending] = useState<DemoAlertKind | null>(null);
  const [result, setResult] = useState<DemoTriggerResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    alertsDemoService
      .listUsers()
      .then((u) => {
        setUsers(u);
        if (u.length) setTargetEmail(u[0].email);
      })
      .catch(() => setError('No se pudo cargar la lista de usuarios destino.'))
      .finally(() => setLoadingUsers(false));
  }, []);

  const trigger = async (kind: DemoAlertKind) => {
    if (!targetEmail) {
      setError('Elegí un usuario destino primero.');
      return;
    }
    setSending(kind);
    setError(null);
    try {
      const res = await alertsDemoService.trigger({ target_email: targetEmail, kind, symbol });
      setResult(res);
    } catch (err: any) {
      const detail = err?.response?.data?.detail || 'No se pudo enviar la alerta.';
      setError(detail);
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="page">
      <div className="alert" style={{ marginBottom: 20 }}>
        <BellAlertIcon style={{ width: 20, height: 20, flexShrink: 0 }} />
        <div>
          <strong>Demo en vivo de alertas.</strong> Elegí una cuenta de usuario y dispará cualquiera
          de los 4 tipos. La notificación llega <strong>en tiempo real</strong> a la sección de
          alertas de esa cuenta en el Perfil de Usuario Web (abrila en otra pantalla para mostrarla).
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Usuario destino</label>
            {/* Combo editable: elegí de la lista o escribí cualquier email. */}
            <input
              className="form-input"
              list="demo-users"
              placeholder={loadingUsers ? 'Cargando usuarios…' : 'email@usuario.com'}
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
            />
            <datalist id="demo-users">
              {users.map((u) => (
                <option key={u.id} value={u.email}>
                  {u.name} · {u.profile_type === 'company' ? 'Empresa' : 'Usuario'}
                </option>
              ))}
            </datalist>
            <span className="text-secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
              {users.length} usuarios disponibles. Podés escribir cualquier email registrado.
            </span>
          </div>
          <div className="form-group">
            <label className="form-label">Símbolo (para Regla y Sugerencia)</label>
            <input
              className="form-input"
              placeholder="BTC/USDT"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            />
          </div>
        </div>
      </div>

      <div className="card-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, marginBottom: 20 }}>
        {ALERT_KINDS.map(({ kind, label, description, Icon }) => (
          <div className="card" key={kind} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="nav-icon" style={{ display: 'inline-flex' }}>
                <Icon style={{ width: 22, height: 22 }} strokeWidth={1.8} />
              </span>
              <strong>{label}</strong>
            </div>
            <p className="text-secondary" style={{ fontSize: 13, margin: 0, flex: 1 }}>{description}</p>
            <button
              className="btn btn-primary"
              onClick={() => trigger(kind)}
              disabled={sending !== null || (!targetEmail && !loadingUsers)}
            >
              {sending === kind ? 'Enviando…' : 'Disparar alerta'}
            </button>
          </div>
        ))}
      </div>

      {error && (
        <div className="alert" style={{ borderColor: '#ef4444', color: '#ef4444', marginBottom: 16 }}>
          {error}
        </div>
      )}

      {result && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span
              style={{
                width: 10, height: 10, borderRadius: '50%',
                background: SEVERITY_COLOR[result.notification.severity] || '#3b82f6',
              }}
            />
            <strong>Última alerta enviada</strong>
            <span className="badge" style={{ marginLeft: 'auto' }}>→ {result.delivered_to}</span>
          </div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{result.notification.title}</div>
          {result.notification.body && (
            <p className="text-secondary" style={{ fontSize: 13, margin: '0 0 12px' }}>
              {result.notification.body}
            </p>
          )}
          <pre
            style={{
              background: 'var(--bg-base, rgba(0,0,0,.04))',
              padding: 12, borderRadius: 8, fontSize: 12, overflow: 'auto', margin: 0,
            }}
          >
            {JSON.stringify(result.notification.payload, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
