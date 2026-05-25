// Editor de regla (creación y edición). Renderiza el form dinámico según el
// EventTypeSchema seleccionado. En edición, el event_type queda bloqueado.

import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { DynamicParamsForm } from './DynamicParamsForm';
import { rulesApi } from '../../services/notifications';
import type { AlertRule, EventTypeSchema } from '../../types/alerts';

interface Props {
  rule?: AlertRule;
  eventTypes: EventTypeSchema[];
  onSaved: (rule: AlertRule) => void;
  onCancel: () => void;
}

export const RuleEditor: React.FC<Props> = ({ rule, eventTypes, onSaved, onCancel }) => {
  const isEdit = !!rule;
  // Sólo eventos `user_configurable` aparecen en el creador. En edición se permite el
  // tipo actual aunque sea de sistema, para no romper la UX si se restringe a posteriori.
  const visibleTypes = useMemo(() => {
    const base = eventTypes.filter((t) => t.user_configurable);
    if (rule && !base.some((t) => t.code === rule.event_type)) {
      const original = eventTypes.find((t) => t.code === rule.event_type);
      if (original) return [...base, original];
    }
    return base;
  }, [eventTypes, rule]);

  const [name, setName] = useState(rule?.name ?? '');
  const [eventType, setEventType] = useState(rule?.event_type ?? '');
  const [params, setParams] = useState<Record<string, any>>(rule?.params ?? {});
  const [cooldown, setCooldown] = useState<number>(rule?.cooldown_seconds ?? 300);
  const [submitting, setSubmitting] = useState(false);

  // Si cambia el event_type, resetea los params (excepto si volvemos al tipo original en edit).
  useEffect(() => {
    if (isEdit && eventType === rule!.event_type) {
      setParams(rule!.params ?? {});
      return;
    }
    setParams({});
  }, [eventType, isEdit, rule]);

  const selectedSchema = visibleTypes.find((t) => t.code === eventType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventType) {
      toast.error('Seleccioná un tipo de evento');
      return;
    }
    if (!name.trim()) {
      toast.error('La regla necesita un nombre');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<AlertRule> = {
        name: name.trim(),
        event_type: eventType,
        params,
        cooldown_seconds: cooldown,
      };
      const saved = isEdit
        ? await rulesApi.update(rule!.id, payload)
        : await rulesApi.create(payload);
      toast.success(isEdit ? 'Regla actualizada' : 'Regla creada');
      onSaved(saved);
    } catch (err: any) {
      const data = err?.response?.data;
      let message = 'Error guardando la regla';
      if (data) {
        if (typeof data === 'string') message = data;
        else if (data.params) message = `Parámetros: ${data.params}`;
        else if (data.event_type) message = `Tipo: ${data.event_type}`;
        else if (data.detail) message = data.detail;
      }
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="rule-name" className="text-sm">
          Nombre de la regla<span className="text-red-500 ml-1">*</span>
        </Label>
        <Input
          id="rule-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. BTC supera $80k"
          disabled={submitting}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rule-event-type" className="text-sm">
          Tipo de evento<span className="text-red-500 ml-1">*</span>
        </Label>
        <Select
          value={eventType}
          onValueChange={setEventType}
          disabled={submitting || isEdit}
        >
          <SelectTrigger id="rule-event-type">
            <SelectValue placeholder="Seleccionar tipo..." />
          </SelectTrigger>
          <SelectContent>
            {visibleTypes.map((t) => (
              <SelectItem key={t.code} value={t.code}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedSchema && (
          <p className="text-xs text-secondary-adaptive">
            {selectedSchema.description}
          </p>
        )}
      </div>

      {selectedSchema && (
        <DynamicParamsForm
          schema={selectedSchema}
          value={params}
          onChange={setParams}
          disabled={submitting}
        />
      )}

      <div className="space-y-1.5">
        <Label htmlFor="rule-cooldown" className="text-sm">
          Cooldown (segundos)
        </Label>
        <Input
          id="rule-cooldown"
          type="number"
          min={0}
          value={cooldown}
          onChange={(e) => setCooldown(Number(e.target.value) || 0)}
          disabled={submitting}
        />
        <p className="text-xs text-low-contrast">
          Tiempo mínimo entre disparos. 300 = 5 minutos.
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
          {isEdit ? 'Guardar cambios' : 'Crear regla'}
        </Button>
      </div>
    </form>
  );
};
