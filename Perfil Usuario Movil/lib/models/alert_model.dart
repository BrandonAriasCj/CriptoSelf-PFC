class AlertRule {
  final int id;
  final String name;
  final String eventType;
  final Map<String, dynamic> params;
  final bool enabled;
  final int cooldownSeconds;
  final DateTime createdAt;

  AlertRule({
    required this.id,
    required this.name,
    required this.eventType,
    required this.params,
    required this.enabled,
    required this.cooldownSeconds,
    required this.createdAt,
  });

  factory AlertRule.fromJson(Map<String, dynamic> json) {
    return AlertRule(
      id: json['id'],
      name: json['name'],
      eventType: json['event_type'],
      params: json['params'] ?? {},
      enabled: json['enabled'] ?? true,
      cooldownSeconds: json['cooldown_seconds'] ?? 0,
      createdAt: DateTime.parse(json['created_at']),
    );
  }

  String get description {
    switch (eventType) {
      case 'PRICE_CHANGE_PERCENT':
        final symbol = params['symbol'] ?? '';
        final threshold = params['threshold'] ?? 0;
        return 'Cambio de $threshold% en $symbol';
      case 'PRICE_THRESHOLD':
        final symbol = params['symbol'] ?? '';
        final threshold = params['threshold'] ?? 0;
        return '$symbol cruza \$${threshold.toStringAsFixed(0)}';
      case 'MARKET_NEWS':
        return 'Noticias importantes del mercado';
      case 'SYSTEM_ANNOUNCEMENT':
        return 'Anuncios del sistema';
      default:
        return name;
    }
  }

  String get icon {
    switch (eventType) {
      case 'PRICE_CHANGE_PERCENT':
        return '%';
      case 'PRICE_THRESHOLD':
        return '\$';
      case 'MARKET_NEWS':
        return 'N';
      case 'SYSTEM_ANNOUNCEMENT':
        return 'S';
      default:
        return 'A';
    }
  }

  String get cooldownText {
    if (cooldownSeconds == 0) return 'Sin límite';
    if (cooldownSeconds < 3600) {
      return '${(cooldownSeconds / 60).round()} min';
    }
    return '${(cooldownSeconds / 3600).round()} h';
  }
}

class AlertSubscription {
  final int id;
  final AlertRule alertRule;
  final bool isActive;
  final DateTime subscribedAt;
  final DateTime updatedAt;

  AlertSubscription({
    required this.id,
    required this.alertRule,
    required this.isActive,
    required this.subscribedAt,
    required this.updatedAt,
  });

  factory AlertSubscription.fromJson(Map<String, dynamic> json) {
    return AlertSubscription(
      id: json['id'],
      alertRule: AlertRule.fromJson(json['alert_rule']),
      isActive: json['is_active'] ?? true,
      subscribedAt: DateTime.parse(json['subscribed_at']),
      updatedAt: DateTime.parse(json['updated_at']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'alert_rule_id': alertRule.id,
      'is_active': isActive,
    };
  }
}