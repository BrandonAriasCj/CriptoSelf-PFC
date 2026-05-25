import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Eye,
  EyeOff,
  Github,
  Globe,
  Key,
  Linkedin,
  Loader2,
  Mail,
  Save,
  Shield,
  Twitter,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import type { RiskTolerance, User, UserProfileExtra } from '../types/auth';

// ── Formularios y helpers ──────────────────────────────────────────────────

interface PersonalFields {
  first_name: string;
  last_name: string;
  phone_number: string;
  date_of_birth: string;
  bio: string;
}

interface ProfessionalFields {
  company: string;
  job_title: string;
  website: string;
  linkedin_url: string;
  github_url: string;
  twitter_url: string;
}

interface PreferencesFields {
  preferred_currency: string;
  risk_tolerance: RiskTolerance;
  is_public_profile: boolean;
  allow_notifications: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
}

const CURRENCIES = [
  { value: 'USD', label: 'USD — Dólar estadounidense' },
  { value: 'EUR', label: 'EUR — Euro' },
  { value: 'ARS', label: 'ARS — Peso argentino' },
  { value: 'MXN', label: 'MXN — Peso mexicano' },
  { value: 'BRL', label: 'BRL — Real brasileño' },
  { value: 'CLP', label: 'CLP — Peso chileno' },
  { value: 'PEN', label: 'PEN — Sol peruano' },
];

const RISK_LEVELS: { value: RiskTolerance; label: string; hint: string }[] = [
  { value: 'conservative', label: 'Conservador', hint: 'Prioriza preservar capital' },
  { value: 'moderate',     label: 'Moderado',     hint: 'Equilibrio entre riesgo y rendimiento' },
  { value: 'aggressive',   label: 'Agresivo',     hint: 'Tolera alta volatilidad por más rendimiento' },
];

const URL_PATTERN = /^https?:\/\/.+/i;
const PHONE_PATTERN = /^[+\d][\d\s\-()]{5,}$/;

function fromUser(u: User | null): {
  personal: PersonalFields;
  professional: ProfessionalFields;
  preferences: PreferencesFields;
} {
  const p = u?.profile ?? ({} as UserProfileExtra);
  return {
    personal: {
      first_name: u?.first_name ?? '',
      last_name: u?.last_name ?? '',
      phone_number: u?.phone_number ?? '',
      date_of_birth: u?.date_of_birth ?? '',
      bio: u?.bio ?? '',
    },
    professional: {
      company: p.company ?? '',
      job_title: p.job_title ?? '',
      website: p.website ?? '',
      linkedin_url: p.linkedin_url ?? '',
      github_url: p.github_url ?? '',
      twitter_url: p.twitter_url ?? '',
    },
    preferences: {
      preferred_currency: p.preferred_currency ?? 'USD',
      risk_tolerance: p.risk_tolerance ?? 'moderate',
      is_public_profile: u?.is_public_profile ?? true,
      allow_notifications: u?.allow_notifications ?? true,
      email_notifications: p.email_notifications ?? true,
      sms_notifications: p.sms_notifications ?? false,
      push_notifications: p.push_notifications ?? true,
    },
  };
}

