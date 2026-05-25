import 'package:flutter/foundation.dart';
import '../models/notification_model.dart';
import '../services/api_service.dart';
import '../services/mock_data_service.dart';

class NotificationsProvider with ChangeNotifier {
  List<NotificationModel> _notifications = [];
  bool _isLoading = false;
  String? _error;
  int _unreadCount = 0;

  // Getters
  List<NotificationModel> get notifications => _notifications;
  List<NotificationModel> get unreadNotifications => 
      _notifications.where((n) => !n.isRead).toList();
  bool get isLoading => _isLoading;
  String? get error => _error;
  int get unreadCount => _unreadCount;

  // Cargar notificaciones
  Future<void> loadNotifications(
    String deviceId, {
    int hours = 24,
    bool unreadOnly = false,
    int limit = 50,
  }) async {
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

  // Marcar notificación como leída
  Future<bool> markAsRead(String deviceId, int notificationId) async {
    _clearError();

    try {
      await ApiService.markNotificationAsRead(deviceId, notificationId);
      
      // Actualizar localmente
      final index = _notifications.indexWhere((n) => n.id == notificationId);
      if (index != -1) {
        _notifications[index] = NotificationModel(
          id: _notifications[index].id,
          title: _notifications[index].title,
          body: _notifications[index].body,
          severity: _notifications[index].severity,
          payload: _notifications[index].payload,
          ruleName: _notifications[index].ruleName,
          isRead: true,
          createdAt: _notifications[index].createdAt,
        );
        
        _updateUnreadCount();
        notifyListeners();
      }
      
      return true;
    } catch (e) {
      _setError('Error marcando como leída: $e');
      return false;
    }
  }

  // Marcar notificación como clickeada
  Future<bool> markAsClicked(String deviceId, int notificationId) async {
    _clearError();

    try {
      await ApiService.markNotificationAsRead(deviceId, notificationId, action: 'click');
      
      // Actualizar localmente
      final index = _notifications.indexWhere((n) => n.id == notificationId);
      if (index != -1) {
        _notifications[index] = NotificationModel(
          id: _notifications[index].id,
          title: _notifications[index].title,
          body: _notifications[index].body,
          severity: _notifications[index].severity,
          payload: _notifications[index].payload,
          ruleName: _notifications[index].ruleName,
          isRead: true,
          createdAt: _notifications[index].createdAt,
        );
        
        _updateUnreadCount();
        notifyListeners();
      }
      
      return true;
    } catch (e) {
      _setError('Error marcando como clickeada: $e');
      return false;
    }
  }

  // Marcar todas como leídas
  Future<void> markAllAsRead(String deviceId) async {
    final unreadNotifications = _notifications.where((n) => !n.isRead).toList();
    
    for (final notification in unreadNotifications) {
      await markAsRead(deviceId, notification.id);
    }
  }

  // Obtener notificaciones por severidad
  List<NotificationModel> getNotificationsBySeverity(String severity) {
    return _notifications.where((n) => n.severity.toLowerCase() == severity.toLowerCase()).toList();
  }

  // Obtener notificaciones críticas
  List<NotificationModel> get criticalNotifications => 
      getNotificationsBySeverity('critical');

  // Obtener notificaciones de alta prioridad
  List<NotificationModel> get highPriorityNotifications => 
      getNotificationsBySeverity('high');

  // Obtener notificaciones recientes (últimas 24 horas)
  List<NotificationModel> get recentNotifications {
    final now = DateTime.now();
    final yesterday = now.subtract(const Duration(days: 1));
    
    return _notifications.where((n) => n.createdAt.isAfter(yesterday)).toList();
  }

  // Obtener notificaciones por regla
  List<NotificationModel> getNotificationsByRule(String ruleName) {
    return _notifications.where((n) => n.ruleName == ruleName).toList();
  }

  // Refrescar notificaciones (pull to refresh)
  Future<void> refreshNotifications(String deviceId) async {
    await loadNotifications(deviceId, hours: 168); // Última semana
  }

  // Cargar más notificaciones (paginación)
  Future<void> loadMoreNotifications(
    String deviceId, {
    int hours = 168, // Una semana por defecto
  }) async {
    if (_isLoading) return;

    try {
      final moreNotifications = await ApiService.getNotifications(
        deviceId,
        hours: hours,
        limit: 50,
      );
      
      // Evitar duplicados
      for (final notification in moreNotifications) {
        if (!_notifications.any((n) => n.id == notification.id)) {
          _notifications.add(notification);
        }
      }
      
      // Ordenar por fecha (más recientes primero)
      _notifications.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      
      _updateUnreadCount();
      notifyListeners();
      
    } catch (e) {
      _setError('Error cargando más notificaciones: $e');
    }
  }

  // Actualizar contador de no leídas
  void _updateUnreadCount() {
    _unreadCount = _notifications.where((n) => !n.isRead).length;
  }

  // Agregar nueva notificación (para push notifications en tiempo real)
  void addNotification(NotificationModel notification) {
    // Evitar duplicados
    if (!_notifications.any((n) => n.id == notification.id)) {
      _notifications.insert(0, notification);
      _updateUnreadCount();
      notifyListeners();
    }
  }

  // Cargar datos mock para demo
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

  // Métodos auxiliares
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