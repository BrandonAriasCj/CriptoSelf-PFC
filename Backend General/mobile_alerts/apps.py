from django.apps import AppConfig


class MobileAlertsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'mobile_alerts'
    verbose_name = 'Mobile Alerts'
    
    def ready(self):
        """Configurar integraciones cuando la app esté lista"""
        try:
            from .integrations import setup_mobile_integrations
            setup_mobile_integrations()
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.exception(f"Error configurando integraciones móviles: {e}")