function describeApiError(error: any, fallback: string): string {
  if (error?.code === 'ERR_NETWORK' || error?.message === 'Network Error') {
    return 'No se pudo conectar con el servidor.';
  }
  const data = error?.response?.data;
  if (data?.error) return String(data.error);
  if (data?.detail) return String(data.detail);
  if (data && typeof data === 'object') {
    const fieldErrors = Object.entries(data)
      .filter(([k]) => k !== 'details')
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : v}`);
    if (fieldErrors.length) return fieldErrors.join(' · ');
  }
  return error?.message || fallback;
}

// ── Componente principal ───────────────────────────────────────────────────

export function MyProfile() {
  const { user, updateProfile, changePassword } = useAuth();

  const initial = useMemo(() => fromUser(user), [user]);

  const [personal, setPersonal]         = useState<PersonalFields>(initial.personal);
  const [professional, setProfessional] = useState<ProfessionalFields>(initial.professional);
  const [preferences, setPreferences]   = useState<PreferencesFields>(initial.preferences);

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setPersonal(initial.personal);
    setProfessional(initial.professional);
    setPreferences(initial.preferences);
  }, [initial]);

  // ── Dirty detection ───────────────────────────────────────────────────
  const personalDirty = useMemo(
    () => JSON.stringify(personal) !== JSON.stringify(initial.personal),
    [personal, initial.personal]
  );
  const professionalDirty = useMemo(
    () => JSON.stringify(professional) !== JSON.stringify(initial.professional),
    [professional, initial.professional]
  );
  const preferencesDirty = useMemo(
    () => JSON.stringify(preferences) !== JSON.stringify(initial.preferences),
    [preferences, initial.preferences]
  );
  const isDirty = personalDirty || professionalDirty || preferencesDirty;

  // ── Validación ────────────────────────────────────────────────────────
  const validate = (): string | null => {
    if (personal.phone_number && !PHONE_PATTERN.test(personal.phone_number.trim())) {
      return 'El teléfono no tiene un formato válido.';
    }
    if (personal.bio.length > 500) {
      return 'La biografía no puede exceder 500 caracteres.';
    }
    const urlFields: Array<[keyof ProfessionalFields, string]> = [
      ['website', 'Sitio web'],
      ['linkedin_url', 'LinkedIn'],
      ['github_url', 'GitHub'],
      ['twitter_url', 'Twitter'],
    ];
    for (const [key, label] of urlFields) {
      const v = professional[key]?.trim();
      if (v && !URL_PATTERN.test(v)) {
        return `${label} debe ser una URL válida (empezar con http:// o https://).`;
      }
    }
    if (personal.date_of_birth) {
      const d = new Date(personal.date_of_birth);
      if (isNaN(d.getTime())) return 'Fecha de nacimiento inválida.';
      if (d > new Date()) return 'La fecha de nacimiento no puede ser futura.';
    }
    return null;
  };

  // ── Guardar ───────────────────────────────────────────────────────────
  const handleSaveAll = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const validationError = validate();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    const profilePatch: UserProfileExtra = {};
    if (professionalDirty) {
      Object.assign(profilePatch, professional);
    }
    if (preferencesDirty) {
      profilePatch.preferred_currency = preferences.preferred_currency;
      profilePatch.risk_tolerance     = preferences.risk_tolerance;
      profilePatch.email_notifications = preferences.email_notifications;
      profilePatch.sms_notifications  = preferences.sms_notifications;
      profilePatch.push_notifications = preferences.push_notifications;
    }

    const payload: Partial<User> & { profile?: UserProfileExtra } = {};
    if (personalDirty) {
      payload.first_name    = personal.first_name.trim();
      payload.last_name     = personal.last_name.trim();
      payload.phone_number  = personal.phone_number.trim();
      payload.bio           = personal.bio;
      payload.date_of_birth = personal.date_of_birth || undefined;
    }
    if (preferencesDirty) {
      payload.is_public_profile   = preferences.is_public_profile;
      payload.allow_notifications = preferences.allow_notifications;
    }
    if (Object.keys(profilePatch).length) {
      payload.profile = profilePatch;
    }

    try {
      setSaving(true);
      await updateProfile(payload as Partial<User>);
      setSuccessMessage('Perfil actualizado correctamente.');
    } catch (error: any) {
      setErrorMessage(describeApiError(error, 'No se pudo actualizar el perfil.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setPersonal(initial.personal);
    setProfessional(initial.professional);
    setPreferences(initial.preferences);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  if (!user) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando perfil…
        </div>
      </div>
    );
  }

  const initials =
    `${personal.first_name?.[0] ?? ''}${personal.last_name?.[0] ?? ''}`.toUpperCase() ||
    user.username.slice(0, 2).toUpperCase();

  const memberSince = user.date_joined
    ? new Date(user.date_joined).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    : 'recientemente';

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* ── Encabezado ─────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <Avatar className="w-24 h-24 border-4 border-primary/20">
              <AvatarImage src={user.avatar} alt={user.username} />
              <AvatarFallback className="text-xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold">
                {(personal.first_name + ' ' + personal.last_name).trim() || user.username}
              </h2>
              <p className="text-muted-foreground">@{user.username}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Mail className="w-3 h-3" /> {user.email}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {user.is_verified && (
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-500">
                    <Shield className="w-3 h-3 mr-1" /> Verificado
                  </Badge>
                )}
                {user.email_verified && (
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-500">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Email confirmado
                  </Badge>
                )}
                <Badge variant="outline" className="text-muted-foreground">
                  <Calendar className="w-3 h-3 mr-1" /> Desde {memberSince}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {errorMessage && (
        <Alert variant="destructive" role="alert" aria-live="assertive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      {successMessage && (
        <Alert role="status" aria-live="polite" className="border-emerald-500/40">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="professional">Profesional</TabsTrigger>
          <TabsTrigger value="preferences">Preferencias</TabsTrigger>
          <TabsTrigger value="security">Seguridad</TabsTrigger>
        </TabsList>

        {/* ── Personal ───────────────────────────────────────────────── */}
        <TabsContent value="personal" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="w-5 h-5" /> Información personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Nombre</Label>
                  <Input
                    id="first_name"
                    value={personal.first_name}
                    onChange={e => setPersonal(p => ({ ...p, first_name: e.target.value }))}
                    placeholder="Tu nombre"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Apellido</Label>
                  <Input
                    id="last_name"
                    value={personal.last_name}
                    onChange={e => setPersonal(p => ({ ...p, last_name: e.target.value }))}
                    placeholder="Tu apellido"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Teléfono</Label>
                  <Input
                    id="phone_number"
                    type="tel"
                    value={personal.phone_number}
                    onChange={e => setPersonal(p => ({ ...p, phone_number: e.target.value }))}
                    placeholder="+54 11 1234-5678"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Fecha de nacimiento</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    max={new Date().toISOString().slice(0, 10)}
                    value={personal.date_of_birth || ''}
                    onChange={e => setPersonal(p => ({ ...p, date_of_birth: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Biografía</Label>
                <Textarea
                  id="bio"
                  value={personal.bio}
                  onChange={e => setPersonal(p => ({ ...p, bio: e.target.value }))}
                  placeholder="Contanos brevemente sobre vos (máx. 500 caracteres)"
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {personal.bio.length}/500
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Email</Label>
                  <Input value={user.email} disabled />
                  <p className="text-xs text-muted-foreground">El email no se puede cambiar.</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground">Usuario</Label>
                  <Input value={user.username} disabled />
                  <p className="text-xs text-muted-foreground">El username no se puede cambiar.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Profesional ────────────────────────────────────────────── */}
        <TabsContent value="professional" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" /> Información profesional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Empresa</Label>
                  <Input
                    id="company"
                    value={professional.company}
                    onChange={e => setProfessional(p => ({ ...p, company: e.target.value }))}
                    placeholder="Empresa o institución"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="job_title">Cargo</Label>
                  <Input
                    id="job_title"
                    value={professional.job_title}
                    onChange={e => setProfessional(p => ({ ...p, job_title: e.target.value }))}
                    placeholder="Trader, Analista, Estudiante…"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website" className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" /> Sitio web
                </Label>
                <Input
                  id="website"
                  type="url"
                  value={professional.website}
                  onChange={e => setProfessional(p => ({ ...p, website: e.target.value }))}
                  placeholder="https://misitio.com"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedin_url" className="flex items-center gap-1.5">
                    <Linkedin className="w-3.5 h-3.5" /> LinkedIn
                  </Label>
                  <Input
                    id="linkedin_url"
                    type="url"
                    value={professional.linkedin_url}
                    onChange={e => setProfessional(p => ({ ...p, linkedin_url: e.target.value }))}
                    placeholder="https://linkedin.com/in/…"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="github_url" className="flex items-center gap-1.5">
                    <Github className="w-3.5 h-3.5" /> GitHub
                  </Label>
                  <Input
                    id="github_url"
                    type="url"
                    value={professional.github_url}
                    onChange={e => setProfessional(p => ({ ...p, github_url: e.target.value }))}
                    placeholder="https://github.com/…"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter_url" className="flex items-center gap-1.5">
                    <Twitter className="w-3.5 h-3.5" /> Twitter / X
                  </Label>
                  <Input
                    id="twitter_url"
                    type="url"
                    value={professional.twitter_url}
                    onChange={e => setProfessional(p => ({ ...p, twitter_url: e.target.value }))}
                    placeholder="https://x.com/…"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Preferencias ───────────────────────────────────────────── */}
        <TabsContent value="preferences" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Preferencias y notificaciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Moneda preferida</Label>
                  <Select
                    value={preferences.preferred_currency}
                    onValueChange={v => setPreferences(p => ({ ...p, preferred_currency: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tolerancia al riesgo</Label>
                  <Select
                    value={preferences.risk_tolerance}
                    onValueChange={v => setPreferences(p => ({ ...p, risk_tolerance: v as RiskTolerance }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RISK_LEVELS.map(r => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label} — <span className="text-xs text-muted-foreground">{r.hint}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4 pt-2 border-t">
                <h4 className="font-medium">Privacidad</h4>
                <SwitchRow
                  title="Perfil público"
                  description="Permitir que otros usuarios vean tu perfil"
                  checked={preferences.is_public_profile}
                  onCheckedChange={v => setPreferences(p => ({ ...p, is_public_profile: v }))}
                />
                <SwitchRow
                  title="Notificaciones generales"
                  description="Recibir alertas relacionadas con tu cuenta"
                  checked={preferences.allow_notifications}
                  onCheckedChange={v => setPreferences(p => ({ ...p, allow_notifications: v }))}
                />
              </div>

              <div className="space-y-4 pt-2 border-t">
                <h4 className="font-medium">Canales de notificación</h4>
                <SwitchRow
                  title="Email"
                  description="Resúmenes, alertas y novedades por correo"
                  checked={preferences.email_notifications}
                  onCheckedChange={v => setPreferences(p => ({ ...p, email_notifications: v }))}
                />
                <SwitchRow
                  title="SMS"
                  description="Mensajes de texto para eventos críticos"
                  checked={preferences.sms_notifications}
                  onCheckedChange={v => setPreferences(p => ({ ...p, sms_notifications: v }))}
                />
                <SwitchRow
                  title="Push"
                  description="Notificaciones del navegador o app móvil"
                  checked={preferences.push_notifications}
                  onCheckedChange={v => setPreferences(p => ({ ...p, push_notifications: v }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Seguridad ──────────────────────────────────────────────── */}
        <TabsContent value="security" className="mt-4">
          <SecuritySection
            onChangePassword={changePassword}
          />
        </TabsContent>
      </Tabs>

      {/* ── Acciones globales (visible si hay cambios) ─────────────────── */}
      {isDirty && (
        <div className="sticky bottom-4 z-10">
          <Card className="border-primary/30 shadow-lg">
            <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-sm">
                Tienes cambios sin guardar.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleDiscard} disabled={saving}>
                  Descartar
                </Button>
                <Button onClick={handleSaveAll} disabled={saving}>
                  {saving ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando…</>
                  ) : (
                    <><Save className="mr-2 h-4 w-4" /> Guardar cambios</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ── Sub-componentes ───────────────────────────────────────────────────────

interface SwitchRowProps {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}

function SwitchRow({ title, description, checked, onCheckedChange }: SwitchRowProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

interface SecuritySectionProps {
  onChangePassword: (data: { old_password: string; new_password: string; new_password_confirm: string }) => Promise<void>;
}

function SecuritySection({ onChangePassword }: SecuritySectionProps) {
  const [data, setData] = useState({ old_password: '', new_password: '', new_password_confirm: '' });
  const [show, setShow] = useState({ old: false, new: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = useMemo(() => passwordStrength(data.new_password), [data.new_password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (data.new_password.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (data.new_password !== data.new_password_confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    try {
      setSaving(true);
      await onChangePassword(data);
      setData({ old_password: '', new_password: '', new_password_confirm: '' });
      toast.success('Contraseña actualizada correctamente.');
    } catch (err: any) {
      setError(describeApiError(err, 'No se pudo cambiar la contraseña.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" /> Seguridad de la cuenta
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Key className="w-4 h-4" /> Cambiar contraseña
          </h4>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <PasswordField
            label="Contraseña actual"
            value={data.old_password}
            onChange={v => setData(d => ({ ...d, old_password: v }))}
            show={show.old}
            onToggleShow={() => setShow(s => ({ ...s, old: !s.old }))}
            autoComplete="current-password"
          />
          <PasswordField
            label="Nueva contraseña"
            value={data.new_password}
            onChange={v => setData(d => ({ ...d, new_password: v }))}
            show={show.new}
            onToggleShow={() => setShow(s => ({ ...s, new: !s.new }))}
            autoComplete="new-password"
          />
          {data.new_password && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map(i => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded ${
                      i < strength.score
                        ? strength.color
                        : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{strength.label}</p>
            </div>
          )}
          <PasswordField
            label="Confirmar nueva contraseña"
            value={data.new_password_confirm}
            onChange={v => setData(d => ({ ...d, new_password_confirm: v }))}
            show={show.confirm}
            onToggleShow={() => setShow(s => ({ ...s, confirm: !s.confirm }))}
            autoComplete="new-password"
          />

          <Button type="submit" disabled={saving}>
            {saving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Actualizando…</>
            ) : (
              'Actualizar contraseña'
            )}
          </Button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t">
          <Button variant="outline" disabled>
            <Shield className="w-4 h-4 mr-2" /> Autenticación 2FA
            <Badge variant="outline" className="ml-2 text-xs">Próximamente</Badge>
          </Button>
          <Button variant="outline" disabled>
            <UserIcon className="w-4 h-4 mr-2" /> Sesiones activas
            <Badge variant="outline" className="ml-2 text-xs">Próximamente</Badge>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  autoComplete?: string;
}

function PasswordField({ label, value, onChange, show, onToggleShow, autoComplete }: PasswordFieldProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="pr-10"
          autoComplete={autoComplete}
          required
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors"
          aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          tabIndex={-1}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: 'bg-muted' };
  let score = 0;
  if (pw.length >= 8)        score++;
  if (pw.length >= 12)       score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;

  const palette = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500'];
  const labels  = ['Débil', 'Aceptable', 'Buena', 'Fuerte'];
  return {
    score,
    color: palette[Math.max(0, score - 1)] || 'bg-red-500',
    label: score === 0 ? '' : labels[Math.min(3, score - 1)],
  };
}
