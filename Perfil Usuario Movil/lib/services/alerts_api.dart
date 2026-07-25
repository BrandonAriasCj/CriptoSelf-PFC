/// Cliente HTTP del namespace `/api/alerts/*` (modo autenticado).
///
/// Se usa cuando el usuario tiene sesión OAuth — todas las llamadas mandan
/// `Authorization: Bearer <token>`. La forma de los datos coincide con el
/// frontend web (`Perfil Usuario Web/src/services/notifications.ts`), así que
/// los providers móviles pueden consumir esto sin transformar payloads.
///
/// Endpoints cubiertos:
/// - GET    /api/alerts/notifications/                 — listado
/// - GET    /api/alerts/notifications/unread-count/    — contador
/// - PATCH  /api/alerts/notifications/<id>/read/       — marca leída
/// - POST   /api/alerts/notifications/mark-all-read/   — marca todas
/// - GET    /api/alerts/rules/                         — reglas del user
/// - GET    /api/alerts/event-types/                   — catálogo
/// - GET    /api/alerts/subscriptions/                 — estado digests
/// - PUT    /api/alerts/subscriptions/                 — toggle digests

import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/notification_model.dart';
import '../utils/constants.dart';

class AlertsApi {
  final String accessToken;

  const AlertsApi({required this.accessToken});

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer $accessToken',
      };

  Future<List<NotificationModel>> listNotifications({
    int page = 1,
    bool unreadOnly = false,
  }) async {
    final qp = {
      'page': '$page',
      if (unreadOnly) 'unread': 'true',
    };
    final uri = Uri.parse('${AppConstants.alertsBaseUrl}/notifications/')
        .replace(queryParameters: qp);
    final response = await http.get(uri, headers: _headers);
    _ensureOk(response);
    final body = jsonDecode(response.body) as Map<String, dynamic>;
    final results = (body['results'] as List<dynamic>? ?? const [])
        .whereType<Map<String, dynamic>>()
        .map(NotificationModel.fromJson)
        .toList(growable: false);
    return results;
  }

  Future<int> unreadCount() async {
    final response = await http.get(
      Uri.parse('${AppConstants.alertsBaseUrl}/notifications/unread-count/'),
      headers: _headers,
    );
    _ensureOk(response);
    final body = jsonDecode(response.body) as Map<String, dynamic>;
    return (body['count'] as num?)?.toInt() ?? 0;
  }

  Future<NotificationModel> markRead(int notificationId) async {
    final response = await http.patch(
      Uri.parse(
          '${AppConstants.alertsBaseUrl}/notifications/$notificationId/read/'),
      headers: _headers,
    );
    _ensureOk(response);
    final body = jsonDecode(response.body) as Map<String, dynamic>;
    return NotificationModel.fromJson(body);
  }

  Future<void> markAllRead() async {
    final response = await http.post(
      Uri.parse('${AppConstants.alertsBaseUrl}/notifications/mark-all-read/'),
      headers: _headers,
    );
    _ensureOk(response);
  }

  Future<Map<String, bool>> getSubscriptions() async {
    final response = await http.get(
      Uri.parse('${AppConstants.alertsBaseUrl}/subscriptions/'),
      headers: _headers,
    );
    _ensureOk(response);
    final body = jsonDecode(response.body) as Map<String, dynamic>;
    return body.map((k, v) => MapEntry(k, v == true));
  }

  Future<Map<String, bool>> updateSubscriptions(Map<String, bool> changes) async {
    final response = await http.put(
      Uri.parse('${AppConstants.alertsBaseUrl}/subscriptions/'),
      headers: _headers,
      body: jsonEncode(changes),
    );
    _ensureOk(response);
    final body = jsonDecode(response.body) as Map<String, dynamic>;
    return body.map((k, v) => MapEntry(k, v == true));
  }

  static void _ensureOk(http.Response response) {
    final code = response.statusCode;
    if (code >= 200 && code < 300) return;
    throw _AlertsApiException(code, response.body);
  }
}

class _AlertsApiException implements Exception {
  final int statusCode;
  final String body;
  _AlertsApiException(this.statusCode, this.body);
  @override
  String toString() => 'AlertsApi $statusCode: $body';
}
