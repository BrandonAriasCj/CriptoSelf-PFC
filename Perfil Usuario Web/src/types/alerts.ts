// Tipos del sistema de alertas — espejo de los serializers del backend.

export type Severity = 'info' | 'warning' | 'critical';

export interface Notification {
  id: number;
  rule: number | null;
  title: string;
  body: string;
  severity: Severity;
  payload: Record<string, any>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface AlertRule {
  id: number;
  name: string;
  event_type: string;
  params: Record<string, any>;
  enabled: boolean;
  is_system: boolean;
  cooldown_seconds: number;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ParamFieldType = 'string' | 'number' | 'enum' | 'boolean';

export interface ParamField {
  name: string;
  type: ParamFieldType;
  label: string;
  required?: boolean;
  options?: string[];
  min?: number;
  max?: number;
}

export interface EventTypeSchema {
  code: string;
  label: string;
  description: string;
  severity_default: Severity;
  user_configurable: boolean;
  params_schema: ParamField[];
}

export interface WsConnectedMessage {
  type: 'connected';
  user_id: number;
}

export interface WsNotificationMessage {
  type: 'notification';
  data: Omit<Notification, 'is_read' | 'read_at'> & { rule_id: number | null };
}

export interface WsPongMessage {
  type: 'pong';
}

export type WsInbound = WsConnectedMessage | WsNotificationMessage | WsPongMessage;

// Suscripciones a digests periódicos del mercado.
export type Cadence = 'hourly' | 'daily' | 'weekly';

export interface SubscriptionsState {
  hourly: boolean;
  daily: boolean;
  weekly: boolean;
}
