import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/device_model.dart';
import '../models/alert_model.dart';
import '../models/notification_model.dart';
import '../utils/constants.dart';

class ApiService {
  static const String baseUrl = AppConstants.baseUrl;
  
  static const Map<String, String> headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Health Check
  static Future<Map<String, dynamic>> healthCheck() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/health/'),
        headers: headers,
      );
      
      if (response.statusCode == 200) {
        return json.decode(response.body);
      } else {
        throw Exception('Health check failed: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  // Device Management
  static Future<DeviceModel> registerDevice(Map<String, dynamic> deviceData) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/devices/'),
        headers: headers,
        body: json.encode(deviceData),
      );
      
      if (response.statusCode == 201) {
        return DeviceModel.fromJson(json.decode(response.body));
      } else {
        final error = json.decode(response.body);
        throw Exception('Registration failed: ${error['detail'] ?? 'Unknown error'}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  static Future<DeviceModel> getDeviceInfo(String deviceId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/devices/$deviceId/'),
        headers: headers,
      );
      
      if (response.statusCode == 200) {
        return DeviceModel.fromJson(json.decode(response.body));
      } else if (response.statusCode == 404) {
        throw Exception('Device not found');
      } else {
        throw Exception('Failed to get device info: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  static Future<DeviceModel> updateDevicePreferences(
    String deviceId, 
    Map<String, dynamic> preferences
  ) async {
    try {
      final response = await http.patch(
        Uri.parse('$baseUrl/devices/$deviceId/'),
        headers: headers,
        body: json.encode(preferences),
      );
      
      if (response.statusCode == 200) {
        return DeviceModel.fromJson(json.decode(response.body));
      } else {
        final error = json.decode(response.body);
        throw Exception('Update failed: ${error['detail'] ?? 'Unknown error'}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  static Future<DeviceStats> getDeviceStats(String deviceId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/devices/$deviceId/stats/'),
        headers: headers,
      );
      
      if (response.statusCode == 200) {
        return DeviceStats.fromJson(json.decode(response.body));
      } else {
        throw Exception('Failed to get stats: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  // Alerts Management
  static Future<List<AlertRule>> getAvailableAlerts() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/alerts/'),
        headers: headers,
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> results = data['results'] ?? [];
        return results.map((json) => AlertRule.fromJson(json)).toList();
      } else {
        throw Exception('Failed to get alerts: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  // Subscriptions Management
  static Future<List<AlertSubscription>> getSubscriptions(String deviceId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/devices/$deviceId/subscriptions/'),
        headers: headers,
      );
      
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => AlertSubscription.fromJson(json)).toList();
      } else {
        throw Exception('Failed to get subscriptions: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  static Future<AlertSubscription> subscribeToAlert(
    String deviceId, 
    int alertRuleId
  ) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/devices/$deviceId/subscriptions/'),
        headers: headers,
        body: json.encode({
          'alert_rule_id': alertRuleId,
          'is_active': true,
        }),
      );
      
      if (response.statusCode == 201) {
        return AlertSubscription.fromJson(json.decode(response.body));
      } else {
        final error = json.decode(response.body);
        throw Exception('Subscription failed: ${error['detail'] ?? 'Unknown error'}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  static Future<void> unsubscribeFromAlert(
    String deviceId, 
    int subscriptionId
  ) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/devices/$deviceId/subscriptions/$subscriptionId/'),
        headers: headers,
      );
      
      if (response.statusCode != 204) {
        throw Exception('Unsubscribe failed: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  static Future<AlertSubscription> updateSubscription(
    String deviceId,
    int subscriptionId,
    Map<String, dynamic> updates
  ) async {
    try {
      final response = await http.patch(
        Uri.parse('$baseUrl/devices/$deviceId/subscriptions/$subscriptionId/'),
        headers: headers,
        body: json.encode(updates),
      );
      
      if (response.statusCode == 200) {
        return AlertSubscription.fromJson(json.decode(response.body));
      } else {
        final error = json.decode(response.body);
        throw Exception('Update failed: ${error['detail'] ?? 'Unknown error'}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  // Notifications Management
  static Future<List<NotificationModel>> getNotifications(
    String deviceId, {
    int hours = 24,
    bool unreadOnly = false,
    int limit = 50,
  }) async {
    try {
      final queryParams = {
        'hours': hours.toString(),
        'limit': limit.toString(),
        if (unreadOnly) 'unread': 'true',
      };
      
      final uri = Uri.parse('$baseUrl/devices/$deviceId/notifications/')
          .replace(queryParameters: queryParams);
      
      final response = await http.get(uri, headers: headers);
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> results = data['results'] ?? [];
        return results.map((json) => NotificationModel.fromJson(json)).toList();
      } else {
        throw Exception('Failed to get notifications: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  static Future<void> markNotificationAsRead(
    String deviceId,
    int notificationId, {
    String action = 'read',
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/devices/$deviceId/notifications/$notificationId/action/'),
        headers: headers,
        body: json.encode({'action': action}),
      );
      
      if (response.statusCode != 200) {
        throw Exception('Mark as read failed: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }
}