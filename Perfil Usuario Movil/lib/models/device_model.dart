class DeviceModel {
  final String deviceId;
  final String deviceName;
  final String platform;
  final String? fcmToken;
  final bool enabledAlerts;
  final bool priceAlerts;
  final bool marketNews;
  final bool systemAnnouncements;
  final int maxAlertsPerHour;
  final DateTime createdAt;
  final DateTime? lastActiveAt;

  DeviceModel({
    required this.deviceId,
    required this.deviceName,
    required this.platform,
    this.fcmToken,
    required this.enabledAlerts,
    required this.priceAlerts,
    required this.marketNews,
    required this.systemAnnouncements,
    required this.maxAlertsPerHour,
    required this.createdAt,
    this.lastActiveAt,
  });

  factory DeviceModel.fromJson(Map<String, dynamic> json) {
    return DeviceModel(
      deviceId: json['device_id'],
      deviceName: json['device_name'] ?? '',
      platform: json['platform'] ?? 'android',
      fcmToken: json['fcm_token'],
      enabledAlerts: json['enabled_alerts'] ?? true,
      priceAlerts: json['price_alerts'] ?? true,
      marketNews: json['market_news'] ?? true,
      systemAnnouncements: json['system_announcements'] ?? true,
      maxAlertsPerHour: json['max_alerts_per_hour'] ?? 5,
      createdAt: DateTime.parse(json['created_at']),
      lastActiveAt: json['last_active_at'] != null 
          ? DateTime.parse(json['last_active_at']) 
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'device_name': deviceName,
      'platform': platform,
      'fcm_token': fcmToken,
      'enabled_alerts': enabledAlerts,
      'price_alerts': priceAlerts,
      'market_news': marketNews,
      'system_announcements': systemAnnouncements,
      'max_alerts_per_hour': maxAlertsPerHour,
    };
  }

  DeviceModel copyWith({
    String? deviceName,
    String? platform,
    String? fcmToken,
    bool? enabledAlerts,
    bool? priceAlerts,
    bool? marketNews,
    bool? systemAnnouncements,
    int? maxAlertsPerHour,
  }) {
    return DeviceModel(
      deviceId: deviceId,
      deviceName: deviceName ?? this.deviceName,
      platform: platform ?? this.platform,
      fcmToken: fcmToken ?? this.fcmToken,
      enabledAlerts: enabledAlerts ?? this.enabledAlerts,
      priceAlerts: priceAlerts ?? this.priceAlerts,
      marketNews: marketNews ?? this.marketNews,
      systemAnnouncements: systemAnnouncements ?? this.systemAnnouncements,
      maxAlertsPerHour: maxAlertsPerHour ?? this.maxAlertsPerHour,
      createdAt: createdAt,
      lastActiveAt: lastActiveAt,
    );
  }
}

class DeviceStats {
  final int totalSubscriptions;
  final int activeSubscriptions;
  final int notificationsToday;
  final int notificationsThisWeek;
  final DateTime? lastNotification;

  DeviceStats({
    required this.totalSubscriptions,
    required this.activeSubscriptions,
    required this.notificationsToday,
    required this.notificationsThisWeek,
    this.lastNotification,
  });

  factory DeviceStats.fromJson(Map<String, dynamic> json) {
    return DeviceStats(
      totalSubscriptions: json['total_subscriptions'] ?? 0,
      activeSubscriptions: json['active_subscriptions'] ?? 0,
      notificationsToday: json['notifications_today'] ?? 0,
      notificationsThisWeek: json['notifications_this_week'] ?? 0,
      lastNotification: json['last_notification'] != null
          ? DateTime.parse(json['last_notification'])
          : null,
    );
  }
}