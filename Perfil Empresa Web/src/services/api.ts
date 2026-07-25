import axios from 'axios';

const API_URL = '/api';

const api = axios.create({ baseURL: API_URL });

// Inyectar token en cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('empresa_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirigir al login si el token expiró
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('empresa_token');
      localStorage.removeItem('empresa_user');
      window.location.href = '/auth';
    }
    return Promise.reject(err);
  }
);

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authService = {
  login: (email: string, password: string, clientId: string, clientSecret: string) =>
    api.post('/auth/token/', { username: email, password, client_id: clientId, client_secret: clientSecret }),

  register: (data: Record<string, string>) =>
    api.post('/auth/company/register/', data),

  logout: () => api.post('/auth/logout/'),

  getProfile: () => api.get('/auth/company/profile/'),
  updateProfile: (data: Record<string, unknown>) =>
    api.patch('/auth/company/profile/', data),
};

// ── Alertas: panel de test / demo en vivo ─────────────────────────────────────
export type DemoAlertKind = 'welcome' | 'rule' | 'suggestion' | 'digest';

export interface DemoUser {
  id: number;
  email: string;
  name: string;
  profile_type?: string;
}

export interface DemoTriggerResult {
  ok: boolean;
  delivered_to: string;
  notification: {
    id: number;
    title: string;
    body: string;
    severity: string;
    payload: Record<string, unknown>;
  };
}

export const alertsDemoService = {
  listUsers: () => api.get<DemoUser[]>('/alerts/demo/users/').then(r => r.data),
  trigger: (payload: { target_email: string; kind: DemoAlertKind; symbol?: string }) =>
    api.post<DemoTriggerResult>('/alerts/demo/trigger/', payload).then(r => r.data),
};

// ── Organizations ─────────────────────────────────────────────────────────────
export const orgService = {
  list: () => api.get('/organizations/'),
  get: (id: string) => api.get(`/organizations/${id}/`),
  stats: (id: string) => api.get(`/organizations/${id}/stats/`),
  analytics: (id: string) => api.get(`/enterprise/organizations/${id}/analytics/`),
  dashboard: (id: string) => api.get(`/organizations/${id}/dashboard/`),
  bulkInvite: (id: string, emails: string[], message?: string) =>
    api.post(`/organizations/${id}/bulk-invite-students/`, { emails, message }).then(r => r.data),
};

// ── Students ──────────────────────────────────────────────────────────────────
export const studentService = {
  list: (params?: Record<string, string>) => api.get('/enterprise/students/', { params }),
  get: (id: string) => api.get(`/enterprise/students/${id}/`),
  enroll: (data: Record<string, unknown>) => api.post('/enterprise/students/', data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/enterprise/students/${id}/`, data),
  drop: (id: string) => api.delete(`/enterprise/students/${id}/`),
  remove: (id: string) => api.delete(`/enterprise/students/${id}/`, { params: { hard: 'true' } }),
  reactivate: (id: string) => api.patch(`/enterprise/students/${id}/`, { status: 'active' }),
  progress: (id: string) => api.get(`/enterprise/students/${id}/progress/`),
  notes: (id: string) => api.get(`/enterprise/students/${id}/notes/`),
};

// ── Challenges (backend real) ────────────────────────────────────────────────
import { Challenge } from '../types';

// DRF aplica paginación global a ListAPIView ({count, next, previous, results}).
// Las views que extienden APIView devuelven el array directo. Este helper
// extrae .results si está, y si no devuelve el array tal cual.
const unwrap = <T>(data: unknown): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object' && Array.isArray((data as { results?: unknown }).results)) {
    return (data as { results: T[] }).results;
  }
  return [];
};

export const challengeService = {
  list: (orgId: string, params?: { status?: string }) =>
    api.get(`/enterprise/organizations/${orgId}/challenges/`, { params }).then(r => unwrap<Challenge>(r.data)),
  get: (id: string) =>
    api.get(`/enterprise/challenges/${id}/`).then(r => r.data),
  participants: (id: string) =>
    api.get(`/enterprise/challenges/${id}/assignments/`).then(r => unwrap(r.data)),
  create: (orgId: string, data: Partial<Challenge>) =>
    api.post(`/enterprise/organizations/${orgId}/challenges/`, data).then(r => r.data),
  update: (id: string, data: Partial<Challenge>) =>
    api.patch(`/enterprise/challenges/${id}/`, data).then(r => r.data),
  publish: (id: string, action: 'publish' | 'archive' | 'draft') =>
    api.post(`/enterprise/challenges/${id}/publish/`, { action }).then(r => r.data),
  delete: (id: string) =>
    api.delete(`/enterprise/challenges/${id}/`).then(r => r.data),
  assign: (id: string, memberIds: number[]) =>
    api.post(`/enterprise/challenges/${id}/assign/`, { member_ids: memberIds }).then(r => r.data),
};

// ── Gamificación (backend real) ──────────────────────────────────────────────
export const gamificationService = {
  badges:       (orgId: string) => api.get(`/enterprise/organizations/${orgId}/badges/`).then(r => unwrap(r.data)),
  leaderboard:  (orgId: string) => api.get(`/enterprise/organizations/${orgId}/leaderboard/`).then(r => unwrap(r.data)),
  memberStats:  (orgId: string) => api.get(`/enterprise/organizations/${orgId}/member-stats/`).then(r => unwrap(r.data)),
  records:      (orgId: string) => api.get(`/enterprise/organizations/${orgId}/gamification-records/`).then(r => unwrap(r.data)),
};

export default api;
