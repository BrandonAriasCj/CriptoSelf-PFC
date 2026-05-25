"""
Servicios para el sistema de alertas móviles.

Incluye funciones para:
- Envío de notificaciones push a dispositivos móviles
- Gestión de suscripciones automáticas
- Control de frecuencia de alertas
- Integración con el dispatcher principal
"""

import logging
from datetime import timedelta
from typing import List, Optional

from django.db.models import Count
from django.utils import timezone

from alerts.models import AlertRule, Notification
from .models import MobileGuestDevice, MobileAlertSubscription, MobileNotificationLog

logger = logging.getLogger(__name__)


class MobileAlertService:
    """Servicio principal para gestión de alertas móviles"""
    
    @staticmethod
    def create_system_alert_subscriptions():
        """
        Crea alertas predefinidas del sistema para dispositivos móviles.
        
        Esta función debe ejecutarse una vez para crear las reglas básicas
        que estarán disponibles para suscripción móvil.
        """
        system_alerts = [
            {
                'name': 'Bitcoin - Cambio Mayor 5%',
                'event_type': 'PRICE_CHANGE_PERCENT',
                'params': {
                    'symbol': 'BTC',
                    'threshold': 5.0,
                    'direction': 'both'
                },
                'cooldown_seconds': 3600,  # 1 hora
            },
            {
                'name': 'Ethereum - Cambio Mayor 5%',
                'event_type': 'PRICE_CHANGE_PERCENT',
                'params': {
                    'symbol': 'ETH',
                    'threshold': 5.0,
                    'direction': 'both'
                },
                'cooldown_seconds': 3600,
            },
            {
                'name': 'Bitcoin - Precio Cruza $50,000',
                'event_type': 'PRICE_THRESHOLD',
                'params': {
                    'symbol': 'BTC',
                    'threshold': 50000,
                    'direction': 'both'
                },
                'cooldown_seconds': 7200,  # 2 horas
            },
            {
                'name': 'Ethereum - Precio Cruza $3,000',
                'event_type': 'PRICE_THRESHOLD',
                'params': {
                    'symbol': 'ETH',
                    'threshold': 3000,
                    'direction': 'both'
                },
                'cooldown_seconds': 7200,
            },
            {
                'name': 'Noticias Importantes del Mercado',
                'event_type': 'MARKET_NEWS',
                'params': {
                    'importance': 'high'
                },
                'cooldown_seconds': 1800,  # 30 minutos
            },
            {
                'name': 'Anuncios del Sistema',
                'event_type': 'SYSTEM_ANNOUNCEMENT',
                'params': {},
                'cooldown_seconds': 0,  # Sin cooldown para anuncios
            }
        ]
        
        created_count = 0
        for alert_data in system_alerts:
            rule, created = AlertRule.objects.get_or_create(
                name=alert_data['name'],
                event_type=alert_data['event_type'],
                is_system=True,
                defaults={
                    'params': alert_data['params'],
                    'cooldown_seconds': alert_data['cooldown_seconds'],
                    'enabled': True,
                    'user_id': 1,  # Usuario admin por defecto
                }
            )
            if created:
                created_count += 1
                logger.info(f"Creada regla del sistema: {rule.name}")
        
        logger.info(f"Proceso completado. {created_count} nuevas reglas creadas.")
        return created_count
    
    @staticmethod
    def auto_subscribe_device(device: MobileGuestDevice) -> int:
        """
        Suscribe automáticamente un dispositivo a alertas básicas según sus preferencias.
        
        Args:
            device: El dispositivo móvil a suscribir
            
        Returns:
            Número de suscripciones creadas
        """
        if not device.enabled_alerts:
            return 0
        
        # Mapeo de preferencias a tipos de eventos
        event_type_mapping = {
            'price_alerts': ['PRICE_CHANGE_PERCENT', 'PRICE_THRESHOLD'],
            'market_news': ['MARKET_NEWS'],
            'system_announcements': ['SYSTEM_ANNOUNCEMENT'],
        }
        
        # Determinar qué tipos de eventos suscribir
        desired_event_types = []
        for pref_field, event_types in event_type_mapping.items():
            if getattr(device, pref_field, False):
                desired_event_types.extend(event_types)
        
        if not desired_event_types:
            return 0
        
        # Obtener reglas del sistema disponibles
        available_rules = AlertRule.objects.filter(
            is_system=True,
            enabled=True,
            event_type__in=desired_event_types
        )
        
        created_count = 0
        for rule in available_rules:
            subscription, created = MobileAlertSubscription.objects.get_or_create(
                device=device,
                alert_rule=rule,
                defaults={'is_active': True}
            )
            if created:
                created_count += 1
                logger.info(f"Suscripción creada: {device} → {rule.name}")
        
        return created_count
    
    @staticmethod
    def should_send_notification(device: MobileGuestDevice, notification: Notification) -> bool:
        """
        Determina si se debe enviar una notificación a un dispositivo específico.
        
        Considera:
        - Límite de alertas por hora del dispositivo
        - Si el dispositivo tiene alertas habilitadas
        - Si ya se envió esta notificación al dispositivo
        
        Args:
            device: El dispositivo móvil
            notification: La notificación a enviar
            
        Returns:
            True si se debe enviar, False en caso contrario
        """
        # Verificar si las alertas están habilitadas
        if not device.enabled_alerts:
            return False
        
        # Verificar si ya se envió esta notificación
        if MobileNotificationLog.objects.filter(
            device=device,
            notification=notification
        ).exists():
            return False
        
        # Verificar límite de alertas por hora
        one_hour_ago = timezone.now() - timedelta(hours=1)
        recent_notifications = MobileNotificationLog.objects.filter(
            device=device,
            created_at__gte=one_hour_ago
        ).count()
        
        if recent_notifications >= device.max_alerts_per_hour:
            logger.warning(
                f"Límite de alertas alcanzado para {device}: "
                f"{recent_notifications}/{device.max_alerts_per_hour}"
            )
            return False
        
        return True
    
    @staticmethod
    def send_notification_to_device(device: MobileGuestDevice, notification: Notification) -> bool:
        """
        Envía una notificación a un dispositivo móvil específico.
        
        Args:
            device: El dispositivo móvil
            notification: La notificación a enviar
            
        Returns:
            True si se envió exitosamente, False en caso contrario
        """
        if not MobileAlertService.should_send_notification(device, notification):
            return False
        
        # Crear log de notificación
        log = MobileNotificationLog.objects.create(
            device=device,
            notification=notification,
            delivery_status='pending'
        )
        
        try:
            # Intentar envío por FCM si hay token
            if device.fcm_token:
                success = MobilePushService.send_fcm_notification(
                    device.fcm_token,
                    notification.title,
                    notification.body,
                    notification.payload
                )
                
                if success:
                    log.delivery_status = 'sent'
                    log.sent_at = timezone.now()
                else:
                    log.delivery_status = 'failed'
                    log.error_message = 'FCM send failed'
            else:
                # Sin token FCM, marcar como enviado para tracking
                log.delivery_status = 'sent'
                log.sent_at = timezone.now()
            
            log.save()
            return log.delivery_status == 'sent'
            
        except Exception as e:
            logger.exception(f"Error enviando notificación a {device}: {e}")
            log.delivery_status = 'failed'
            log.error_message = str(e)
            log.save()
            return False
    
    @staticmethod
    def broadcast_to_subscribed_devices(notification: Notification) -> int:
        """
        Envía una notificación a todos los dispositivos suscritos a la regla correspondiente.
        
        Args:
            notification: La notificación a enviar
            
        Returns:
            Número de dispositivos a los que se envió exitosamente
        """
        if not notification.rule:
            return 0
        
        # Obtener dispositivos suscritos a esta regla
        subscribed_devices = MobileGuestDevice.objects.filter(
            alert_subscriptions__alert_rule=notification.rule,
            alert_subscriptions__is_active=True,
            enabled_alerts=True
        ).distinct()
        
        sent_count = 0
        for device in subscribed_devices:
            if MobileAlertService.send_notification_to_device(device, notification):
                sent_count += 1
        
        logger.info(
            f"Notificación '{notification.title}' enviada a {sent_count} "
            f"de {subscribed_devices.count()} dispositivos suscritos"
        )
        
        return sent_count


