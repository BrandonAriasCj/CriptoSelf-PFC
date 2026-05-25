import '../models/device_model.dart';
import '../models/alert_model.dart';
import '../models/notification_model.dart';

class MockDataService {
  // Mock Device Data
  static DeviceModel getMockDevice() {
    return DeviceModel(
      deviceId: 'demo-device-12345',
      deviceName: 'iPhone de Demo',
      platform: 'ios',
      fcmToken: 'mock_fcm_token',
      enabledAlerts: true,
      priceAlerts: true,
      marketNews: true,
      systemAnnouncements: true,
      maxAlertsPerHour: 8,
      createdAt: DateTime.now().subtract(const Duration(days: 15)),
      lastActiveAt: DateTime.now().subtract(const Duration(minutes: 5)),
    );
  }

  // Mock Device Stats
  static DeviceStats getMockStats() {
    return DeviceStats(
      totalSubscriptions: 5,
      activeSubscriptions: 4,
      notificationsToday: 7,
      notificationsThisWeek: 23,
      lastNotification: DateTime.now().subtract(const Duration(hours: 2)),
    );
  }

  // Mock Alert Rules
  static List<AlertRule> getMockAlertRules() {
    return [
      AlertRule(
        id: 1,
        name: 'Bitcoin - Cambio Mayor 5%',
        eventType: 'PRICE_CHANGE_PERCENT',
        params: {
          'symbol': 'BTC',
          'threshold': 5.0,
          'direction': 'both'
        },
        enabled: true,
        cooldownSeconds: 3600,
        createdAt: DateTime.now().subtract(const Duration(days: 10)),
      ),
      AlertRule(
        id: 2,
        name: 'Bitcoin - Precio Cruza \$50,000',
        eventType: 'PRICE_THRESHOLD',
        params: {
          'symbol': 'BTC',
          'threshold': 50000,
          'direction': 'both'
        },
        enabled: true,
        cooldownSeconds: 7200,
        createdAt: DateTime.now().subtract(const Duration(days: 10)),
      ),
      AlertRule(
        id: 3,
        name: 'Ethereum - Cambio Mayor 5%',
        eventType: 'PRICE_CHANGE_PERCENT',
        params: {
          'symbol': 'ETH',
          'threshold': 5.0,
          'direction': 'both'
        },
        enabled: true,
        cooldownSeconds: 3600,
        createdAt: DateTime.now().subtract(const Duration(days: 10)),
      ),
      AlertRule(
        id: 4,
        name: 'Ethereum - Precio Cruza \$3,000',
        eventType: 'PRICE_THRESHOLD',
        params: {
          'symbol': 'ETH',
          'threshold': 3000,
          'direction': 'both'
        },
        enabled: true,
        cooldownSeconds: 7200,
        createdAt: DateTime.now().subtract(const Duration(days: 10)),
      ),
      AlertRule(
        id: 5,
        name: 'Noticias Importantes del Mercado',
        eventType: 'MARKET_NEWS',
        params: {
          'importance': 'high'
        },
        enabled: true,
        cooldownSeconds: 1800,
        createdAt: DateTime.now().subtract(const Duration(days: 10)),
      ),
      AlertRule(
        id: 6,
        name: 'Anuncios del Sistema',
        eventType: 'SYSTEM_ANNOUNCEMENT',
        params: {},
        enabled: true,
        cooldownSeconds: 0,
        createdAt: DateTime.now().subtract(const Duration(days: 10)),
      ),
    ];
  }

  // Mock Alert Subscriptions
  static List<AlertSubscription> getMockSubscriptions() {
    final alertRules = getMockAlertRules();
    return [
      AlertSubscription(
        id: 1,
        alertRule: alertRules[0], // Bitcoin 5%
        isActive: true,
        subscribedAt: DateTime.now().subtract(const Duration(days: 8)),
        updatedAt: DateTime.now().subtract(const Duration(days: 1)),
      ),
      AlertSubscription(
        id: 2,
        alertRule: alertRules[1], // Bitcoin $50k
        isActive: true,
        subscribedAt: DateTime.now().subtract(const Duration(days: 8)),
        updatedAt: DateTime.now().subtract(const Duration(days: 1)),
      ),
      AlertSubscription(
        id: 3,
        alertRule: alertRules[2], // Ethereum 5%
        isActive: true,
        subscribedAt: DateTime.now().subtract(const Duration(days: 7)),
        updatedAt: DateTime.now().subtract(const Duration(days: 1)),
      ),
      AlertSubscription(
        id: 4,
        alertRule: alertRules[4], // Market News
        isActive: true,
        subscribedAt: DateTime.now().subtract(const Duration(days: 5)),
        updatedAt: DateTime.now().subtract(const Duration(days: 1)),
      ),
      AlertSubscription(
        id: 5,
        alertRule: alertRules[5], // System Announcements
        isActive: false, // Desactivada para mostrar variedad
        subscribedAt: DateTime.now().subtract(const Duration(days: 3)),
        updatedAt: DateTime.now().subtract(const Duration(hours: 6)),
      ),
    ];
  }

