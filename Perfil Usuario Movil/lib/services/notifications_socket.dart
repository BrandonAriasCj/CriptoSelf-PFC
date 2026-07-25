// Cliente WebSocket de notificaciones en tiempo real (modo autenticado).
//
// Es el espejo móvil de `NotificationsContext` del frontend web: se conecta a
//   wss://<host>/ws/alerts/notifications/?token=<access_token>
// y reenvía cada mensaje `type:'notification'` al callback. El dispatcher del
// backend hace `group_send` al grupo del usuario, así que la MISMA cuenta
// recibe la notificación tanto en web como en móvil mientras esté conectada.
//
// Maneja reconexión con backoff exponencial y ping cada 25s para mantener viva
// la conexión (igual que la web). Código de cierre 4401 = token rechazado: no
// reintenta.

import 'dart:async';
import 'dart:convert';

import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:web_socket_channel/status.dart' as ws_status;

import '../utils/constants.dart';

typedef NotificationHandler = void Function(Map<String, dynamic> data);

class NotificationsSocket {
  final NotificationHandler onNotification;
  final void Function(bool connected)? onConnectionChange;

  WebSocketChannel? _channel;
  StreamSubscription<dynamic>? _sub;
  Timer? _pingTimer;
  Timer? _reconnectTimer;
  int _attempts = 0;
  bool _intentionalClose = false;
  String? _token;

  NotificationsSocket({required this.onNotification, this.onConnectionChange});

  static String _wsUrl(String token) {
    const host = AppConstants.host; // https://api.criptoself.com (o http://... en dev)
    final wsBase = host.startsWith('https')
        ? host.replaceFirst('https', 'wss')
        : host.replaceFirst('http', 'ws');
    return '$wsBase/ws/alerts/notifications/?token=${Uri.encodeComponent(token)}';
  }

  void connect(String token) {
    _token = token;
    _intentionalClose = false;
    _attempts = 0;
    _open();
  }

  void _open() {
    final token = _token;
    if (token == null || _intentionalClose) return;
    try {
      final channel = WebSocketChannel.connect(Uri.parse(_wsUrl(token)));
      _channel = channel;
      _sub = channel.stream.listen(
        _onData,
        onError: (_) => _scheduleReconnect(),
        onDone: _onDone,
        cancelOnError: true,
      );
      _startPing();
    } catch (_) {
      _scheduleReconnect();
    }
  }

  void _onData(dynamic raw) {
    onConnectionChange?.call(true);
    _attempts = 0;
    if (raw is! String) return;
    Map<String, dynamic> msg;
    try {
      msg = jsonDecode(raw) as Map<String, dynamic>;
    } catch (_) {
      return;
    }
    if (msg['type'] == 'notification') {
      final data = msg['data'];
      if (data is Map<String, dynamic>) onNotification(data);
    }
    // 'connected' y 'pong' se ignoran.
  }

  void _startPing() {
    _pingTimer?.cancel();
    _pingTimer = Timer.periodic(const Duration(seconds: 25), (_) {
      try {
        _channel?.sink.add(jsonEncode({'type': 'ping'}));
      } catch (_) {
        // si falla el envío, onDone/onError dispararán la reconexión.
      }
    });
  }

  void _onDone() {
    onConnectionChange?.call(false);
    _pingTimer?.cancel();
    if (_intentionalClose) return;
    if (_channel?.closeCode == 4401) return; // token rechazado: no reintentar
    _scheduleReconnect();
  }

  void _scheduleReconnect() {
    _pingTimer?.cancel();
    if (_intentionalClose) return;
    _attempts += 1;
    final backoff = 1000 * (1 << (_attempts - 1).clamp(0, 5));
    final delayMs = backoff.clamp(1000, 30000);
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(Duration(milliseconds: delayMs), _open);
  }

  void disconnect() {
    _intentionalClose = true;
    _pingTimer?.cancel();
    _reconnectTimer?.cancel();
    _sub?.cancel();
    try {
      _channel?.sink.close(ws_status.normalClosure);
    } catch (_) {
      // ignorado
    }
    _channel = null;
    _token = null;
  }
}
