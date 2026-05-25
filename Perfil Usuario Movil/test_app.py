#!/usr/bin/env python3
"""
Script de prueba para la API móvil de alertas.
Simula el comportamiento de la app Flutter.
"""

import requests
import json
import time
from datetime import datetime

# Configuración
BASE_URL = "http://localhost:8000/api/mobile"
DEVICE_DATA = {
    "device_name": "Test Flutter App",
    "platform": "android",
    "fcm_token": "test_fcm_token_12345",
    "enabled_alerts": True,
    "price_alerts": True,
    "market_news": True,
    "system_announcements": True,
    "max_alerts_per_hour": 10
}

class MobileAPITester:
    def __init__(self):
        self.device_id = None
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })

    def test_health_check(self):
        """Test 1: Health check"""
        print("🔍 Test 1: Health Check")
        try:
            response = self.session.get(f"{BASE_URL}/health/")
            response.raise_for_status()
            data = response.json()
            print(f"   ✅ Status: {data['status']}")
            print(f"   ✅ Service: {data['service']}")
            return True
        except Exception as e:
            print(f"   ❌ Error: {e}")
            return False

    def test_register_device(self):
        """Test 2: Registrar dispositivo"""
        print("\n📱 Test 2: Registrar Dispositivo")
        try:
            response = self.session.post(f"{BASE_URL}/devices/", json=DEVICE_DATA)
            response.raise_for_status()
            data = response.json()
            print(f"   📋 Response data: {data}")
            self.device_id = data['device_id']
            print(f"   ✅ Device ID: {self.device_id}")
            print(f"   ✅ Device Name: {data['device_name']}")
            print(f"   ✅ Platform: {data['platform']}")
            return True
        except Exception as e:
            print(f"   ❌ Error: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"   📋 Response status: {e.response.status_code}")
                print(f"   📋 Response text: {e.response.text}")
            return False

    def test_get_device_info(self):
        """Test 3: Obtener información del dispositivo"""
        print("\n📋 Test 3: Información del Dispositivo")
        if not self.device_id:
            print("   ❌ No device ID available")
            return False
        
        try:
            response = self.session.get(f"{BASE_URL}/devices/{self.device_id}/")
            response.raise_for_status()
            data = response.json()
            print(f"   ✅ Device Name: {data['device_name']}")
            print(f"   ✅ Enabled Alerts: {data['enabled_alerts']}")
            print(f"   ✅ Max Alerts/Hour: {data['max_alerts_per_hour']}")
            return True
        except Exception as e:
            print(f"   ❌ Error: {e}")
            return False

    def test_get_available_alerts(self):
        """Test 4: Obtener alertas disponibles"""
        print("\n🚨 Test 4: Alertas Disponibles")
        try:
            response = self.session.get(f"{BASE_URL}/alerts/")
            response.raise_for_status()
            data = response.json()
            print(f"   ✅ Total alerts: {data['count']}")
            
            for alert in data['results'][:3]:  # Mostrar solo las primeras 3
                print(f"   📊 {alert['name']} ({alert['event_type']})")
            
            self.available_alerts = data['results']
            return True
        except Exception as e:
            print(f"   ❌ Error: {e}")
            return False

    def test_subscribe_to_alerts(self):
        """Test 5: Suscribirse a alertas"""
        print("\n✅ Test 5: Suscribirse a Alertas")
        if not self.device_id or not hasattr(self, 'available_alerts'):
            print("   ❌ Prerequisites not met")
            return False
        
        success_count = 0
        for alert in self.available_alerts[:2]:  # Suscribirse a las primeras 2
            try:
                subscription_data = {
                    "alert_rule_id": alert['id'],
                    "is_active": True
                }
                response = self.session.post(
                    f"{BASE_URL}/devices/{self.device_id}/subscriptions/",
                    json=subscription_data
                )
                response.raise_for_status()
                data = response.json()
                print(f"   ✅ Subscribed to: {alert['name']}")
                success_count += 1
            except Exception as e:
                print(f"   ❌ Error subscribing to {alert['name']}: {e}")
        
        return success_count > 0

    def test_get_subscriptions(self):
        """Test 6: Obtener suscripciones"""
        print("\n📝 Test 6: Mis Suscripciones")
        if not self.device_id:
            print("   ❌ No device ID available")
            return False
        
        try:
            response = self.session.get(f"{BASE_URL}/devices/{self.device_id}/subscriptions/")
            response.raise_for_status()
            data = response.json()
            print(f"   ✅ Total subscriptions: {len(data)}")
            
            for sub in data:
                status = "🟢 Active" if sub['is_active'] else "🔴 Inactive"
                print(f"   {status} {sub['alert_rule']['name']}")
            
            return True
        except Exception as e:
            print(f"   ❌ Error: {e}")
            return False

    def test_get_notifications(self):
        """Test 7: Obtener notificaciones"""
        print("\n📬 Test 7: Notificaciones")
        if not self.device_id:
            print("   ❌ No device ID available")
            return False
        
        try:
            response = self.session.get(f"{BASE_URL}/devices/{self.device_id}/notifications/")
            response.raise_for_status()
            data = response.json()
            print(f"   ✅ Total notifications: {data['count']}")
            
            if data['results']:
                for notif in data['results'][:3]:
                    print(f"   📩 {notif['title']}")
            else:
                print("   ℹ️  No notifications yet (this is normal for a new device)")
            
            return True
        except Exception as e:
            print(f"   ❌ Error: {e}")
            return False

    def test_device_stats(self):
        """Test 8: Estadísticas del dispositivo"""
        print("\n📊 Test 8: Estadísticas")
        if not self.device_id:
            print("   ❌ No device ID available")
            return False
        
        try:
            response = self.session.get(f"{BASE_URL}/devices/{self.device_id}/stats/")
            response.raise_for_status()
            data = response.json()
            print(f"   ✅ Total subscriptions: {data['total_subscriptions']}")
            print(f"   ✅ Active subscriptions: {data['active_subscriptions']}")
            print(f"   ✅ Notifications today: {data['notifications_today']}")
            print(f"   ✅ Notifications this week: {data['notifications_this_week']}")
            return True
        except Exception as e:
            print(f"   ❌ Error: {e}")
            return False

    def test_update_preferences(self):
        """Test 9: Actualizar preferencias"""
        print("\n⚙️  Test 9: Actualizar Preferencias")
        if not self.device_id:
            print("   ❌ No device ID available")
            return False
        
        try:
            updates = {
                "device_name": "Test Flutter App (Updated)",
                "max_alerts_per_hour": 15,
                "market_news": False  # Desactivar noticias
            }
            response = self.session.patch(
                f"{BASE_URL}/devices/{self.device_id}/",
                json=updates
            )
            response.raise_for_status()
            data = response.json()
            print(f"   ✅ Device name: {data['device_name']}")
            print(f"   ✅ Max alerts/hour: {data['max_alerts_per_hour']}")
            print(f"   ✅ Market news: {data['market_news']}")
            return True
        except Exception as e:
            print(f"   ❌ Error: {e}")
            return False

    def run_all_tests(self):
        """Ejecutar todos los tests"""
        print("🚀 Iniciando Tests de la API Móvil")
        print("=" * 50)
        
        tests = [
            self.test_health_check,
            self.test_register_device,
            self.test_get_device_info,
            self.test_get_available_alerts,
            self.test_subscribe_to_alerts,
            self.test_get_subscriptions,
            self.test_get_notifications,
            self.test_device_stats,
            self.test_update_preferences,
        ]
        
        passed = 0
        total = len(tests)
        
        for test in tests:
            if test():
                passed += 1
            time.sleep(0.5)  # Pequeña pausa entre tests
        
        print("\n" + "=" * 50)
        print(f"🎯 Resultados: {passed}/{total} tests pasaron")
        
        if passed == total:
            print("🎉 ¡Todos los tests pasaron! La API móvil está funcionando correctamente.")
        else:
            print("⚠️  Algunos tests fallaron. Revisa la configuración del servidor.")
        
        if self.device_id:
            print(f"\n📱 Device ID para referencia: {self.device_id}")
        
        return passed == total


def main():
    print("🔧 Verificando que el servidor esté ejecutándose...")
    try:
        response = requests.get("http://localhost:8000/api/mobile/health/", timeout=5)
        if response.status_code == 200:
            print("✅ Servidor detectado y funcionando")
        else:
            print("❌ Servidor responde pero con error")
            return
    except requests.exceptions.RequestException:
        print("❌ No se puede conectar al servidor")
        print("   Asegúrate de que el servidor Django esté ejecutándose en http://localhost:8000")
        print("   Ejecuta: python manage.py runserver")
        return
    
    # Ejecutar tests
    tester = MobileAPITester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎊 ¡La API móvil está lista para usar con Flutter!")
    else:
        print("\n🔧 Revisa los errores y la configuración del servidor.")


if __name__ == "__main__":
    main()