"""Clase base de los tipos de evento y excepciones del registry."""

from __future__ import annotations

from typing import Any


class UnknownEventType(KeyError):
    """Se intentó referenciar un event_type que no está registrado."""


class InvalidParams(ValueError):
    """Los `params` de una regla no cumplen el schema del event_type."""


class EventType:
    """Define un tipo de evento de alerta.

    Subclases declaran metadatos (`code`, `label`, `params_schema`) e implementan
    `evaluate()`. La validación de params es genérica y se hace en la base contra
    `params_schema` — los hijos rara vez necesitan sobrescribirla.

    `evaluate(params, market_state)` debe devolver:
        - `None` si la condición no se cumple, o
        - un dict `{title, body, severity, payload}` con la notificación a crear.
    `market_state` es el objeto que provee precios/indicadores (Bloque 6).
    """

    code: str = ''
    label: str = ''
    description: str = ''
    severity_default: str = 'info'
    user_configurable: bool = True
    # Si False, este event_type NO se evalúa por el loop genérico (`alerts.services.evaluator`).
    # Lo manejan tareas Celery dedicadas (ej. digests periódicos, broadcasts manuales).
    evaluator_handles: bool = True
    # Schema de params: lista de dicts con shape:
    #   {name, type: 'string'|'number'|'enum'|'boolean', label, required, options?, min?, max?}
    params_schema: list[dict[str, Any]] = []

    @classmethod
    def validate(cls, params: dict) -> None:
        if not isinstance(params, dict):
            raise InvalidParams('params debe ser un objeto JSON')
        declared = {f['name'] for f in cls.params_schema}
        extras = set(params.keys()) - declared
        if extras:
            raise InvalidParams(f"Parámetros no reconocidos: {sorted(extras)}")
        for field in cls.params_schema:
            name = field['name']
            if name not in params:
                if field.get('required', False):
                    raise InvalidParams(f"Falta parámetro requerido '{name}'")
                continue
            cls._validate_field(field, params[name])

    @classmethod
    def _validate_field(cls, field: dict, value: Any) -> None:
        name = field['name']
        ftype = field.get('type', 'string')

        if ftype == 'string':
            if not isinstance(value, str) or not value:
                raise InvalidParams(f"'{name}' debe ser string no vacío")
        elif ftype == 'number':
            if isinstance(value, bool) or not isinstance(value, (int, float)):
                raise InvalidParams(f"'{name}' debe ser número")
            if 'min' in field and value < field['min']:
                raise InvalidParams(f"'{name}' debe ser >= {field['min']}")
            if 'max' in field and value > field['max']:
                raise InvalidParams(f"'{name}' debe ser <= {field['max']}")
        elif ftype == 'boolean':
            if not isinstance(value, bool):
                raise InvalidParams(f"'{name}' debe ser boolean")
        elif ftype == 'enum':
            options = field.get('options', [])
            if value not in options:
                raise InvalidParams(f"'{name}' debe ser uno de {options}")
        else:
            raise InvalidParams(f"Tipo de campo desconocido en schema: '{ftype}'")

    @classmethod
    def evaluate(cls, params: dict, market_state) -> dict | None:
        raise NotImplementedError(f'{cls.__name__}.evaluate() no implementado')

    @classmethod
    def describe(cls) -> dict:
        return {
            'code': cls.code,
            'label': cls.label,
            'description': cls.description,
            'severity_default': cls.severity_default,
            'user_configurable': cls.user_configurable,
            'params_schema': cls.params_schema,
        }
