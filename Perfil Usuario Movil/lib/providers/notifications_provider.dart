import 'package:flutter/foundation.dart';
import '../models/notification_model.dart';
import '../services/api_service.dart';
import '../services/alerts_api.dart';
import '../services/notifications_socket.dart';
import '../services/notification_service.dart';
import '../services/mock_data_service.dart';

/// Provider de notificaciones con dos modos:
///
/// - **autenticado** (hay token OAuth): consume `/api/alerts/*` y abre el
///   WebSocket en tiempo real — recibe lo MISMO que la web para esa cuenta.
///   Se activa vía [syncAuth], llamado por el ProxyProvider en main.dart cuando
///   cambia el estado de [AuthProvider].
/// - **guest** (sin token): mantiene el flujo viejo por `device_id`
///   (`/api/mobile/*`). Los métodos device-based quedan inertes en modo
///   autenticado para no pisar los datos de la cuenta.
class NotificationsProvider with ChangeNotifier {
  List<NotificationModel> _notifications = [];
  bool _isLoading = false;
  String? _error;
  int _unreadCount = 0;

  // --- modo autenticado ---
  String? _accessToken;
  NotificationsSocket? _socket;
  bool _socketConnected = false;
  int _page = 1;

  // Getters
  List<NotificationModel> get notifications => _notifications;
  List<NotificationModel> get unreadNotifications =>
      _notifications.where((n) => !n.isRead).toList();
  bool get isLoading => _isLoading;
  String? get error => _error;
  int get unreadCount => _unreadCount;
  bool get isAuthenticatedMode => _accessToken != null;
  bool get isRealtimeConnected => _socketConnected;

  AlertsApi? get _api =>
      _accessToken == null ? null : AlertsApi(accessToken: _accessToken!);

  // ---------------------------------------------------------------------------
  // Sincronización con el estado de autenticación (ProxyProvider en main.dart)
  // ---------------------------------------------------------------------------

  /// Reacciona a cambios de sesión: token nuevo → carga + conecta WS;
  /// token null (logout) → corta el WS y limpia. Idempotente.
  void syncAuth(String? token) {
    if (token == _accessToken) return;
    if (token == null) {
      _teardownAuth();
      return;
    }
    _accessToken = token;
    // Diferido: evita notifyListeners() durante el build del ProxyProvider.
    Future.microtask(_startAuthenticated);
  }

  Future<void> _startAuthenticated() async {
    final api = _api;
    if (api == null) return;
    _setLoading(true);
    _clearError();
    try {
      _page = 1;
      _notifications = await api.listNotifications(page: 1);
      _unreadCount = await api.unreadCount();
    } catch (e) {
      _setError('Error cargando notificaciones: $e');
    } finally {
      _setLoading(false);
    }
    _connectSocket();
  }

  void _connectSocket() {
    final token = _accessToken;
    if (token == null) return;
    _socket?.disconnect();
    _socket = NotificationsSocket(
      onNotification: _onRealtimeNotification,
      onConnectionChange: (connected) {
        _socketConnected = connected;
        notifyListeners();
      },
    );
    _socket!.connect(token);
  }

  /// Mensaje entrante por WebSocket: lo insertamos arriba y disparamos una
  /// notificación local del sistema (la app no usa Firebase).
  void _onRealtimeNotification(Map<String, dynamic> data) {
    NotificationModel n;
    try {
      n = NotificationModel.fromJson(data);
    } catch (_) {
      return;
    }
    if (_notifications.any((x) => x.id == n.id)) return;
    _notifications.insert(0, n);
    _updateUnreadCount();
    notifyListeners();
    NotificationService.showLocalNotification(title: n.title, body: n.body);
  }

  void _teardownAuth() {
    _socket?.disconnect();
    _socket = null;
    _socketConnected = false;
    _accessToken = null;
    _notifications = [];
    _unreadCount = 0;
    notifyListeners();
  }

  // ---------------------------------------------------------------------------
  // Carga / refresh / paginación
  // ---------------------------------------------------------------------------

  Future<void> loadNotifications(
    String deviceId, {
    int hours = 24,
    bool unreadOnly = false,
    int limit = 50,
  }) async {
    if (isAuthenticatedMode) return; // el modo autenticado se carga solo
    _setLoading(true);
    _clearError();
    try {
      _notifications = await ApiService.getNotifications(
        deviceId,
        hours: hours,
        unreadOnly: unreadOnly,
        limit: limit,
      );
      _updateUnreadCount();
    } catch (e) {
      _setError('Error cargando notificaciones: $e');
    } finally {
      _setLoading(false);
    }
  }

  Future<void> refreshNotifications(String deviceId) async {
    if (isAuthenticatedMode) {
      final api = _api!;
      _clearError();
      try {
        _page = 1;
        _notifications = await api.listNotifications(page: 1);
        _unreadCount = await api.unreadCount();
        notifyListeners();
      } catch (e) {
        _setError('Error refrescando notificaciones: $e');
      }
      return;
    }
    await loadNotifications(deviceId, hours: 168);
  }

