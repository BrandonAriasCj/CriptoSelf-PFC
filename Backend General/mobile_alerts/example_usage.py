"""
Ejemplo de uso de la API móvil de alertas.

Este script demuestra cómo una aplicación móvil interactuaría
con la API de alertas móviles.
"""

import requests
import json
import time
from typing import Dict, Any, Optional


class MobileAlertsClient:
    """Cliente de ejemplo para la API móvil de alertas"""
    
    def __init__(self, base_url: str = "http://localhost:8000/api/mobile"):
        self.base_url = base_url.rstrip('/')
        self.device_id: Optional[str] = None
        self.session = requests.Session()
    
    def health_check(self) -> Dict[str, Any]:
        """Verificar que la API esté funcionando"""
        response = self.session.get(f"{self.base_url}/health/")
        response.raise_for_status()
        return response.json()
    
    def register_device(self, device_name: str, platform: str = "android", 
                       fcm_token: str = "", **preferences) -> Dict[str, Any]:
        """Registrar un nuevo dispositivo móvil"""
        data = {
            "device_name": device_name,
            "platform": platform,
            "fcm_token": fcm_token,
            "enabled_alerts": True,
            "price_alerts": True,
            "market_news": True,
            "system_announcements": True,
            "max_alerts_per_hour": 5,
            **preferences
        }
        
        response = self.session.post(f"{self.base_url}/devices/", json=data)
        response.raise_for_status()
        
        result = response.json()
        self.device_id = result['device_id']
        return result
    
    def get_device_info(self) -> Dict[str, Any]:
        """Obtener información del dispositivo"""
        if not self.device_id:
            raise ValueError("Device not registered")
        
        response = self.session.get(f"{self.base_url}/devices/{self.device_id}/")
        response.raise_for_status()
        return response.json()
    
    def update_preferences(self, **preferences) -> Dict[str, Any]:
        """Actualizar preferencias del dispositivo"""
        if not self.device_id:
            raise ValueError("Device not registered")
        
        response = self.session.patch(
            f"{self.base_url}/devices/{self.device_id}/", 
            json=preferences
        )
        response.raise_for_status()
        return response.json()
    
    def get_available_alerts(self) -> Dict[str, Any]:
        """Obtener alertas del sistema disponibles"""
        response = self.session.get(f"{self.base_url}/alerts/")
        response.raise_for_status()
        return response.json()
    
    def get_subscriptions(self) -> list:
        """Obtener suscripciones actuales del dispositivo"""
        if not self.device_id:
            raise ValueError("Device not registered")
        
        response = self.session.get(
            f"{self.base_url}/devices/{self.device_id}/subscriptions/"
        )
        response.raise_for_status()
        return response.json()
    
    def subscribe_to_alert(self, alert_rule_id: int) -> Dict[str, Any]:
        """Suscribirse a una alerta específica"""
        if not self.device_id:
            raise ValueError("Device not registered")
        
        data = {
            "alert_rule_id": alert_rule_id,
            "is_active": True
        }
        
        response = self.session.post(
            f"{self.base_url}/devices/{self.device_id}/subscriptions/",
            json=data
        )
        response.raise_for_status()
        return response.json()
    
    def unsubscribe_from_alert(self, subscription_id: int) -> None:
        """Cancelar suscripción a una alerta"""
        if not self.device_id:
            raise ValueError("Device not registered")
        
        response = self.session.delete(
            f"{self.base_url}/devices/{self.device_id}/subscriptions/{subscription_id}/"
        )
        response.raise_for_status()
    
    def get_notifications(self, hours: int = 24, unread_only: bool = False, 
                         limit: int = 50) -> Dict[str, Any]:
        """Obtener notificaciones del dispositivo"""
        if not self.device_id:
            raise ValueError("Device not registered")
        
        params = {
            "hours": hours,
            "limit": limit
        }
        if unread_only:
            params["unread"] = "true"
        
        response = self.session.get(
            f"{self.base_url}/devices/{self.device_id}/notifications/",
            params=params
        )
        response.raise_for_status()
        return response.json()
    
    def mark_notification_as_read(self, notification_id: int, action: str = "read") -> Dict[str, Any]:
        """Marcar notificación como leída o clickeada"""
        if not self.device_id:
            raise ValueError("Device not registered")
        
        data = {"action": action}
        
        response = self.session.post(
            f"{self.base_url}/devices/{self.device_id}/notifications/{notification_id}/action/",
            json=data
        )
        response.raise_for_status()
        return response.json()
    
    def get_stats(self) -> Dict[str, Any]:
        """Obtener estadísticas del dispositivo"""
        if not self.device_id:
            raise ValueError("Device not registered")
        
        response = self.session.get(
            f"{self.base_url}/devices/{self.device_id}/stats/"
        )
        response.raise_for_status()
        return response.json()


