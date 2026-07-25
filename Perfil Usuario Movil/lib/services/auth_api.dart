/// Cliente HTTP del namespace `/api/auth/*` del backend.
///
/// Cubre los dos flujos que usa el mobile:
/// - Email + password → `POST /api/auth/token/` (OAuth2 password grant).
/// - Google Sign-In  → `POST /api/auth/google/mobile-exchange/` (server auth
///   code emitido por el plugin `google_sign_in` con `serverClientId`).

import 'dart:convert';

import 'package:http/http.dart' as http;

import '../models/auth_models.dart';
import '../utils/constants.dart';

class AuthApi {
  static const Map<String, String> _jsonHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  /// Login con email y password. El backend acepta `username` indistinto al
  /// email o al username real — pasamos lo que el usuario tipeó tal cual.
  static Future<AuthSession> loginWithPassword({
    required String usernameOrEmail,
    required String password,
  }) async {
    if (AppConstants.oauthClientId.isEmpty ||
        AppConstants.oauthClientSecret.isEmpty) {
      throw AuthException(
        'Credenciales OAuth no configuradas en la app. Ejecutá flutter run con '
        '--dart-define=MOBILE_OAUTH_CLIENT_ID=... '
        '--dart-define=MOBILE_OAUTH_CLIENT_SECRET=...',
      );
    }

    final response = await http.post(
      Uri.parse('${AppConstants.authBaseUrl}/token/'),
      headers: _jsonHeaders,
      body: jsonEncode({
        'username': usernameOrEmail,
        'password': password,
        'client_id': AppConstants.oauthClientId,
        'client_secret': AppConstants.oauthClientSecret,
      }),
    );

    return _parseAuthResponse(response);
  }

  /// Intercambia el `serverAuthCode` que devuelve el plugin `google_sign_in`
  /// por una sesión propia. El backend valida el code contra Google usando su
  /// `GOOGLE_CLIENT_SECRET` y crea (o usa) la cuenta CriptoSelf.
  static Future<AuthSession> loginWithGoogle({
    required String serverAuthCode,
  }) async {
    final response = await http.post(
      Uri.parse('${AppConstants.authBaseUrl}/google/mobile-exchange/'),
      headers: _jsonHeaders,
      body: jsonEncode({'server_auth_code': serverAuthCode}),
    );
    return _parseAuthResponse(response);
  }

  /// Logout del lado del servidor (revoca el access token). Es best-effort —
  /// si el endpoint falla igual borramos la sesión local.
  static Future<void> logout({required String accessToken}) async {
    try {
      await http.post(
        Uri.parse('${AppConstants.authBaseUrl}/logout/'),
        headers: {
          ..._jsonHeaders,
          'Authorization': 'Bearer $accessToken',
        },
      );
    } catch (_) {
      // best-effort
    }
  }

  static AuthSession _parseAuthResponse(http.Response response) {
    if (response.statusCode == 200) {
      try {
        final json = jsonDecode(response.body) as Map<String, dynamic>;
        return AuthSession.fromTokenResponse(json);
      } catch (e) {
        throw AuthException('Respuesta inválida del servidor: $e',
            statusCode: response.statusCode);
      }
    }

    String message;
    try {
      final json = jsonDecode(response.body) as Map<String, dynamic>;
      message = (json['error'] ?? json['detail'] ?? response.body).toString();
    } catch (_) {
      message = response.body.isNotEmpty
          ? response.body
          : 'Error ${response.statusCode}';
    }

    if (response.statusCode == 401 || response.statusCode == 403) {
      throw AuthException('Credenciales inválidas',
          statusCode: response.statusCode);
    }
    if (response.statusCode == 404) {
      throw AuthException(
        'Esta cuenta no está registrada en CriptoSelf.',
        statusCode: 404,
      );
    }
    throw AuthException(message, statusCode: response.statusCode);
  }
}
