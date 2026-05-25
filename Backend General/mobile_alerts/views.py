"""
Views para la API móvil de alertas.

Proporciona endpoints simplificados para dispositivos móviles que no requieren
autenticación completa, solo identificación por device_id.
"""

from datetime import timedelta
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import status, viewsets, mixins
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework import serializers
from rest_framework.response import Response
from rest_framework.views import APIView

from alerts.models import AlertRule, Notification
from .models import MobileGuestDevice, MobileAlertSubscription, MobileNotificationLog
from .serializers import (
    MobileGuestDeviceSerializer,
    MobileGuestDeviceCreateSerializer,
    SystemAlertRuleSerializer,
    MobileAlertSubscriptionSerializer,
    MobileNotificationSerializer,
    MobileNotificationLogSerializer,
    MobileDevicePreferencesSerializer,
    MobileAlertStatsSerializer,
)


class MobileDeviceViewSet(mixins.CreateModelMixin,
                         mixins.RetrieveModelMixin,
                         mixins.UpdateModelMixin,
                         viewsets.GenericViewSet):
    """
    ViewSet para gestionar dispositivos móviles anónimos.
    
    - POST: Registrar nuevo dispositivo
    - GET: Obtener info del dispositivo por device_id
    - PATCH: Actualizar preferencias del dispositivo
    """
    
    queryset = MobileGuestDevice.objects.all()
    permission_classes = [AllowAny]
    lookup_field = 'device_id'
    
    def get_serializer_class(self):
        if self.action == 'create':
            return MobileGuestDeviceCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return MobileDevicePreferencesSerializer
        return MobileGuestDeviceSerializer
    
    def retrieve(self, request, *args, **kwargs):
        """Obtener info del dispositivo y actualizar last_active"""
        instance = self.get_object()
        instance.update_last_active()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def stats(self, request, device_id=None):
        """Obtener estadísticas de alertas para el dispositivo"""
        device = self.get_object()
        
        # Calcular estadísticas
        now = timezone.now()
        today = now.date()
        week_ago = now - timedelta(days=7)
        
        subscriptions = device.alert_subscriptions.all()
        notifications_today = device.notification_logs.filter(
            created_at__date=today
        ).count()
        notifications_this_week = device.notification_logs.filter(
            created_at__gte=week_ago
        ).count()
        
        last_notification_log = device.notification_logs.first()
        last_notification = last_notification_log.created_at if last_notification_log else None
        
        stats_data = {
            'total_subscriptions': subscriptions.count(),
            'active_subscriptions': subscriptions.filter(is_active=True).count(),
            'notifications_today': notifications_today,
            'notifications_this_week': notifications_this_week,
            'last_notification': last_notification,
        }
        
        serializer = MobileAlertStatsSerializer(stats_data)
        return Response(serializer.data)


class SystemAlertsView(APIView):
    """
    Vista para obtener alertas predefinidas del sistema disponibles para móviles.
    
    GET: Lista todas las reglas de alerta del sistema que pueden ser suscritas
    por dispositivos móviles anónimos.
    """
    
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Obtener alertas del sistema disponibles"""
        # Solo reglas del sistema habilitadas
        system_rules = AlertRule.objects.filter(
            is_system=True,
            enabled=True
        ).order_by('name')
        
        serializer = SystemAlertRuleSerializer(system_rules, many=True)
        return Response({
            'count': system_rules.count(),
            'results': serializer.data
        })


class MobileSubscriptionsViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar suscripciones de dispositivos móviles a alertas del sistema.
    
    Requiere device_id en la URL para identificar el dispositivo.
    """
    
    serializer_class = MobileAlertSubscriptionSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        device_id = self.kwargs.get('device_id')
        if not device_id:
            return MobileAlertSubscription.objects.none()
        
        try:
            device = MobileGuestDevice.objects.get(device_id=device_id)
            return device.alert_subscriptions.all().select_related('alert_rule')
        except MobileGuestDevice.DoesNotExist:
            return MobileAlertSubscription.objects.none()
    
    def perform_create(self, serializer):
        device_id = self.kwargs.get('device_id')
        try:
            device = MobileGuestDevice.objects.get(device_id=device_id)
            device.update_last_active()
            serializer.save(device=device)
        except MobileGuestDevice.DoesNotExist:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("Dispositivo no encontrado")
    
    def perform_update(self, serializer):
        device_id = self.kwargs.get('device_id')
        try:
            device = MobileGuestDevice.objects.get(device_id=device_id)
            device.update_last_active()
            serializer.save()
        except MobileGuestDevice.DoesNotExist:
            raise serializers.ValidationError("Dispositivo no encontrado")


