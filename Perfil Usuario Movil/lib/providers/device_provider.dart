import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'dart:io';

import '../models/device_model.dart';
import '../services/api_service.dart';
import '../services/notification_service.dart';
import '../services/mock_data_service.dart';

class DeviceProvider with ChangeNotifier {
  DeviceModel? _device;
  DeviceStats? _stats;
  bool _isLoading = false;
  String? _error;
  bool _isRegistered = false;

  // Getters
  DeviceModel? get device => _device;
  DeviceStats? get stats => _stats;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isRegistered => _isRegistered;

  // Inicializar el provider
  Future<void> initialize() async {
    _setLoading(true);
    
    try {
      // Verificar si ya hay un dispositivo registrado
      final prefs = await SharedPreferences.getInstance();
      final deviceId = prefs.getString('device_id');
      
      if (deviceId != null) {
        // Cargar información del dispositivo existente
        await _loadDeviceInfo(deviceId);
        _isRegistered = true;
      } else {
        _isRegistered = false;
      }
    } catch (e) {
      _setError('Error inicializando dispositivo: $e');
    } finally {
      _setLoading(false);
    }
  }

  // Registrar nuevo dispositivo
  Future<bool> registerDevice({
    String? deviceName,
    bool enabledAlerts = true,
    bool priceAlerts = true,
    bool marketNews = true,
    bool systemAnnouncements = true,
    int maxAlertsPerHour = 5,
  }) async {
    _setLoading(true);
    _clearError();

    try {
      // Obtener información del dispositivo
      final deviceInfo = await _getDeviceInfo();
      final fcmToken = await NotificationService.getFCMToken(); // Será null sin Firebase
      
      final deviceData = {
        'device_name': deviceName ?? deviceInfo['name'],
        'platform': deviceInfo['platform'],
        'fcm_token': fcmToken ?? '', // String vacío si no hay token
        'enabled_alerts': enabledAlerts,
        'price_alerts': priceAlerts,
        'market_news': marketNews,
        'system_announcements': systemAnnouncements,
        'max_alerts_per_hour': maxAlertsPerHour,
      };

      // Registrar en el servidor
      _device = await ApiService.registerDevice(deviceData);
      
      // Guardar device_id localmente
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('device_id', _device!.deviceId);
      
      // Guardar configuración de notificaciones
      await NotificationService.saveNotificationSettings(
        enabled: enabledAlerts,
        priceAlerts: priceAlerts,
        marketNews: marketNews,
        systemAnnouncements: systemAnnouncements,
      );
      
      _isRegistered = true;
      return true;
      
    } catch (e) {
      _setError('Error registrando dispositivo: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Cargar información del dispositivo
  Future<void> _loadDeviceInfo(String deviceId) async {
    try {
      _device = await ApiService.getDeviceInfo(deviceId);
      await loadStats();
    } catch (e) {
      _setError('Error cargando información del dispositivo: $e');
    }
  }

  // Actualizar preferencias del dispositivo
  Future<bool> updatePreferences({
    String? deviceName,
    bool? enabledAlerts,
    bool? priceAlerts,
    bool? marketNews,
    bool? systemAnnouncements,
    int? maxAlertsPerHour,
  }) async {
    if (_device == null) return false;

    _setLoading(true);
    _clearError();

    try {
      final updates = <String, dynamic>{};
      
      if (deviceName != null) updates['device_name'] = deviceName;
      if (enabledAlerts != null) updates['enabled_alerts'] = enabledAlerts;
      if (priceAlerts != null) updates['price_alerts'] = priceAlerts;
      if (marketNews != null) updates['market_news'] = marketNews;
      if (systemAnnouncements != null) updates['system_announcements'] = systemAnnouncements;
      if (maxAlertsPerHour != null) updates['max_alerts_per_hour'] = maxAlertsPerHour;

      _device = await ApiService.updateDevicePreferences(_device!.deviceId, updates);
      
      // Actualizar configuración local de notificaciones
      await NotificationService.saveNotificationSettings(
        enabled: _device!.enabledAlerts,
        priceAlerts: _device!.priceAlerts,
        marketNews: _device!.marketNews,
        systemAnnouncements: _device!.systemAnnouncements,
      );
      
      return true;
      
    } catch (e) {
      _setError('Error actualizando preferencias: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Cargar estadísticas del dispositivo
  Future<void> loadStats() async {
    if (_device == null) return;

    try {
      _stats = await ApiService.getDeviceStats(_device!.deviceId);
      notifyListeners();
    } catch (e) {
      print('Error cargando estadísticas: $e');
    }
  }

  // Obtener información del dispositivo físico
  Future<Map<String, String>> _getDeviceInfo() async {
    final deviceInfo = DeviceInfoPlugin();
    
    try {
      if (Platform.isAndroid) {
        final androidInfo = await deviceInfo.androidInfo;
        return {
          'name': '${androidInfo.brand} ${androidInfo.model}',
          'platform': 'android',
        };
      } else if (Platform.isIOS) {
        final iosInfo = await deviceInfo.iosInfo;
        return {
          'name': '${iosInfo.name} (${iosInfo.model})',
          'platform': 'ios',
        };
      } else {
        return {
          'name': 'Dispositivo Móvil',
          'platform': 'unknown',
        };
      }
    } catch (e) {
      print('Error getting device info: $e');
      return {
        'name': 'Dispositivo Móvil',
        'platform': 'android', // Default
      };
    }
  }

  // Limpiar datos del dispositivo (logout)
  Future<void> clearDevice() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('device_id');
    
    _device = null;
    _stats = null;
    _isRegistered = false;
    _clearError();
    
    notifyListeners();
  }

  // Cargar datos mock para demo
  void loadMockData() {
    _device = MockDataService.getMockDevice();
    _stats = MockDataService.getMockStats();
    _isRegistered = true;
    _clearError();
    notifyListeners();
  }
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