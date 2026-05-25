"""
Serializers para la API móvil de alertas.

Proporciona serializers simplificados para dispositivos móviles anónimos
que no requieren autenticación completa.
"""

from rest_framework import serializers
from alerts.models import AlertRule, Notification
from alerts.serializers import NotificationSerializer
from .models import MobileGuestDevice, MobileAlertSubscription, MobileNotificationLog


class MobileGuestDeviceSerializer(serializers.ModelSerializer):
    """Serializer para dispositivos móviles anónimos"""
    
    class Meta:
        model = MobileGuestDevice
        fields = [
            'device_id', 'device_name', 'platform', 'fcm_token',
            'enabled_alerts', 'price_alerts', 'market_news', 'system_announcements',
            'max_alerts_per_hour', 'created_at', 'last_active_at'
        ]
        read_only_fields = ['created_at', 'last_active_at']
    
    def validate_max_alerts_per_hour(self, value):
        """Limita el máximo de alertas por hora"""
        if value > 20:  # Límite razonable
            raise serializers.ValidationError("Máximo 20 alertas por hora permitidas")
        return value


class MobileGuestDeviceCreateSerializer(serializers.ModelSerializer):
    """Serializer para crear un nuevo dispositivo móvil anónimo"""
    
    class Meta:
        model = MobileGuestDevice
        fields = [
            'device_name', 'platform', 'fcm_token',
            'enabled_alerts', 'price_alerts', 'market_news', 'system_announcements',
            'max_alerts_per_hour'
        ]


class SystemAlertRuleSerializer(serializers.ModelSerializer):
    """Serializer simplificado para reglas de alerta del sistema"""
    
    class Meta:
        model = AlertRule
        fields = [
            'id', 'name', 'event_type', 'params', 'enabled',
            'cooldown_seconds', 'created_at'
        ]
        read_only_fields = ['id', 'name', 'event_type', 'params', 'enabled', 
                           'cooldown_seconds', 'created_at']


class MobileAlertSubscriptionSerializer(serializers.ModelSerializer):
    """Serializer para suscripciones a alertas del sistema"""
    
    alert_rule = SystemAlertRuleSerializer(read_only=True)
    alert_rule_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = MobileAlertSubscription
        fields = [
            'id', 'alert_rule', 'alert_rule_id', 'is_active',
            'subscribed_at', 'updated_at'
        ]
        read_only_fields = ['id', 'subscribed_at', 'updated_at']
    
    def validate_alert_rule_id(self, value):
        """Valida que la regla de alerta sea del sistema"""
        try:
            rule = AlertRule.objects.get(id=value, is_system=True)
            return value
        except AlertRule.DoesNotExist:
            raise serializers.ValidationError("Solo se puede suscribir a alertas del sistema")


class MobileNotificationSerializer(serializers.ModelSerializer):
    """Serializer simplificado para notificaciones móviles"""
    
    rule_name = serializers.CharField(source='rule.name', read_only=True)
    is_read = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id', 'title', 'body', 'severity', 'payload',
            'rule_name', 'is_read', 'created_at'
        ]
        read_only_fields = ['id', 'title', 'body', 'severity', 'payload',
                           'rule_name', 'created_at']
    
    def get_is_read(self, obj):
        """Determina si la notificación fue leída por este dispositivo"""
        device = self.context.get('device')
        if not device:
            return False
        
        return MobileNotificationLog.objects.filter(
            device=device,
            notification=obj,
            delivery_status__in=['delivered', 'clicked']
        ).exists()


class MobileNotificationLogSerializer(serializers.ModelSerializer):
    """Serializer para el log de notificaciones móviles"""
    
    notification = MobileNotificationSerializer(read_only=True)
    
    class Meta:
        model = MobileNotificationLog
        fields = [
            'id', 'notification', 'delivery_status',
            'sent_at', 'delivered_at', 'clicked_at',
            'created_at'
        ]
        read_only_fields = ['id', 'sent_at', 'delivered_at', 'clicked_at', 'created_at']


class MobileDevicePreferencesSerializer(serializers.ModelSerializer):
    """Serializer para actualizar solo las preferencias del dispositivo"""
    
    class Meta:
        model = MobileGuestDevice
        fields = [
            'device_name', 'enabled_alerts', 'price_alerts', 
            'market_news', 'system_announcements', 'max_alerts_per_hour'
        ]
    
    def validate_max_alerts_per_hour(self, value):
        """Limita el máximo de alertas por hora"""
        if value > 20:
            raise serializers.ValidationError("Máximo 20 alertas por hora permitidas")
        return value


class MobileAlertStatsSerializer(serializers.Serializer):
    """Serializer para estadísticas de alertas móviles"""
    
    total_subscriptions = serializers.IntegerField(read_only=True)
    active_subscriptions = serializers.IntegerField(read_only=True)
    notifications_today = serializers.IntegerField(read_only=True)
    notifications_this_week = serializers.IntegerField(read_only=True)
    last_notification = serializers.DateTimeField(read_only=True, allow_null=True)