"""Onboarding de notificaciones para usuarios nuevos.

Un usuario recién registrado no tiene reglas ni suscripciones, así que la
sección de alertas le aparecería vacía ("No tenés notificaciones todavía").
Este módulo arranca esa experiencia:

1. `seed_welcome_notifications` — crea un par de notificaciones introductorias
   que explican para qué sirve la sección (one-time, marcadas con
   ``payload.kind == 'welcome'`` para no duplicarlas).
2. `ensure_daily_digest_subscription` — suscribe al usuario al resumen diario
   de mercado, de modo que siga recibiendo contenido sin tener que configurar
   nada. Bajo el capó es el mismo `AlertRule` que crea
   `SubscriptionsView` con cadence='daily'.

Punto de entrada: `run_onboarding(user)`. Es idempotente — si ya corrió antes
para ese usuario no vuelve a crear nada.
"""

from __future__ import annotations

import logging

from alerts.models import AlertRule, Notification

logger = logging.getLogger(__name__)

# event_types que activamos por defecto — deben coincidir con
# SUBSCRIPTION_EVENT_TYPES en alerts/views.py para que la pestaña
# "Suscripciones" los refleje como activos.
DAILY_DIGEST_EVENT_TYPE = 'MARKET_DIGEST_DAILY'
SUGGESTION_EVENT_TYPE = 'MARKET_SUGGESTION'

# Marcador en payload para reconocer (y no duplicar) las notificaciones de
# bienvenida.
WELCOME_KIND = 'welcome'

# Notificaciones introductorias. Sin emojis a propósito (chrome/contenido del
# producto va en texto plano). El `step` permite ordenarlas/estilizarlas en el
# cliente si hiciera falta más adelante.
_WELCOME_NOTIFICATIONS = [
    {
        'title': 'Te damos la bienvenida a CriptoSelf',
        'body': (
            'Acá vas a ver tus alertas y los resúmenes de mercado. Cada vez '
            'que se cumpla una de tus reglas o llegue un resumen, aparecerá en '
            'esta sección y, si estás conectado, en tiempo real.'
        ),
        'step': 1,
    },
    {
        'title': 'Creá tu primera alerta de precio',
        'body': (
            'Andá a la pestaña "Crear regla" para avisarte cuando una cripto '
            'cruce un precio o se mueva un porcentaje determinado. Por ejemplo: '
            '"avisame si Bitcoin supera los $70.000".'
        ),
        'step': 2,
    },
    {
        'title': 'Activamos tu resumen diario de mercado',
        'body': (
            'Te suscribimos al resumen diario para que cada mañana recibas '
            'cómo vienen las principales criptomonedas. Podés desactivarlo '
            'cuando quieras desde la pestaña "Suscripciones".'
        ),
        'step': 3,
    },
]


def _ensure_subscription(user, event_type: str, name: str) -> bool:
    """Crea/activa una suscripción (AlertRule marcador) si no estaba activa.

    Devuelve True si creó/activó, False si ya estaba activa. Replica lo que hace
    `SubscriptionsView.put`.
    """
    rule = AlertRule.objects.filter(user=user, event_type=event_type).first()
    if rule is None:
        AlertRule.objects.create(
            user=user,
            name=name,
            event_type=event_type,
            params={},
            enabled=True,
            cooldown_seconds=0,
        )
        return True
    if not rule.enabled:
        rule.enabled = True
        rule.save(update_fields=['enabled', 'updated_at'])
        return True
    return False


def ensure_daily_digest_subscription(user) -> bool:
    """Suscribe al usuario al digest diario si aún no lo está."""
    return _ensure_subscription(user, DAILY_DIGEST_EVENT_TYPE, 'Resumen daily')


def ensure_suggestions_subscription(user) -> bool:
    """Suscribe al usuario a las sugerencias de mercado si aún no lo está."""
    return _ensure_subscription(user, SUGGESTION_EVENT_TYPE, 'Sugerencias del mercado')


def seed_welcome_notifications(user) -> int:
    """Crea las notificaciones de bienvenida vía el dispatcher.

    Idempotente: si el usuario ya tiene notificaciones de bienvenida, no hace
    nada. Devuelve cuántas creó.
    """
    already = Notification.objects.filter(
        user=user, payload__kind=WELCOME_KIND,
    ).exists()
    if already:
        return 0

    # Import diferido: el dispatcher toca channel layer; lo dejamos fuera del
    # import de módulo para no acoplar la carga de este archivo a Channels.
    from alerts.services import dispatcher

    created = 0
    for item in _WELCOME_NOTIFICATIONS:
        dispatcher.dispatch(
            user=user,
            title=item['title'],
            body=item['body'],
            severity=Notification.Severity.INFO,
            payload={'kind': WELCOME_KIND, 'step': item['step']},
            rule=None,
            update_rule_cooldown=False,
        )
        created += 1
    return created


def run_onboarding(user) -> None:
    """Orquesta el onboarding de notificaciones para un usuario nuevo.

    Pensado para llamarse desde el signal `post_save` de User (created=True),
    pero seguro de invocar varias veces — cada paso es idempotente.
    """
    try:
        ensure_daily_digest_subscription(user)
        ensure_suggestions_subscription(user)
    except Exception:
        logger.exception('Onboarding: fallo suscribiendo a digest/sugerencias (user=%s)', user.pk)

    try:
        seed_welcome_notifications(user)
    except Exception:
        logger.exception('Onboarding: fallo creando notificaciones de bienvenida (user=%s)', user.pk)
