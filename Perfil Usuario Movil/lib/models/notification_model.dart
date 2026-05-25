class NotificationModel {
  final int id;
  final String title;
  final String body;
  final String severity;
  final Map<String, dynamic>? payload;
  final String? ruleName;
  final bool isRead;
  final DateTime createdAt;

  NotificationModel({
    required this.id,
    required this.title,
    required this.body,
    required this.severity,
    this.payload,
    this.ruleName,
    required this.isRead,
    required this.createdAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id'],
      title: json['title'],
      body: json['body'],
      severity: json['severity'] ?? 'info',
      payload: json['payload'],
      ruleName: json['rule_name'],
      isRead: json['is_read'] ?? false,
      createdAt: DateTime.parse(json['created_at']),
    );
  }

  String get severityIcon {
    switch (severity.toLowerCase()) {
      case 'critical':
        return '!';
      case 'high':
        return '!';
      case 'medium':
        return 'i';
      case 'low':
        return 'i';
      case 'info':
      default:
        return 'i';
    }
  }

  String get severityText {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'Crítica';
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Media';
      case 'low':
        return 'Baja';
      case 'info':
      default:
        return 'Info';
    }
  }

  String get timeAgo {
    final now = DateTime.now();
    final difference = now.difference(createdAt);

    if (difference.inMinutes < 1) {
      return 'Ahora';
    } else if (difference.inMinutes < 60) {
      return 'hace ${difference.inMinutes}m';
    } else if (difference.inHours < 24) {
      return 'hace ${difference.inHours}h';
    } else if (difference.inDays < 7) {
      return 'hace ${difference.inDays}d';
    } else {
      return '${createdAt.day}/${createdAt.month}/${createdAt.year}';
    }
  }
}