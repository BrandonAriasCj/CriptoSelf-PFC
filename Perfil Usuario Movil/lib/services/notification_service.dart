import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';

class NotificationService {
  static final FlutterLocalNotificationsPlugin _localNotifications = 
      FlutterLocalNotificationsPlugin();

  static Future<void> initialize() async {
    // Configurar notificaciones locales
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    
    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );
    
    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );
  }

  static void _onNotificationTapped(NotificationResponse response) {
    print('Local notification tapped: ${response.payload}');
    // TODO: Navegar a la pantalla correspondiente
  }

  static Future<String?> getFCMToken() async {
    // Por ahora retornamos null ya que no usamos Firebase
    return null;
  }

  static Future<void> subscribeToTopic(String topic) async {
    print('Subscribe to topic: $topic (not implemented without Firebase)');
  }

  static Future<void> unsubscribeFromTopic(String topic) async {
    print('Unsubscribe from topic: $topic (not implemented without Firebase)');
  }

  // Guardar configuración de notificaciones
  static Future<void> saveNotificationSettings({
    required bool enabled,
    required bool priceAlerts,
    required bool marketNews,
    required bool systemAnnouncements,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('notifications_enabled', enabled);
    await prefs.setBool('price_alerts', priceAlerts);
    await prefs.setBool('market_news', marketNews);
    await prefs.setBool('system_announcements', systemAnnouncements);
  }

  // Cargar configuración de notificaciones
  static Future<Map<String, bool>> loadNotificationSettings() async {
    final prefs = await SharedPreferences.getInstance();
    return {
      'notifications_enabled': prefs.getBool('notifications_enabled') ?? true,
      'price_alerts': prefs.getBool('price_alerts') ?? true,
      'market_news': prefs.getBool('market_news') ?? true,
      'system_announcements': prefs.getBool('system_announcements') ?? true,
    };
  }

  // Mostrar notificación local simple
  static Future<void> showLocalNotification({
    required String title,
    required String body,
    String? payload,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      'crypto_alerts',
      'Alertas de Criptomonedas',
      channelDescription: 'Notificaciones de alertas de precios y noticias',
      importance: Importance.high,
      priority: Priority.high,
      showWhen: true,
    );
    
    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );
    
    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );
    
    await _localNotifications.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title,
      body,
      details,
      payload: payload,
    );
  }
}