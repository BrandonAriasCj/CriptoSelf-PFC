"""
Configuración del admin para mobile_alerts.
"""

from django.contrib import admin
from .models import MobileGuestDevice, MobileAlertSubscription, MobileNotificationLog


@admin.register(MobileGuestDevice)
class MobileGuestDeviceAdmin(admin.ModelAdmin):
    list_display = [
        'device_name', 'platform', 'enabled_alerts', 
        'created_at', 'last_active_at'
    ]
    list_filter = [
        'platform', 'enabled_alerts', 'price_alerts', 
        'market_news', 'system_announcements', 'created_at'
    ]
    search_fields = ['device_name', 'device_id']
    readonly_fields = ['device_id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Información del Dispositivo', {
            'fields': ('device_id', 'device_name', 'platform', 'fcm_token')
        }),
        ('Preferencias de Alertas', {
            'fields': (
                'enabled_alerts', 'price_alerts', 'market_news', 
                'system_announcements', 'max_alerts_per_hour'
            )
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'last_active_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(MobileAlertSubscription)
class MobileAlertSubscriptionAdmin(admin.ModelAdmin):
    list_display = [
        'device', 'alert_rule', 'is_active', 'subscribed_at'
    ]
    list_filter = ['is_active', 'subscribed_at', 'alert_rule__event_type']
    search_fields = [
        'device__device_name', 'device__device_id', 'alert_rule__name'
    ]
    readonly_fields = ['subscribed_at', 'updated_at']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('device', 'alert_rule')


@admin.register(MobileNotificationLog)
class MobileNotificationLogAdmin(admin.ModelAdmin):
    list_display = [
        'device', 'notification_title', 'delivery_status', 
        'sent_at', 'delivered_at'
    ]
    list_filter = [
        'delivery_status', 'sent_at', 'delivered_at', 
        'notification__severity'
    ]
    search_fields = [
        'device__device_name', 'notification__title', 'notification__body'
    ]
    readonly_fields = [
        'created_at', 'updated_at', 'sent_at', 'delivered_at', 'clicked_at'
    ]
    
    def notification_title(self, obj):
        return obj.notification.title
    notification_title.short_description = 'Notification'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('device', 'notification')