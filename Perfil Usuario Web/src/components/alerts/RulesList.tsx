// Lista de reglas con toggle enabled inline, editar y borrar.

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Edit2, Loader2, Lock, Trash2 } from 'lucide-react';

import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { RuleEditor } from './RuleEditor';
import { rulesApi } from '../../services/notifications';
import type { AlertRule, EventTypeSchema } from '../../types/alerts';

interface Props {
  rules: AlertRule[];
  eventTypes: EventTypeSchema[];
  loading?: boolean;
  onChanged: () => void;
}

export const RulesList: React.FC<Props> = ({ rules, eventTypes, loading, onChanged }) => {
  const [editing, setEditing] = useState<AlertRule | null>(null);
  const [deleting, setDeleting] = useState<AlertRule | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingPending, setDeletingPending] = useState(false);

  const handleToggle = async (rule: AlertRule, next: boolean) => {
    setTogglingId(rule.id);
    try {
      await rulesApi.update(rule.id, { enabled: next });
      onChanged();
    } catch (err) {
      toast.error('No se pudo actualizar la regla');
      console.error(err);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletingPending(true);
    try {
      await rulesApi.destroy(deleting.id);
      toast.success('Regla eliminada');
      setDeleting(null);
      onChanged();
    } catch (err) {
      toast.error('No se pudo eliminar la regla');
      console.error(err);
    } finally {
      setDeletingPending(false);
    }
  };

  if (loading && rules.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-secondary-adaptive">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando reglas...
      </div>
    );
  }

  if (rules.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-secondary-adaptive">No tenés reglas configuradas todavía.</p>
          <p className="text-xs text-low-contrast mt-1">
            Usá la pestaña "Crear regla" para añadir tu primera alerta.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {rules.map((rule) => {
          const schema = eventTypes.find((t) => t.code === rule.event_type);
          return (
            <Card key={rule.id}>
              <CardContent className="py-4 px-4">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={(v) => handleToggle(rule, v)}
                    disabled={togglingId === rule.id || rule.is_system}
                    aria-label="Activar / desactivar"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-high-contrast truncate">{rule.name}</p>
                      <Badge variant="outline" className="text-xs">
                        {schema?.label ?? rule.event_type}
                      </Badge>
                      {rule.is_system && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Lock className="w-3 h-3" />
                          Sistema
                        </Badge>
                      )}
                    </div>
                    <ParamSummary rule={rule} />
                    {rule.last_triggered_at && (
                      <p className="text-xs text-low-contrast mt-1">
                        Último disparo: {new Date(rule.last_triggered_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditing(rule)}
                      disabled={rule.is_system}
                      aria-label="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleting(rule)}
                      disabled={rule.is_system}
                      aria-label="Eliminar"
                      className="text-destructive-adaptive hover:text-destructive-adaptive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar regla</DialogTitle>
          </DialogHeader>
          {editing && (
            <RuleEditor
              rule={editing}
              eventTypes={eventTypes}
              onSaved={() => {
                setEditing(null);
                onChanged();
              }}
              onCancel={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar la regla?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleting?.name}" dejará de evaluarse. Las notificaciones ya recibidas se conservan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={deletingPending}
            >
              {deletingPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const ParamSummary: React.FC<{ rule: AlertRule }> = ({ rule }) => {
  const entries = Object.entries(rule.params || {});
  if (entries.length === 0) {
    return <p className="text-xs text-secondary-adaptive">Sin parámetros</p>;
  }
  return (
    <p className="text-xs text-secondary-adaptive truncate">
      {entries.map(([k, v]) => `${k}: ${formatValue(v)}`).join(' · ')}
    </p>
  );
};

function formatValue(v: unknown): string {
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? 'sí' : 'no';
  return String(v);
}
