"""
ASGI config for backend project.

Sirve HTTP (Django estándar) y WebSocket (Channels) en el mismo proceso.
El router de WS apunta a `alerts.routing.websocket_urlpatterns`, que se popula en el Bloque 5.
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

# Importante: get_asgi_application() debe ejecutarse antes de importar consumers/routers,
# porque éstos pueden tocar modelos y necesitan apps cargadas.
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter  # noqa: E402
from channels.auth import AuthMiddlewareStack  # noqa: E402

from alerts.routing import websocket_urlpatterns  # noqa: E402

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': AuthMiddlewareStack(URLRouter(websocket_urlpatterns)),
})
