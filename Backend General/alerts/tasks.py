"""Tareas Celery del sistema de alertas."""

from __future__ import annotations

import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(name='alerts.tasks.evaluate_alerts')
def evaluate_alerts() -> int:
    from alerts.services.evaluator import evaluate_all_rules

    triggered = evaluate_all_rules()
    if triggered:
        logger.info('Evaluador disparó %d notificaciones', triggered)
    return triggered


def _send_digest(cadence: str, event_type: str) -> int:
    """Construye el digest una vez y lo envía a cada suscriptor.

    El digest se computa con un único `PriceFeed` para aprovechar su caché
    interno — todos los suscriptores reciben los mismos números (consistencia).
    """
    from alerts.models import AlertRule
    from alerts.services import dispatcher
    from alerts.services.market_digest import build_digest
    from alerts.services.price_feed import PriceFeed

    feed = PriceFeed()
    digest = build_digest(cadence, feed=feed)  # type: ignore[arg-type]
    if digest is None:
        # `build_digest` ya logueó el motivo. Evitamos crear notificaciones vacías.
        return 0

    rules = (
        AlertRule.objects
        .filter(event_type=event_type, enabled=True)
        .select_related('user')
    )

    sent = 0
    for rule in rules:
        try:
            dispatcher.dispatch(
                user=rule.user,
                rule=rule,
                title=digest['title'],
                body=digest['body'],
                severity=digest['severity'],
                payload=digest['payload'],
                update_rule_cooldown=False,
            )
            sent += 1
        except Exception:
            logger.exception('Fallo enviando digest %s a user %s', cadence, rule.user_id)
    if sent:
        logger.info('Digest %s enviado a %d usuarios', cadence, sent)
    return sent


@shared_task(name='alerts.tasks.send_market_digest_hourly')
def send_market_digest_hourly() -> int:
    return _send_digest('hourly', 'MARKET_DIGEST_HOURLY')


@shared_task(name='alerts.tasks.send_market_digest_daily')
def send_market_digest_daily() -> int:
    return _send_digest('daily', 'MARKET_DIGEST_DAILY')


@shared_task(name='alerts.tasks.send_market_digest_weekly')
def send_market_digest_weekly() -> int:
    return _send_digest('weekly', 'MARKET_DIGEST_WEEKLY')


@shared_task(name='alerts.tasks.scan_market_suggestions')
def scan_market_suggestions() -> int:
    """Escanea los símbolos principales buscando cruces de medias y avisa.

    Edge-triggered por vela: solo dispara un cruce cuando ocurre en una vela más
    nueva que la última registrada en `SuggestionSignalState` (dedup). Devuelve
    cuántas notificaciones se despacharon en total (cruces × suscriptores).
    """
    from alerts.models import AlertRule, SuggestionSignalState
    from alerts.services import dispatcher
    from alerts.services.price_feed import PriceFeed
    from alerts.services.suggestions import (
        SYMBOLS_TO_SCAN,
        analyze_crossover,
        build_suggestion_message,
    )

    subscribers = list(
        AlertRule.objects
        .filter(event_type='MARKET_SUGGESTION', enabled=True)
        .select_related('user')
    )
    if not subscribers:
        return 0

    feed = PriceFeed()
    total = 0
    for symbol in SYMBOLS_TO_SCAN:
        try:
            analysis = analyze_crossover(symbol, feed)
        except Exception:
            logger.exception('Fallo analizando %s', symbol)
            continue
        if not analysis or not analysis['crossed']:
            continue

        state, _ = SuggestionSignalState.objects.get_or_create(
            symbol=symbol, timeframe=analysis['timeframe'],
        )
        if analysis['candle_ts'] <= state.last_candle_ts:
            continue  # ya alertamos este (o un) cruce en esta vela

        msg = build_suggestion_message(analysis)
        for rule in subscribers:
            try:
                dispatcher.dispatch(
                    user=rule.user,
                    rule=rule,
                    title=msg['title'],
                    body=msg['body'],
                    severity=msg['severity'],
                    payload=msg['payload'],
                    update_rule_cooldown=False,
                )
                total += 1
            except Exception:
                logger.exception('Fallo enviando sugerencia de %s a user %s', symbol, rule.user_id)

        state.last_signal = analysis['signal']
        state.last_candle_ts = analysis['candle_ts']
        state.save(update_fields=['last_signal', 'last_candle_ts', 'updated_at'])

    if total:
        logger.info('Sugerencias: %d notificaciones despachadas', total)
    return total
