import 'package:flutter/foundation.dart';
import '../models/alert_model.dart';
import '../services/api_service.dart';
import '../services/mock_data_service.dart';

class AlertsProvider with ChangeNotifier {
  List<AlertRule> _availableAlerts = [];
  List<AlertSubscription> _subscriptions = [];
  bool _isLoading = false;
  String? _error;

  // Getters
  List<AlertRule> get availableAlerts => _availableAlerts;
  List<AlertSubscription> get subscriptions => _subscriptions;
  bool get isLoading => _isLoading;
  String? get error => _error;

  // Obtener alertas disponibles del sistema
  Future<void> loadAvailableAlerts() async {
    _setLoading(true);
    _clearError();

    try {
      _availableAlerts = await ApiService.getAvailableAlerts();
    } catch (e) {
      _setError('Error cargando alertas disponibles: $e');
    } finally {
      _setLoading(false);
    }
  }

  // Cargar suscripciones del dispositivo
  Future<void> loadSubscriptions(String deviceId) async {
    _setLoading(true);
    _clearError();

    try {
      _subscriptions = await ApiService.getSubscriptions(deviceId);
    } catch (e) {
      _setError('Error cargando suscripciones: $e');
    } finally {
      _setLoading(false);
    }
  }

  // Suscribirse a una alerta
  Future<bool> subscribeToAlert(String deviceId, int alertRuleId) async {
    _clearError();

    try {
      final subscription = await ApiService.subscribeToAlert(deviceId, alertRuleId);
      _subscriptions.add(subscription);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('Error suscribiéndose a la alerta: $e');
      return false;
    }
  }

  // Cancelar suscripción a una alerta
  Future<bool> unsubscribeFromAlert(String deviceId, int subscriptionId) async {
    _clearError();

    try {
      await ApiService.unsubscribeFromAlert(deviceId, subscriptionId);
      _subscriptions.removeWhere((sub) => sub.id == subscriptionId);
      notifyListeners();
      return true;
    } catch (e) {
      _setError('Error cancelando suscripción: $e');
      return false;
    }
  }

  // Activar/desactivar suscripción
  Future<bool> toggleSubscription(String deviceId, int subscriptionId, bool isActive) async {
    _clearError();

    try {
      final updatedSubscription = await ApiService.updateSubscription(
        deviceId,
        subscriptionId,
        {'is_active': isActive},
      );
      
      final index = _subscriptions.indexWhere((sub) => sub.id == subscriptionId);
      if (index != -1) {
        _subscriptions[index] = updatedSubscription;
        notifyListeners();
      }
      
      return true;
    } catch (e) {
      _setError('Error actualizando suscripción: $e');
      return false;
    }
  }

  // Verificar si está suscrito a una alerta específica
  bool isSubscribedTo(int alertRuleId) {
    return _subscriptions.any((sub) => 
      sub.alertRule.id == alertRuleId && sub.isActive
    );
  }

  // Obtener suscripción por alert rule id
  AlertSubscription? getSubscriptionByAlertId(int alertRuleId) {
    try {
      return _subscriptions.firstWhere((sub) => sub.alertRule.id == alertRuleId);
    } catch (e) {
      return null;
    }
  }

  // Obtener alertas por categoría
  List<AlertRule> getAlertsByType(String eventType) {
    return _availableAlerts.where((alert) => alert.eventType == eventType).toList();
  }

  // Obtener alertas de precio
  List<AlertRule> get priceAlerts {
    return _availableAlerts.where((alert) => 
      alert.eventType == 'PRICE_CHANGE_PERCENT' || 
      alert.eventType == 'PRICE_THRESHOLD'
    ).toList();
  }

  // Obtener alertas de noticias
  List<AlertRule> get newsAlerts {
    return _availableAlerts.where((alert) => 
      alert.eventType == 'MARKET_NEWS'
    ).toList();
  }

  // Obtener anuncios del sistema
  List<AlertRule> get systemAlerts {
    return _availableAlerts.where((alert) => 
      alert.eventType == 'SYSTEM_ANNOUNCEMENT'
    ).toList();
  }

  // Estadísticas de suscripciones
  int get totalSubscriptions => _subscriptions.length;
  int get activeSubscriptions => _subscriptions.where((sub) => sub.isActive).length;
  int get inactiveSubscriptions => _subscriptions.where((sub) => !sub.isActive).length;

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

  // Cargar datos mock para demo
  void loadMockData() {
    _availableAlerts = MockDataService.getMockAlertRules();
    _subscriptions = MockDataService.getMockSubscriptions();
    _clearError();
    notifyListeners();
  }
  void clear() {
    _availableAlerts.clear();
    _subscriptions.clear();
    _clearError();
    notifyListeners();
  }
}