  // Mock Notifications
  static List<NotificationModel> getMockNotifications() {
    return [
      NotificationModel(
        id: 1,
        title: 'Bitcoin subió 7.2%',
        body: 'El precio de Bitcoin ha experimentado un aumento significativo del 7.2% en las últimas 2 horas. Precio actual: \$52,340',
        severity: 'high',
        payload: {
          'symbol': 'BTC',
          'price_change': '+7.2%',
          'current_price': '\$52,340',
          'previous_price': '\$48,850',
          'volume_24h': '\$28.5B'
        },
        ruleName: 'Bitcoin - Cambio Mayor 5%',
        isRead: false,
        createdAt: DateTime.now().subtract(const Duration(hours: 2)),
      ),
      NotificationModel(
        id: 2,
        title: 'Noticias importantes del mercado',
        body: 'El Salvador anuncia la compra de 500 BTC adicionales para sus reservas nacionales, impulsando el sentimiento alcista.',
        severity: 'medium',
        payload: {
          'source': 'Reuters',
          'category': 'institutional',
          'impact': 'bullish'
        },
        ruleName: 'Noticias Importantes del Mercado',
        isRead: false,
        createdAt: DateTime.now().subtract(const Duration(hours: 4)),
      ),
      NotificationModel(
        id: 3,
        title: 'Ethereum alcanzó \$3,045',
        body: 'Ethereum ha cruzado el umbral de \$3,000 y actualmente cotiza en \$3,045, marcando un nuevo máximo semanal.',
        severity: 'medium',
        payload: {
          'symbol': 'ETH',
          'current_price': '\$3,045',
          'threshold': '\$3,000',
          'weekly_high': true
        },
        ruleName: 'Ethereum - Precio Cruza \$3,000',
        isRead: true,
        createdAt: DateTime.now().subtract(const Duration(hours: 8)),
      ),
      NotificationModel(
        id: 4,
        title: 'Bitcoin bajó 4.8%',
        body: 'Corrección en el precio de Bitcoin: -4.8% en las últimas 3 horas. Precio actual: \$47,890',
        severity: 'medium',
        payload: {
          'symbol': 'BTC',
          'price_change': '-4.8%',
          'current_price': '\$47,890',
          'support_level': '\$47,500'
        },
        ruleName: 'Bitcoin - Cambio Mayor 5%',
        isRead: true,
        createdAt: DateTime.now().subtract(const Duration(hours: 12)),
      ),
      NotificationModel(
        id: 5,
        title: 'Ethereum subió 6.1%',
        body: 'Fuerte impulso alcista en Ethereum con un aumento del 6.1%. Los inversores muestran confianza renovada.',
        severity: 'high',
        payload: {
          'symbol': 'ETH',
          'price_change': '+6.1%',
          'current_price': '\$2,987',
          'resistance_level': '\$3,100'
        },
        ruleName: 'Ethereum - Cambio Mayor 5%',
        isRead: true,
        createdAt: DateTime.now().subtract(const Duration(days: 1)),
      ),
      NotificationModel(
        id: 6,
        title: 'Regulación favorable en Europa',
        body: 'La Unión Europea aprueba marcos regulatorios más claros para criptomonedas, generando optimismo en el mercado.',
        severity: 'low',
        payload: {
          'region': 'Europe',
          'type': 'regulation',
          'sentiment': 'positive'
        },
        ruleName: 'Noticias Importantes del Mercado',
        isRead: true,
        createdAt: DateTime.now().subtract(const Duration(days: 1, hours: 6)),
      ),
      NotificationModel(
        id: 7,
        title: 'Bitcoin se acerca a \$50,000',
        body: 'Bitcoin cotiza en \$49,750, muy cerca del umbral psicológico de \$50,000. Los traders están atentos.',
        severity: 'medium',
        payload: {
          'symbol': 'BTC',
          'current_price': '\$49,750',
          'target': '\$50,000',
          'distance': '\$250'
        },
        ruleName: 'Bitcoin - Precio Cruza \$50,000',
        isRead: true,
        createdAt: DateTime.now().subtract(const Duration(days: 2)),
      ),
      NotificationModel(
        id: 8,
        title: 'Mantenimiento programado',
        body: 'El sistema estará en mantenimiento el domingo de 2:00 AM a 4:00 AM. Las alertas seguirán funcionando normalmente.',
        severity: 'info',
        payload: {
          'type': 'maintenance',
          'start_time': '2:00 AM',
          'end_time': '4:00 AM',
          'date': 'Domingo'
        },
        ruleName: 'Anuncios del Sistema',
        isRead: true,
        createdAt: DateTime.now().subtract(const Duration(days: 3)),
      ),
    ];
  }

  // Mock Recent Notifications (últimas 3)
  static List<NotificationModel> getMockRecentNotifications() {
    return getMockNotifications().take(3).toList();
  }

  // Mock Unread Notifications
  static List<NotificationModel> getMockUnreadNotifications() {
    return getMockNotifications().where((n) => !n.isRead).toList();
  }

  // Mock Critical Notifications
  static List<NotificationModel> getMockCriticalNotifications() {
    return getMockNotifications().where((n) => n.severity == 'critical').toList();
  }

  // Mock High Priority Notifications
  static List<NotificationModel> getMockHighPriorityNotifications() {
    return getMockNotifications().where((n) => n.severity == 'high').toList();
  }
}