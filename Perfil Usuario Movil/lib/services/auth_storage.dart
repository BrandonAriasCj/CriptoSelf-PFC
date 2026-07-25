/// Persistencia segura de la sesión OAuth en el dispositivo.
///
/// Usa `flutter_secure_storage` (Keychain en iOS, EncryptedSharedPreferences en
/// Android) — preferible a SharedPreferences porque los tokens son credenciales.

import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../models/auth_models.dart';

class AuthStorage {
  static const String _sessionKey = 'auth_session_v1';

  static const _options = AndroidOptions(encryptedSharedPreferences: true);
  static const FlutterSecureStorage _storage = FlutterSecureStorage(
    aOptions: _options,
  );

  /// Guarda la sesión actual. Si ya había una, la sobreescribe.
  Future<void> save(AuthSession session) async {
    await _storage.write(
      key: _sessionKey,
      value: jsonEncode(session.toJson()),
    );
  }

  /// Lee la sesión persistida. Devuelve `null` si no hay sesión guardada o si
  /// el JSON está corrupto — en ese caso se trata como logout.
  Future<AuthSession?> read() async {
    final raw = await _storage.read(key: _sessionKey);
    if (raw == null) return null;
    try {
      final json = jsonDecode(raw) as Map<String, dynamic>;
      return AuthSession.fromJson(json);
    } catch (_) {
      // JSON corrupto: limpiamos y devolvemos null.
      await clear();
      return null;
    }
  }

  Future<void> clear() async {
    await _storage.delete(key: _sessionKey);
  }
}