class MobileNotificationsView(APIView):
    """
    Vista para obtener notificaciones para un dispositivo móvil específico.
    
    GET: Lista notificaciones relevantes para el dispositivo basadas en sus suscripciones.
    """
    
    permission_classes = [AllowAny]
    
    def get(self, request, device_id):
        """Obtener notificaciones para el dispositivo"""
        try:
            device = MobileGuestDevice.objects.get(device_id=device_id)
            device.update_last_active()
        except MobileGuestDevice.DoesNotExist:
            return Response(
                {'error': 'Dispositivo no encontrado'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Obtener reglas suscritas por el dispositivo
        subscribed_rules = device.alert_subscriptions.filter(
            is_active=True
        ).values_list('alert_rule_id', flat=True)
        
        if not subscribed_rules:
            return Response({
                'count': 0,
                'results': []
            })
        
        # Filtros de query params
        hours_back = int(request.query_params.get('hours', 24))  # Últimas 24h por defecto
        unread_only = request.query_params.get('unread', 'false').lower() == 'true'
        
        # Obtener notificaciones de las reglas suscritas
        since = timezone.now() - timedelta(hours=hours_back)
        notifications = Notification.objects.filter(
            rule_id__in=subscribed_rules,
            created_at__gte=since
        ).select_related('rule').order_by('-created_at')
        
        # Filtrar solo no leídas si se solicita
        if unread_only:
            read_notification_ids = MobileNotificationLog.objects.filter(
                device=device,
                delivery_status__in=['delivered', 'clicked']
            ).values_list('notification_id', flat=True)
            notifications = notifications.exclude(id__in=read_notification_ids)
        
        # Limitar resultados
        limit = min(int(request.query_params.get('limit', 50)), 100)
        notifications = notifications[:limit]
        
        serializer = MobileNotificationSerializer(
            notifications, 
            many=True, 
            context={'device': device}
        )
        
        return Response({
            'count': len(serializer.data),
            'results': serializer.data
        })


class MobileNotificationActionView(APIView):
    """
    Vista para acciones sobre notificaciones móviles (marcar como leída, etc.).
    """
    
    permission_classes = [AllowAny]
    
    def post(self, request, device_id, notification_id):
        """Marcar notificación como leída/clickeada"""
        try:
            device = MobileGuestDevice.objects.get(device_id=device_id)
            notification = Notification.objects.get(id=notification_id)
        except (MobileGuestDevice.DoesNotExist, Notification.DoesNotExist):
            return Response(
                {'error': 'Dispositivo o notificación no encontrada'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        action = request.data.get('action', 'read')
        
        # Crear o actualizar log de notificación
        log, created = MobileNotificationLog.objects.get_or_create(
            device=device,
            notification=notification,
            defaults={'delivery_status': 'delivered'}
        )
        
        if action == 'click':
            log.delivery_status = 'clicked'
            log.clicked_at = timezone.now()
        elif action == 'read':
            if log.delivery_status == 'pending':
                log.delivery_status = 'delivered'
            log.delivered_at = timezone.now()
        
        log.save()
        device.update_last_active()
        
        return Response({
            'success': True,
            'action': action,
            'status': log.delivery_status
        })


class MobileHealthView(APIView):
    """
    Vista de salud para la API móvil.
    """
    
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Endpoint de salud básico"""
        return Response({
            'status': 'healthy',
            'service': 'mobile_alerts',
            'timestamp': timezone.now().isoformat(),
            'version': '1.0.0'
        })