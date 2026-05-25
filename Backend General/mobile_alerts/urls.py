"""
URLs para la API móvil de alertas.

Estructura de endpoints:
- /api/mobile/health/ - Health check
- /api/mobile/devices/ - Gestión de dispositivos
- /api/mobile/alerts/ - Alertas del sistema disponibles
- /api/mobile/devices/{device_id}/subscriptions/ - Suscripciones
- /api/mobile/devices/{device_id}/notifications/ - Notificaciones
"""

from django.urls import path, include
from rest_framework.routers import SimpleRouter

from .views import (
    MobileDeviceViewSet,
    SystemAlertsView,
    MobileSubscriptionsViewSet,
    MobileNotificationsView,
    MobileNotificationActionView,
    MobileHealthView,
)

app_name = 'mobile_alerts'

# Router para ViewSets
router = SimpleRouter()
router.register(r'devices', MobileDeviceViewSet, basename='mobile-device')

urlpatterns = [
    # Health check
    path('health/', MobileHealthView.as_view(), name='health'),
    
    # Alertas del sistema disponibles
    path('alerts/', SystemAlertsView.as_view(), name='system-alerts'),
    
    # Dispositivos (registro, info, preferencias)
    path('', include(router.urls)),
    
    # Suscripciones por dispositivo
    path(
        'devices/<uuid:device_id>/subscriptions/',
        MobileSubscriptionsViewSet.as_view({
            'get': 'list',
            'post': 'create'
        }),
        name='device-subscriptions'
    ),
    path(
        'devices/<uuid:device_id>/subscriptions/<int:pk>/',
        MobileSubscriptionsViewSet.as_view({
            'get': 'retrieve',
            'patch': 'partial_update',
            'delete': 'destroy'
        }),
        name='device-subscription-detail'
    ),
    
    # Notificaciones por dispositivo
    path(
        'devices/<uuid:device_id>/notifications/',
        MobileNotificationsView.as_view(),
        name='device-notifications'
    ),
    
    # Acciones sobre notificaciones
    path(
        'devices/<uuid:device_id>/notifications/<int:notification_id>/action/',
        MobileNotificationActionView.as_view(),
        name='notification-action'
    ),
]