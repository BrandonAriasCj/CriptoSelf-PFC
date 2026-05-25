"""
Modelos del sistema de alertas y notificaciones.

Tres modelos:
- `AlertRule`: condición configurable por el usuario (precio cruza umbral, RSI, etc.).
- `Notification`: evento ya disparado, persiste como historial y se entrega por WS/push.
- `UserDevice`: sesión web o dispositivo móvil donde entregar push (FCM se enchufa más adelante).
"""

from django.conf import settings
from django.db import models


class AlertRule(models.Model):
    """Regla configurada por el usuario o predefinida por el sistema.

    El campo `event_type` referencia una clase del registry de eventos
    (`alerts.events.registry`) que valida `params` y evalúa la condición.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='alert_rules',
    )
    name = models.CharField(max_length=120)
    event_type = models.CharField(max_length=64, db_index=True)
    params = models.JSONField(default=dict, blank=True)
    enabled = models.BooleanField(default=True)
    is_system = models.BooleanField(
        default=False,
        help_text='Reglas predefinidas del sistema. No editables por el usuario.',
    )
    cooldown_seconds = models.PositiveIntegerField(default=300)
    last_triggered_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'enabled']),
        ]

    def __str__(self):
        return f'{self.name} ({self.event_type}) · user={self.user_id}'


class Notification(models.Model):
    class Severity(models.TextChoices):
        INFO = 'info', 'Info'
        WARNING = 'warning', 'Warning'
        CRITICAL = 'critical', 'Critical'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    rule = models.ForeignKey(
        AlertRule,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notifications',
    )
    title = models.CharField(max_length=200)
    body = models.TextField(blank=True)
    severity = models.CharField(
        max_length=16,
        choices=Severity.choices,
        default=Severity.INFO,
    )
    payload = models.JSONField(
        default=dict,
        blank=True,
        help_text='Datos neutros para web y móvil: deep_link, icon, data.',
    )
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['user', 'read_at']),
        ]

    def __str__(self):
        return f'{self.title} · user={self.user_id}'

    @property
    def is_read(self) -> bool:
        return self.read_at is not None


class UserDevice(models.Model):
    """Sesión web o dispositivo móvil donde entregar notificaciones push.

    Para `web` el token puede ser un identificador de sesión (no se usa todavía,
    la entrega va por WebSocket). Para `ios`/`android` será el FCM/APNs token.
    """

    class Platform(models.TextChoices):
        WEB = 'web', 'Web'
        IOS = 'ios', 'iOS'
        ANDROID = 'android', 'Android'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='devices',
    )
    platform = models.CharField(max_length=16, choices=Platform.choices)
    token = models.CharField(max_length=512)
    name = models.CharField(
        max_length=120,
        blank=True,
        help_text='Etiqueta legible: "Chrome en MacBook", "iPhone de Brandon".',
    )
    enabled = models.BooleanField(default=True)
    last_seen_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'platform', 'token'],
                name='alerts_userdevice_unique_token_per_user_platform',
            ),
        ]
        indexes = [
            models.Index(fields=['user', 'enabled']),
        ]

    def __str__(self):
        return f'{self.platform}:{self.name or self.token[:12]} · user={self.user_id}'
