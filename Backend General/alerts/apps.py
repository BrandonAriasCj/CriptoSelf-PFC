from django.apps import AppConfig


class AlertsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'alerts'
    verbose_name = 'Alertas y Notificaciones'

    def ready(self):
        # Registra el signal de onboarding (bienvenida + suscripción diaria).
        import alerts.signals  # noqa: F401
