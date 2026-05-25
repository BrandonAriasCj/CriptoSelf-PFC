// Cliente REST de /api/alerts/* — reutiliza el axios singleton con interceptor de token.

import axios, { AxiosInstance } from 'axios';

import type {
  AlertRule,
  EventTypeSchema,
  Notification,
  SubscriptionsState,
} from '../types/alerts';

const api: AxiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_PREFIX || ''}/api/alerts`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const notificationsApi = {
  list(params?: { unread?: boolean; page?: number }) {
    return api
      .get<Paginated<Notification>>('/notifications/', {
        params: {
          unread: params?.unread ? 1 : undefined,
          page: params?.page,
        },
      })
      .then((r) => r.data);
  },

  unreadCount() {
    return api
      .get<{ count: number }>('/notifications/unread-count/')
      .then((r) => r.data.count);
  },

  markRead(id: number) {
    return api.patch<Notification>(`/notifications/${id}/read/`).then((r) => r.data);
  },

  markAllRead() {
    return api
      .post<{ updated: number }>('/notifications/mark-all-read/')
      .then((r) => r.data);
  },
};

export const rulesApi = {
  list() {
    return api.get<Paginated<AlertRule>>('/rules/').then((r) => r.data.results);
  },
  retrieve(id: number) {
    return api.get<AlertRule>(`/rules/${id}/`).then((r) => r.data);
  },
  create(data: Partial<AlertRule>) {
    return api.post<AlertRule>('/rules/', data).then((r) => r.data);
  },
  update(id: number, data: Partial<AlertRule>) {
    return api.patch<AlertRule>(`/rules/${id}/`, data).then((r) => r.data);
  },
  destroy(id: number) {
    return api.delete(`/rules/${id}/`).then(() => undefined);
  },
};

export const eventTypesApi = {
  list() {
    return api.get<EventTypeSchema[]>('/event-types/').then((r) => r.data);
  },
};

export const devicesApi = {
  register(payload: { platform: 'web' | 'ios' | 'android'; token: string; name?: string }) {
    return api.post('/devices/', payload).then((r) => r.data);
  },
};

export const subscriptionsApi = {
  get() {
    return api.get<SubscriptionsState>('/subscriptions/').then((r) => r.data);
  },
  update(patch: Partial<SubscriptionsState>) {
    return api.put<SubscriptionsState>('/subscriptions/', patch).then((r) => r.data);
  },
};
