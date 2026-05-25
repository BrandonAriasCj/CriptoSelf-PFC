class AppConstants {
  // API Configuration
  static const String baseUrl = 'http://10.0.2.2:8000/api/mobile'; // Android Emulator
  // static const String baseUrl = 'http://localhost:8000/api/mobile'; // iOS Simulator
  // static const String baseUrl = 'http://192.168.1.100:8000/api/mobile'; // Physical device
  
  // App Information
  static const String appName = 'CriptoSelf Mobile';
  static const String appVersion = '1.0.0';
  static const String appDescription = 'Alertas de criptomonedas sin autenticación';
  
  // Default Settings
  static const int defaultMaxAlertsPerHour = 5;
  static const int maxAlertsPerHourLimit = 20;
  static const int minAlertsPerHourLimit = 1;
  
  // Notification Settings
  static const String notificationChannelId = 'crypto_alerts';
  static const String notificationChannelName = 'Alertas de Criptomonedas';
  static const String notificationChannelDescription = 'Notificaciones de alertas de precios y noticias';
  
  // Storage Keys
  static const String deviceIdKey = 'device_id';
  static const String notificationsEnabledKey = 'notifications_enabled';
  static const String priceAlertsKey = 'price_alerts';
  static const String marketNewsKey = 'market_news';
  static const String systemAnnouncementsKey = 'system_announcements';
  
  // Error Messages
  static const String networkErrorMessage = 'Error de conexión. Verifica tu internet.';
  static const String serverErrorMessage = 'Error del servidor. Intenta más tarde.';
  static const String unknownErrorMessage = 'Error desconocido. Intenta nuevamente.';
  
  // Success Messages
  static const String deviceRegisteredMessage = 'Dispositivo registrado exitosamente';
  static const String preferencesUpdatedMessage = 'Preferencias actualizadas';
  static const String subscriptionAddedMessage = 'Suscripción agregada';
  static const String subscriptionRemovedMessage = 'Suscripción cancelada';
}