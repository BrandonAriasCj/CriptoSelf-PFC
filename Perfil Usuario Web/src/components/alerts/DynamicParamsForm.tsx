// Renderiza inputs dinámicamente a partir de un `params_schema` del backend.
// Cada item del schema define `name`, `type`, `label`, `required`, y opcionales
// `options` (enum), `min` / `max` (number). El padre controla los valores.

import React from 'react';

import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Switch } from '../ui/switch';
import type { EventTypeSchema, ParamField } from '../../types/alerts';

interface Props {
  schema: EventTypeSchema;
  value: Record<string, any>;
  onChange: (next: Record<string, any>) => void;
  disabled?: boolean;
}

export const DynamicParamsForm: React.FC<Props> = ({ schema, value, onChange, disabled }) => {
  const setField = (name: string, val: any) => onChange({ ...value, [name]: val });

  if (schema.params_schema.length === 0) {
    return (
      <p className="text-sm text-secondary-adaptive italic">
        Este tipo de evento no requiere parámetros.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {schema.params_schema.map((field) => (
        <FieldRow
          key={field.name}
          field={field}
          value={value[field.name]}
          onChange={(v) => setField(field.name, v)}
          disabled={disabled}
        />
      ))}
    </div>
  );
};

const FieldRow: React.FC<{
  field: ParamField;
  value: any;
  onChange: (v: any) => void;
  disabled?: boolean;
}> = ({ field, value, onChange, disabled }) => {
  const id = `param-${field.name}`;
  const label = (
    <Label htmlFor={id} className="text-sm">
      {field.label}
      {field.required && <span className="text-red-500 ml-1">*</span>}
    </Label>
  );

  if (field.type === 'enum') {
    return (
      <div className="space-y-1.5">
        {label}
        <Select
          value={value ?? ''}
          onValueChange={onChange}
          disabled={disabled}
        >
          <SelectTrigger id={id}>
            <SelectValue placeholder="Seleccionar..." />
          </SelectTrigger>
          <SelectContent>
            {(field.options || []).map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (field.type === 'boolean') {
    return (
      <div className="flex items-center justify-between gap-3 py-1">
        {label}
        <Switch
          id={id}
          checked={!!value}
          onCheckedChange={onChange}
          disabled={disabled}
        />
      </div>
    );
  }

  if (field.type === 'number') {
    return (
      <div className="space-y-1.5">
        {label}
        <Input
          id={id}
          type="number"
          value={value ?? ''}
          min={field.min}
          max={field.max}
          onChange={(e) => {
            const raw = e.target.value;
            onChange(raw === '' ? undefined : Number(raw));
          }}
          disabled={disabled}
        />
        {(field.min !== undefined || field.max !== undefined) && (
          <p className="text-xs text-low-contrast">
            Rango:{' '}
            {field.min !== undefined ? field.min : '-∞'} a{' '}
            {field.max !== undefined ? field.max : '+∞'}
          </p>
        )}
      </div>
    );
  }

  // string (default)
  return (
    <div className="space-y-1.5">
      {label}
      <Input
        id={id}
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
};
