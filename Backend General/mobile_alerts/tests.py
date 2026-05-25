"""
Tests para la API móvil de alertas.

Pruebas básicas para verificar el funcionamiento del perfil móvil mínimo.
"""

import uuid
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status

from alerts.models import AlertRule
from .models import MobileGuestDevice, MobileAlertSubscription
from .services import MobileAlertService


class MobileGuestDeviceModelTest(TestCase):
    """Tests para el modelo MobileGuestDevice"""
    
    def test_create_device(self):
        """Test crear dispositivo móvil"""
        device = MobileGuestDevice.objects.create(
            device_name="Test iPhone",
            platform="ios",
            fcm_token="test_token"
        )
        
        self.assertIsNotNone(device.device_id)
        self.assertEqual(device.device_name, "Test iPhone")
        self.assertEqual(device.platform, "ios")
        self.assertTrue(device.enabled_alerts)
        self.assertEqual(device.max_alerts_per_hour, 5)
    
    def test_device_str(self):
        """Test representación string del dispositivo"""
        device = MobileGuestDevice.objects.create(
            device_name="Test Device",
            platform="android"
        )
        
        str_repr = str(device)
        self.assertIn("Test Device", str_repr)
        self.assertIn(str(device.device_id)[:8], str_repr)


class MobileAlertsAPITest(APITestCase):
    """Tests para la API móvil de alertas"""
    
    def setUp(self):
        """Configuración inicial para tests"""
        # Crear algunas reglas del sistema
        self.system_rule = AlertRule.objects.create(
            name="Test System Alert",
            event_type="PRICE_CHANGE_PERCENT",
            params={"symbol": "BTC", "threshold": 5.0},
            is_system=True,
            enabled=True,
            user_id=1
        )
    
    def test_health_check(self):
        """Test endpoint de salud"""
        url = reverse('mobile_alerts:health')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'healthy')
        self.assertEqual(response.data['service'], 'mobile_alerts')
    
    def test_create_device(self):
        """Test crear dispositivo móvil"""
        url = reverse('mobile_alerts:mobile-device-list')
        data = {
            'device_name': 'Test iPhone',
            'platform': 'ios',
            'fcm_token': 'test_fcm_token',
            'enabled_alerts': True,
            'price_alerts': True,
            'market_news': False,
            'max_alerts_per_hour': 10
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('device_id', response.data)
        self.assertEqual(response.data['device_name'], 'Test iPhone')
        self.assertEqual(response.data['platform'], 'ios')
        self.assertTrue(response.data['enabled_alerts'])
        self.assertEqual(response.data['max_alerts_per_hour'], 10)
    
    def test_get_device_info(self):
        """Test obtener información del dispositivo"""
        device = MobileGuestDevice.objects.create(
            device_name="Test Device",
            platform="android"
        )
        
        url = reverse('mobile_alerts:mobile-device-detail', kwargs={'device_id': device.device_id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['device_id'], str(device.device_id))
        self.assertEqual(response.data['device_name'], "Test Device")
    
    def test_get_system_alerts(self):
        """Test obtener alertas del sistema"""
        url = reverse('mobile_alerts:system-alerts')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('count', response.data)
        self.assertIn('results', response.data)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['name'], "Test System Alert")
    
    def test_create_subscription(self):
        """Test crear suscripción a alerta"""
        device = MobileGuestDevice.objects.create(
            device_name="Test Device",
            platform="android"
        )
        
        url = reverse('mobile_alerts:device-subscriptions', kwargs={'device_id': device.device_id})
        data = {
            'alert_rule_id': self.system_rule.id,
            'is_active': True
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['alert_rule']['id'], self.system_rule.id)
        self.assertTrue(response.data['is_active'])
    
    def test_get_device_subscriptions(self):
        """Test obtener suscripciones del dispositivo"""
        device = MobileGuestDevice.objects.create(
            device_name="Test Device",
            platform="android"
        )
        
        # Crear suscripción
        MobileAlertSubscription.objects.create(
            device=device,
            alert_rule=self.system_rule,
            is_active=True
        )
        
        url = reverse('mobile_alerts:device-subscriptions', kwargs={'device_id': device.device_id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['alert_rule']['id'], self.system_rule.id)
    
    def test_get_device_notifications(self):
        """Test obtener notificaciones del dispositivo"""
        device = MobileGuestDevice.objects.create(
            device_name="Test Device",
            platform="android"
        )
        
        url = reverse('mobile_alerts:device-notifications', kwargs={'device_id': device.device_id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('count', response.data)
        self.assertIn('results', response.data)
    
    def test_device_not_found(self):
        """Test dispositivo no encontrado"""
        fake_device_id = uuid.uuid4()
        url = reverse('mobile_alerts:mobile-device-detail', kwargs={'device_id': fake_device_id})
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class MobileAlertServiceTest(TestCase):
    """Tests para MobileAlertService"""
    
    def test_create_system_alert_subscriptions(self):
        """Test crear alertas del sistema"""
        # Crear usuario admin básico
        from django.contrib.auth import get_user_model
        User = get_user_model()
        User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='testpass'
        )
        
        created_count = MobileAlertService.create_system_alert_subscriptions()
        
        self.assertGreater(created_count, 0)
        
        # Verificar que se crearon reglas del sistema
        system_rules = AlertRule.objects.filter(is_system=True)
        self.assertGreater(system_rules.count(), 0)
    
    def test_auto_subscribe_device(self):
        """Test suscripción automática de dispositivo"""
        # Crear reglas del sistema
        AlertRule.objects.create(
            name="Price Alert",
            event_type="PRICE_CHANGE_PERCENT",
            is_system=True,
            enabled=True,
            user_id=1
        )
        
        AlertRule.objects.create(
            name="Market News",
            event_type="MARKET_NEWS",
            is_system=True,
            enabled=True,
            user_id=1
        )
        
        # Crear dispositivo con preferencias específicas
        device = MobileGuestDevice.objects.create(
            device_name="Test Device",
            platform="android",
            enabled_alerts=True,
            price_alerts=True,
            market_news=False,  # No quiere noticias
            system_announcements=False
        )
        
        # Auto-suscribir
        created_count = MobileAlertService.auto_subscribe_device(device)
        
        self.assertGreater(created_count, 0)
        
        # Verificar suscripciones
        subscriptions = device.alert_subscriptions.all()
        self.assertGreater(subscriptions.count(), 0)
        
        # Verificar que solo se suscribió a price alerts
        price_subs = subscriptions.filter(alert_rule__event_type="PRICE_CHANGE_PERCENT")
        self.assertGreater(price_subs.count(), 0)
        
        news_subs = subscriptions.filter(alert_rule__event_type="MARKET_NEWS")
        self.assertEqual(news_subs.count(), 0)  # No debería tener suscripciones a noticias