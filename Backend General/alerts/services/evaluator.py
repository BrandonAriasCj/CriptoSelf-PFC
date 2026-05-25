"""Evaluador de reglas de alerta.

Estrategia:
    1. Carga reglas habilitadas (excluye `SYSTEM_BROADCAST` — esas se disparan manualmente).
    2. Filtra las que están dentro del cooldown.
    3. Para cada una, llama `registry.evaluate(event_type, params, market_state)`.
    4. Si devuelve dict, despacha la notificación vía `dispatcher.dispatch`.

`MarketState` memoiza precios/cambios dentro de la pasada para no martillar exchanges.
"""

from __future__ import annotations

import logging

from django.utils import timezone

from alerts.events import registry
from alerts.models import AlertRule
from alerts.services import dispatcher
from alerts.services.market_state import MarketState

logger = logging.getLogger(__name__)


def evaluate_all_rules() -> int:
    """Hace una pasada del evaluador. Devuelve cuántas notificaciones se dispararon."""

    now = timezone.now()
    handled_codes = registry.codes_handled_by_evaluator()
    if not handled_codes:
        return 0
    rules = list(
        AlertRule.objects
        .filter(enabled=True, event_type__in=handled_codes)
        .select_related('user')
    )
    if not rules:
        return 0

    state = MarketState()
    triggered = 0

    for rule in rules:
        # Cooldown — no re-disparar antes de que pase su ventana.
        if rule.last_triggered_at is not None:
            elapsed = (now - rule.last_triggered_at).total_seconds()
            if elapsed < rule.cooldown_seconds:
                continue

        try:
            result = registry.evaluate(rule.event_type, rule.params or {}, state)
        except registry.UnknownEventType:
            logger.warning('Regla %s tiene event_type desconocido: %s', rule.id, rule.event_type)
            continue
        except Exception:
            logger.exception('Fallo evaluando regla %s', rule.id)
            continue

        if not result:
            continue

        try:
            event_cls = registry.get(rule.event_type)
            severity = result.get('severity') or event_cls.severity_default
            dispatcher.dispatch(
                user=rule.user,
                rule=rule,
                title=result['title'],
                body=result.get('body', ''),
                severity=severity,
                payload=result.get('payload', {}),
            )
            triggered += 1
        except Exception:
            logger.exception('Fallo despachando notif desde regla %s', rule.id)

    return triggered
