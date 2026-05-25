"""Registro de tipos de evento (singleton a nivel de módulo).

Uso:
    from alerts.events.registry import register, get, validate, describe_all

    @register
    class MyEvent(EventType):
        code = 'MY_EVENT'
        ...
"""

from __future__ import annotations

from .base import EventType, InvalidParams, UnknownEventType  # re-exports

_REGISTRY: dict[str, type[EventType]] = {}


def register(event_class: type[EventType]) -> type[EventType]:
    if not isinstance(event_class, type) or not issubclass(event_class, EventType) or event_class is EventType:
        raise TypeError('register() requiere una subclase de EventType')
    if not event_class.code:
        raise ValueError(f'{event_class.__name__} no define `code`')
    _REGISTRY[event_class.code] = event_class
    return event_class


def get(code: str) -> type[EventType]:
    try:
        return _REGISTRY[code]
    except KeyError as exc:
        raise UnknownEventType(code) from exc


def all_codes() -> list[str]:
    return list(_REGISTRY.keys())


def codes_handled_by_evaluator() -> list[str]:
    """Eventos que procesa el loop genérico `services.evaluator.evaluate_all_rules`.

    Excluye los que tienen tareas Celery dedicadas (digests, broadcasts).
    """
    return [cls.code for cls in _REGISTRY.values() if cls.evaluator_handles]


def validate(code: str, params: dict) -> None:
    get(code).validate(params)


def evaluate(code: str, params: dict, market_state) -> dict | None:
    return get(code).evaluate(params, market_state)


def describe_all() -> list[dict]:
    return [cls.describe() for cls in _REGISTRY.values()]
