from django.urls import include, path
from rest_framework.routers import SimpleRouter

from .views import (
    AlertRuleViewSet,
    EventTypeView,
    NotificationViewSet,
    SubscriptionsView,
    UserDeviceViewSet,
)

app_name = 'alerts'

router = SimpleRouter()
router.register(r'rules', AlertRuleViewSet, basename='alertrule')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'devices', UserDeviceViewSet, basename='userdevice')
router.register(r'event-types', EventTypeView, basename='eventtype')

urlpatterns = [
    path('subscriptions/', SubscriptionsView.as_view(), name='subscriptions'),
    path('', include(router.urls)),
]
