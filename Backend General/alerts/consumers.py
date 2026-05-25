"""Consumer de WebSocket para notificaciones en tiempo real.

Autenticación: el cliente se conecta a
    ws[s]://host/ws/alerts/notifications/?token=<oauth_access_token>
o pasando el token en el header `Authorization: Bearer <token>`.

Una vez aceptada la conexión, el cliente queda suscripto al grupo del usuario.
El dispatcher publica mensajes con type='notification.message' y este consumer
los reenvía como JSON al cliente.
"""

from __future__ import annotations

import json
import logging
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from alerts.services.dispatcher import user_group_name

logger = logging.getLogger(__name__)


@database_sync_to_async
def _user_from_token(token: str):
    """Resuelve un AccessToken de django-oauth-toolkit al user, o None si inválido/expirado."""
    if not token:
        return None
    try:
        from oauth2_provider.models import AccessToken
        access = AccessToken.objects.select_related('user').filter(token=token).first()
        if access is None or not access.is_valid():
            return None
        return access.user
    except Exception:
        logger.exception('Error resolviendo token WS')
        return None


def _extract_token(scope) -> str | None:
    # 1) ?token=... en query string
    qs = parse_qs((scope.get('query_string') or b'').decode('utf-8', errors='ignore'))
    if 'token' in qs and qs['token']:
        return qs['token'][0]
    # 2) header Authorization: Bearer <token>
    for raw_key, raw_val in scope.get('headers', []):
        if raw_key.lower() == b'authorization':
            val = raw_val.decode('utf-8', errors='ignore')
            if val.lower().startswith('bearer '):
                return val[7:].strip()
    return None


class NotificationConsumer(AsyncJsonWebsocketConsumer):
    """Suscribe al usuario autenticado a su grupo de notificaciones."""

    group_name: str | None = None

    async def connect(self):
        token = _extract_token(self.scope)
        user = await _user_from_token(token) if token else None

        # Aceptamos también sesión Django (útil en desarrollo desde admin/devtools).
        if user is None:
            scope_user = self.scope.get('user')
            if scope_user is not None and getattr(scope_user, 'is_authenticated', False):
                user = scope_user

        if user is None:
            await self.close(code=4401)  # 4401: unauthorized (convención app-specific)
            return

        self.user = user
        self.group_name = user_group_name(user.id)
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        await self.send_json({'type': 'connected', 'user_id': user.id})

    async def disconnect(self, code):
        if self.group_name:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        # V1 es read-only desde el cliente. Sólo respondemos pings para mantener viva la conexión.
        if isinstance(content, dict) and content.get('type') == 'ping':
            await self.send_json({'type': 'pong'})

    # Handler invocado cuando el dispatcher hace group_send(type='notification.message', ...).
    async def notification_message(self, event):
        await self.send_json({'type': 'notification', 'data': event['data']})
