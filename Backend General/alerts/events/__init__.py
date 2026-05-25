"""Catálogo de tipos de evento.

Para añadir un evento nuevo: crear una subclase de `EventType` en `builtin.py`
(o en un módulo propio importado aquí) y decorarla con `@register`.
"""

from .base import EventType, InvalidParams, UnknownEventType  # noqa: F401
from . import registry  # noqa: F401
from . import builtin  # noqa: F401  — el import dispara el registro