  Future<void> loadMoreNotifications(
    String deviceId, {
    int hours = 168,
  }) async {
    if (_isLoading) return;

    if (isAuthenticatedMode) {
      final api = _api!;
      try {
        final next = await api.listNotifications(page: _page + 1);
        if (next.isEmpty) return;
        _page += 1;
        for (final n in next) {
          if (!_notifications.any((x) => x.id == n.id)) _notifications.add(n);
        }
        _notifications.sort((a, b) => b.createdAt.compareTo(a.createdAt));
        _updateUnreadCount();
        notifyListeners();
      } catch (e) {
        // Sin más páginas (404) o error de red: no es fatal para el scroll.
        _setError('No hay más notificaciones: $e');
      }
      return;
    }

    try {
      final moreNotifications = await ApiService.getNotifications(
        deviceId,
        hours: hours,
        limit: 50,
      );
      for (final notification in moreNotifications) {
        if (!_notifications.any((n) => n.id == notification.id)) {
          _notifications.add(notification);
        }
      }
      _notifications.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      _updateUnreadCount();
      notifyListeners();
    } catch (e) {
      _setError('Error cargando más notificaciones: $e');
    }
  }

  // ---------------------------------------------------------------------------
  // Marcar leídas
  // ---------------------------------------------------------------------------

  Future<bool> markAsRead(String deviceId, int notificationId) async {
    _clearError();
    try {
      if (isAuthenticatedMode) {
        await _api!.markRead(notificationId);
      } else {
        await ApiService.markNotificationAsRead(deviceId, notificationId);
      }
      _markLocalRead(notificationId);
      return true;
    } catch (e) {
      _setError('Error marcando como leída: $e');
      return false;
    }
  }

  Future<bool> markAsClicked(String deviceId, int notificationId) async {
    _clearError();
    try {
      if (isAuthenticatedMode) {
        await _api!.markRead(notificationId);
      } else {
        await ApiService.markNotificationAsRead(
          deviceId,
          notificationId,
          action: 'click',
        );
      }
      _markLocalRead(notificationId);
      return true;
    } catch (e) {
      _setError('Error marcando como clickeada: $e');
      return false;
    }
  }

  Future<void> markAllAsRead(String deviceId) async {
    if (isAuthenticatedMode) {
      _clearError();
      try {
        await _api!.markAllRead();
        _notifications = _notifications
            .map((n) => n.isRead ? n : _copyRead(n))
            .toList();
        _updateUnreadCount();
        notifyListeners();
      } catch (e) {
        _setError('Error marcando todas como leídas: $e');
      }
      return;
    }
    final unread = _notifications.where((n) => !n.isRead).toList();
    for (final notification in unread) {
      await markAsRead(deviceId, notification.id);
    }
  }

  void _markLocalRead(int notificationId) {
    final index = _notifications.indexWhere((n) => n.id == notificationId);
    if (index != -1) {
      _notifications[index] = _copyRead(_notifications[index]);
      _updateUnreadCount();
      notifyListeners();
    }
  }

  NotificationModel _copyRead(NotificationModel n) => NotificationModel(
        id: n.id,
        title: n.title,
        body: n.body,
        severity: n.severity,
        payload: n.payload,
        ruleName: n.ruleName,
        isRead: true,
        createdAt: n.createdAt,
      );

  // ---------------------------------------------------------------------------
  // Filtros / derivados
  // ---------------------------------------------------------------------------

  List<NotificationModel> getNotificationsBySeverity(String severity) {
    return _notifications
        .where((n) => n.severity.toLowerCase() == severity.toLowerCase())
        .toList();
  }

  List<NotificationModel> get criticalNotifications =>
      getNotificationsBySeverity('critical');

  List<NotificationModel> get highPriorityNotifications =>
      getNotificationsBySeverity('high');

  List<NotificationModel> get recentNotifications {
    final yesterday = DateTime.now().subtract(const Duration(days: 1));
    return _notifications.where((n) => n.createdAt.isAfter(yesterday)).toList();
  }

  List<NotificationModel> getNotificationsByRule(String ruleName) {
    return _notifications.where((n) => n.ruleName == ruleName).toList();
  }

  void _updateUnreadCount() {
    _unreadCount = _notifications.where((n) => !n.isRead).length;
  }

  /// Agregar una notificación manualmente (p. ej. push en tiempo real externo).
  void addNotification(NotificationModel notification) {
    if (!_notifications.any((n) => n.id == notification.id)) {
      _notifications.insert(0, notification);
      _updateUnreadCount();
      notifyListeners();
    }
  }

  void loadMockData() {
    _notifications = MockDataService.getMockNotifications();
    _updateUnreadCount();
    _clearError();
    notifyListeners();
  }

  void clear() {
    _notifications.clear();
    _unreadCount = 0;
    _clearError();
    notifyListeners();
  }

  @override
  void dispose() {
    _socket?.disconnect();
    super.dispose();
  }

  // Auxiliares de estado
  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String error) {
    _error = error;
    notifyListeners();
  }

  void _clearError() {
    _error = null;
    notifyListeners();
  }
}
