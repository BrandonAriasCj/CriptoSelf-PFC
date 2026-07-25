import 'secrets.dart';

class AppConstants {
  // API Configuration
  //
  // El backend expone dos namespaces:
  // - /api/mobile/* — guest devices (sin auth, identidad por device_id)
  // - /api/auth/*  + /api/alerts/* — usuarios autenticados (OAuth2 Bearer)
  //
  // Default = produccion (api.criptoself.com). Para dev local override con:
  //   flutter run --dart-define=API_HOST=http://10.0.2.2:8000   (Android Emulator)
  //   flutter run --dart-define=API_HOST=http://localhost:8000  (iOS Simulator)
  static const String _host = String.fromEnvironment(
    'API_HOST',
    defaultValue: 'https://api.criptoself.com',
  );

  static const String baseUrl = '$_host/api/mobile';
  static const String authBaseUrl = '$_host/api/auth';
  static const String alertsBaseUrl = '$_host/api/alerts';

  // Host base (sin path). Lo usa el WebSocket de notificaciones para derivar
  // ws:// o wss:// según el esquema (ver NotificationsSocket).
  static const String host = _host;

  // OAuth2 client credentials. Los valores viven en `secrets.dart` (gitignored).
  // Para release o staging, sobrescribilos en runtime vía --dart-define.
  static const String oauthClientId = String.fromEnvironment(
    'MOBILE_OAUTH_CLIENT_ID',
    defaultValue: defaultOauthClientId,
  );
  static const String oauthClientSecret = String.fromEnvironment(
    'MOBILE_OAUTH_CLIENT_SECRET',
    defaultValue: defaultOauthClientSecret,
  );

  // Google Sign-In: el `serverClientId` debe ser el client_id Web del proyecto
  // de Google Cloud (no el Android/iOS). Es lo que permite que el backend
  // valide el server_auth_code emitido por Google.
  static const String googleServerClientId = String.fromEnvironment(
    'GOOGLE_SERVER_CLIENT_ID',
    defaultValue: defaultGoogleServerClientId,
  );

  
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