class MobilePushService:
    """Servicio para envío de notificaciones push via Firebase Cloud Messaging"""
    
    @staticmethod
    def send_fcm_notification(fcm_token: str, title: str, body: str, data: dict = None) -> bool:
        """
        Envía una notificación push via FCM.
        
        Args:
            fcm_token: Token FCM del dispositivo
            title: Título de la notificación
            body: Cuerpo de la notificación
            data: Datos adicionales (opcional)
            
        Returns:
            True si se envió exitosamente, False en caso contrario
        """
        # TODO: Implementar integración real con FCM
        # Por ahora es un stub que simula el envío
        
        logger.info(f"[FCM STUB] Enviando notificación: {title} → {fcm_token[:20]}...")
        
        try:
            # Aquí iría la integración real con Firebase Admin SDK
            # from firebase_admin import messaging
            # 
            # message = messaging.Message(
            #     notification=messaging.Notification(
            #         title=title,
            #         body=body,
            #     ),
            #     data=data or {},
            #     token=fcm_token,
            # )
            # 
            # response = messaging.send(message)
            # return bool(response)
            
            # Por ahora simulamos éxito
            return True
            
        except Exception as e:
            logger.error(f"Error enviando FCM: {e}")
            return False


class MobileDeviceManager:
    """Gestor para operaciones de dispositivos móviles"""
    
    @staticmethod
    def cleanup_inactive_devices(days_inactive: int = 30) -> int:
        """
        Limpia dispositivos inactivos después de X días.
        
        Args:
            days_inactive: Días de inactividad antes de limpiar
            
        Returns:
            Número de dispositivos eliminados
        """
        cutoff_date = timezone.now() - timedelta(days=days_inactive)
        
        inactive_devices = MobileGuestDevice.objects.filter(
            last_active_at__lt=cutoff_date
        )
        
        count = inactive_devices.count()
        inactive_devices.delete()
        
        logger.info(f"Eliminados {count} dispositivos inactivos (>{days_inactive} días)")
        return count
    
    @staticmethod
    def get_device_stats() -> dict:
        """
        Obtiene estadísticas generales de dispositivos móviles.
        
        Returns:
            Diccionario con estadísticas
        """
        now = timezone.now()
        today = now.date()
        week_ago = now - timedelta(days=7)
        
        total_devices = MobileGuestDevice.objects.count()
        active_devices = MobileGuestDevice.objects.filter(enabled_alerts=True).count()
        devices_today = MobileGuestDevice.objects.filter(created_at__date=today).count()
        devices_this_week = MobileGuestDevice.objects.filter(created_at__gte=week_ago).count()
        
        platform_stats = MobileGuestDevice.objects.values('platform').annotate(
            count=Count('id')
        ).order_by('-count')
        
        return {
            'total_devices': total_devices,
            'active_devices': active_devices,
            'devices_registered_today': devices_today,
            'devices_registered_this_week': devices_this_week,
            'platform_distribution': list(platform_stats),
        }