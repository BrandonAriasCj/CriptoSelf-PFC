from rest_framework import serializers

from .models import AlertRule, Notification, UserDevice


class AlertRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlertRule
        fields = [
            'id', 'name', 'event_type', 'params', 'enabled',
            'is_system', 'cooldown_seconds',
            'last_triggered_at', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'is_system', 'last_triggered_at', 'created_at', 'updated_at']

    def validate(self, attrs):
        # Validación contra el registry de eventos se enchufa en el Bloque 4
        # (registry.validate_params(event_type, params)).
        from .events import registry

        event_type = attrs.get('event_type') or getattr(self.instance, 'event_type', None)
        params = attrs.get('params', getattr(self.instance, 'params', {}) or {})

        if event_type:
            try:
                registry.validate(event_type, params)
            except registry.UnknownEventType:
                raise serializers.ValidationError({'event_type': f'Tipo de evento desconocido: {event_type}'})
            except registry.InvalidParams as exc:
                raise serializers.ValidationError({'params': str(exc)})
        return attrs


class NotificationSerializer(serializers.ModelSerializer):
    is_read = serializers.BooleanField(read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'rule', 'title', 'body', 'severity',
            'payload', 'is_read', 'read_at', 'created_at',
        ]
        read_only_fields = fields  # creadas siempre por el sistema, nunca por POST de cliente


class UserDeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserDevice
        fields = ['id', 'platform', 'token', 'name', 'enabled', 'last_seen_at', 'created_at']
        read_only_fields = ['id', 'last_seen_at', 'created_at']
        extra_kwargs = {
            'token': {'write_only': True},  # no exponemos tokens en GET
        }
