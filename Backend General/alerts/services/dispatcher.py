"""Dispatcher de notificaciones.

Crea el registro `Notification` y reparte la entrega a los backends habilitados:
- WebSocket (Channels) — implementado en V1
- FCM (Firebase Cloud Messaging) — stub, se activará cuando arranque la app móvil
- Email — stub

Punto de entrada único: `dispatch(user, ...)`. La idea es que evaluador, broadcasts
manuales del admin y código de prueba usen siempre esta función.
"""

from __future__ import annotations

import logging
from typing import Any

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.contrib.auth import get_user_model
from django.utils import timezone

from alerts.models import AlertRule, Notification

logger = logging.getLogger(__name__)
User = get_user_model()


def user_group_name(user_id: int) -> str:
    """Nombre del grupo de Channels para un usuario.

    Convención centralizada para que el consumer y el dispatcher coincidan.
    """
    return f'alerts.user.{user_id}'


def _send_via_websocket(notification: Notification) -> None:
    layer = get_channel_layer()
    if layer is None:
        logger.warning('No hay channel layer configurada — se omite envío WS')
        return
    payload = {
        'type': 'notification.message',  # mapea a consumer.notification_message
        'data': {
            'id': notification.id,
            'title': notification.title,
            'body': notification.body,
            'severity': notification.severity,
            'payload': notification.payload,
            'rule_id': notification.rule_id,
            'created_at': notification.created_at.isoformat(),
        },
    }
    async_to_sync(layer.group_send)(user_group_name(notification.user_id), payload)


def _send_via_fcm(notification: Notification) -> None:
    # Stub — se implementa cuando arranque la app móvil.
    # Por ahora solo loguea para confirmar que el hook funcionaría.
    devices = notification.user.devices.filter(enabled=True).exclude(platform='web')
    if devices.exists():
        logger.debug(
            'FCM stub: %d device(s) para notif %s (no se envía aún)',
            devices.count(), notification.id,
        )


def dispatch(
    user,
    title: str,
    body: str = '',
    severity: str = Notification.Severity.INFO,
    payload: dict[str, Any] | None = None,
    rule: AlertRule | None = None,
    update_rule_cooldown: bool = True,
) -> Notification:
    """Crea y entrega una notificación.

    Args:
        user: destinatario.
        title, body, severity, payload: contenido.
        rule: regla origen (None para broadcasts del sistema).
        update_rule_cooldown: si la regla viene seteada, actualiza `last_triggered_at`.
    """
    notification = Notification.objects.create(
        user=user,
        rule=rule,
        title=title,
        body=body,
        severity=severity,
        payload=payload or {},
    )

    if rule is not None and update_rule_cooldown:
        AlertRule.objects.filter(pk=rule.pk).update(last_triggered_at=timezone.now())

    try:
        _send_via_websocket(notification)
    except Exception:
        logger.exception('Fallo enviando notif %s por WS', notification.id)

    try:
        _send_via_fcm(notification)
    except Exception:
        logger.exception('Fallo enviando notif %s por FCM', notification.id)

    return notification


def broadcast(
    title: str,
    body: str = '',
    severity: str = Notification.Severity.INFO,
    payload: dict[str, Any] | None = None,
    user_filter: dict | None = None,
) -> int:
    """Envía una notificación a múltiples usuarios.

    `user_filter` se pasa a `User.objects.filter(**user_filter)`. Default = todos los activos.
    Útil para anuncios del sistema. Devuelve cuántas notificaciones se crearon.
    """
    qs = User.objects.filter(**(user_filter or {'is_active': True}))
    count = 0
    for user in qs.iterator():
        dispatch(
            user=user,
            title=title,
            body=body,
            severity=severity,
            payload=payload,
            rule=None,
            update_rule_cooldown=False,
        )
        count += 1
    return count