def demo_usage():
    """Demostración de uso de la API móvil"""
    
    print("🚀 Demo de API Móvil de Alertas")
    print("=" * 50)
    
    # Crear cliente
    client = MobileAlertsClient()
    
    try:
        # 1. Health check
        print("\n1. Verificando salud de la API...")
        health = client.health_check()
        print(f"   ✅ API Status: {health['status']}")
        
        # 2. Registrar dispositivo
        print("\n2. Registrando dispositivo...")
        device_info = client.register_device(
            device_name="iPhone Demo",
            platform="ios",
            fcm_token="demo_fcm_token_12345",
            price_alerts=True,
            market_news=True,
            system_announcements=False,
            max_alerts_per_hour=10
        )
        print(f"   ✅ Dispositivo registrado: {device_info['device_id']}")
        
        # 3. Ver alertas disponibles
        print("\n3. Obteniendo alertas disponibles...")
        alerts = client.get_available_alerts()
        print(f"   📋 {alerts['count']} alertas disponibles:")
        for alert in alerts['results'][:3]:  # Mostrar solo las primeras 3
            print(f"      - {alert['name']} ({alert['event_type']})")
        
        # 4. Suscribirse a algunas alertas
        print("\n4. Suscribiéndose a alertas...")
        subscriptions_created = 0
        for alert in alerts['results'][:2]:  # Suscribirse a las primeras 2
            try:
                subscription = client.subscribe_to_alert(alert['id'])
                print(f"   ✅ Suscrito a: {alert['name']}")
                subscriptions_created += 1
            except requests.exceptions.HTTPError as e:
                print(f"   ❌ Error suscribiéndose a {alert['name']}: {e}")
        
        # 5. Ver suscripciones actuales
        print("\n5. Verificando suscripciones...")
        subscriptions = client.get_subscriptions()
        print(f"   📝 {len(subscriptions)} suscripciones activas:")
        for sub in subscriptions:
            status_icon = "🟢" if sub['is_active'] else "🔴"
            print(f"      {status_icon} {sub['alert_rule']['name']}")
        
        # 6. Ver notificaciones
        print("\n6. Obteniendo notificaciones...")
        notifications = client.get_notifications(hours=168)  # Última semana
        print(f"   📬 {notifications['count']} notificaciones encontradas")
        
        if notifications['results']:
            print("   Últimas notificaciones:")
            for notif in notifications['results'][:3]:
                read_status = "📖" if notif['is_read'] else "📩"
                print(f"      {read_status} {notif['title']}")
                print(f"         {notif['body'][:60]}...")
        
        # 7. Estadísticas
        print("\n7. Estadísticas del dispositivo...")
        stats = client.get_stats()
        print(f"   📊 Suscripciones totales: {stats['total_subscriptions']}")
        print(f"   📊 Suscripciones activas: {stats['active_subscriptions']}")
        print(f"   📊 Notificaciones hoy: {stats['notifications_today']}")
        print(f"   📊 Notificaciones esta semana: {stats['notifications_this_week']}")
        
        # 8. Actualizar preferencias
        print("\n8. Actualizando preferencias...")
        updated_info = client.update_preferences(
            max_alerts_per_hour=15,
            market_news=False  # Desactivar noticias de mercado
        )
        print(f"   ✅ Preferencias actualizadas")
        print(f"      Max alertas/hora: {updated_info['max_alerts_per_hour']}")
        print(f"      Noticias mercado: {updated_info['market_news']}")
        
        print("\n🎉 Demo completada exitosamente!")
        print(f"Device ID para referencia: {client.device_id}")
        
    except requests.exceptions.RequestException as e:
        print(f"\n❌ Error de conexión: {e}")
        print("Asegúrate de que el servidor esté ejecutándose en http://localhost:8000")
    except Exception as e:
        print(f"\n❌ Error inesperado: {e}")


if __name__ == "__main__":
    demo_usage()