"""
Modelos para el perfil de usuario móvil mínimo enfocado en alertas.

Este módulo maneja usuarios anónimos/temporales que pueden acceder a alertas
básicas sin necesidad de registro completo.
"""

import uuid
from django.db import models
from django.utils import timezone


class MobileGuestDevice(models.Model):
    """
    Dispositivo móvil anónimo que puede recibir alertas básicas.
    
    No requiere autenticación completa, solo un device_id único para
    identificar el dispositivo y sus preferencias.
    """
    
    device_id = models.UUIDField(
        unique=True, 
        default=uuid.uuid4, 
        editable=False,
        help_text="Identificador único del dispositivo móvil"
    )
    
    # Información básica del dispositivo
    device_name = models.CharField(
        max_length=100, 
        blank=True,
        help_text="Nombre del dispositivo (ej: iPhone de Juan)"
    )
    
    platform = models.CharField(
        max_length=20,
        choices=[
            ('ios', 'iOS'),
            ('android', 'Android'),
            ('web', 'Web Mobile'),
        ],
        default='android'
    )
    
    # Token para push notifications (FCM)
    fcm_token = models.TextField(
        blank=True,
        help_text="Token de Firebase Cloud Messaging para push notifications"
    )
    
    # Preferencias de alertas
    enabled_alerts = models.BooleanField(
        default=True,
        help_text="Si el dispositivo quiere recibir alertas"
    )
    
    # Tipos de alertas que quiere recibir
    price_alerts = models.BooleanField(
        default=True,
        help_text="Alertas de cambios significativos de precio"
    )
    
    market_news = models.BooleanField(
        default=True,
        help_text="Noticias importantes del mercado"
    )
    
    system_announcements = models.BooleanField(
        default=True,
        help_text="Anuncios del sistema"
    )
    
    # Configuración de frecuencia
    max_alerts_per_hour = models.PositiveIntegerField(
        default=5,
        help_text="Máximo número de alertas por hora"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_active_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['device_id']),
            models.Index(fields=['enabled_alerts', 'last_active_at']),
        ]
    
    def __str__(self):
        name = self.device_name or f"{self.platform.title()} Device"
        return f"{name} ({str(self.device_id)[:8]}...)"
    
    def update_last_active(self):
        """Actualiza el timestamp de última actividad"""
        self.last_active_at = timezone.now()
        self.save(update_fields=['last_active_at'])


class MobileAlertSubscription(models.Model):
    """
    Suscripción de un dispositivo móvil a alertas predefinidas del sistema.
    
    Conecta un MobileGuestDevice con AlertRule del sistema principal,
    permitiendo que dispositivos anónimos reciban alertas específicas.
    """
    
    device = models.ForeignKey(
        MobileGuestDevice,
        on_delete=models.CASCADE,
        related_name='alert_subscriptions'
    )
    
    # Referencia a AlertRule del sistema principal
    alert_rule = models.ForeignKey(
        'alerts.AlertRule',
        on_delete=models.CASCADE,
        limit_choices_to={'is_system': True},  # Solo reglas del sistema
        help_text="Regla de alerta del sistema a la que está suscrito"
    )
    
    # Estado de la suscripción
    is_active = models.BooleanField(
        default=True,
        help_text="Si esta suscripción está activa"
    )
    
    # Timestamps
    subscribed_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['device', 'alert_rule']
        ordering = ['-subscribed_at']
        indexes = [
            models.Index(fields=['device', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.device} → {self.alert_rule.name}"


class MobileNotificationLog(models.Model):
    """
    Log de notificaciones enviadas a dispositivos móviles.
    
    Rastrea qué notificaciones se han enviado a cada dispositivo para
    evitar spam y permitir control de frecuencia.
    """
    
    device = models.ForeignKey(
        MobileGuestDevice,
        on_delete=models.CASCADE,
        related_name='notification_logs'
    )
    
    # Referencia a la notificación original
    notification = models.ForeignKey(
        'alerts.Notification',
        on_delete=models.CASCADE,
        help_text="Notificación original del sistema de alertas"
    )
    
    # Estado de entrega
    delivery_status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pendiente'),
            ('sent', 'Enviada'),
            ('delivered', 'Entregada'),
            ('failed', 'Falló'),
            ('clicked', 'Clickeada'),
        ],
        default='pending'
    )
    
    # Detalles de entrega
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    clicked_at = models.DateTimeField(null=True, blank=True)
    
    # Error info si falló
    error_message = models.TextField(blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['device', 'delivery_status']),
            models.Index(fields=['sent_at']),
        ]
    
    def __str__(self):
        return f"{self.device} - {self.notification.title} ({self.delivery_status})"