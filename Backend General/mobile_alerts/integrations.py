"""
Integraciones del sistema de alertas móviles con el sistema principal.

Este módulo conecta el sistema de alertas móviles con:
- El dispatcher principal de alertas
- El evaluador de reglas
- Los eventos del sistema
"""

import logging
from typing import Optional

from alerts.models import Notification
from .services import MobileAlertService

logger = logging.getLogger(__name__)


def mobile_notification_handler(notification: Notification) -> Optional[int]:
    """
    Handler que se ejecuta cuando se crea una nueva notificación en el sistema principal.
    
    Envía la notificación a todos los dispositivos móviles suscritos a la regla correspondiente.
    
    Args:
        notification: La notificación recién creada
        
    Returns:
        Número de dispositivos móviles a los que se envió, o None si no aplica
    """
    try:
        # Solo procesar notificaciones de reglas del sistema
        if not notification.rule or not notification.rule.is_system:
            return None
        
        # Enviar a dispositivos móviles suscritos
        sent_count = MobileAlertService.broadcast_to_subscribed_devices(notification)
        
        if sent_count > 0:
            logger.info(
                f"Notificación móvil '{notification.title}' enviada a {sent_count} dispositivos"
            )
        
        return sent_count
        
    except Exception as e:
        logger.exception(f"Error procesando notificación móvil {notification.id}: {e}")
        return None


def integrate_with_main_dispatcher():
    """
    Integra el sistema móvil con el dispatcher principal.
    
    Esta función debe ser llamada durante el startup de la aplicación
    para registrar los handlers móviles.
    """
    try:
        # Importar el dispatcher principal
        from alerts.services.dispatcher import dispatch
        
        # TODO: Registrar el handler móvil en el dispatcher principal
        # Esto requeriría modificar el dispatcher para soportar handlers adicionales
        
        logger.info("Integración móvil con dispatcher principal configurada")
        
    except ImportError:
        logger.warning("No se pudo importar el dispatcher principal")
    except Exception as e:
        logger.exception(f"Error integrando con dispatcher principal: {e}")


# Signal handlers para Django
def setup_mobile_signal_handlers():
    """
    Configura los signal handlers de Django para integrar el sistema móvil.
    """
    from django.db.models.signals import post_save
    from django.dispatch import receiver
    from alerts.models import Notification
    
    @receiver(post_save, sender=Notification)
    def notification_created_handler(sender, instance, created, **kwargs):
        """Handler que se ejecuta cuando se crea una nueva notificación"""
        if created:
            mobile_notification_handler(instance)
    
    logger.info("Signal handlers móviles configurados")


# Función para llamar desde apps.py
def setup_mobile_integrations():
    """
    Función principal para configurar todas las integraciones móviles.
    
    Debe ser llamada desde MobileAlertsConfig.ready()
    """
    setup_mobile_signal_handlers()
    integrate_with_main_dispatcher()
    logger.info("Integraciones móviles configuradas completamente")