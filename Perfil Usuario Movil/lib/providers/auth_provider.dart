/// Estado global de autenticación.
///
/// Cubre dos modos:
/// - **guest**: el usuario no inició sesión. La app sigue usando `/api/mobile/*`
///   con el `device_id` que maneja `DeviceProvider`. Es el comportamiento
///   default — el usuario puede usar la app sin crear cuenta.
/// - **authenticated**: hay una `AuthSession` activa. La app empieza a hablar
///   con `/api/alerts/*` usando el Bearer token (ver [[api-service-bearer]]).

import 'package:flutter/foundation.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../models/auth_models.dart';
import '../services/auth_api.dart';
import '../services/auth_storage.dart';
import '../utils/constants.dart';

enum AuthStatus { initializing, guest, authenticated }

class AuthProvider with ChangeNotifier {
  final AuthStorage _storage = AuthStorage();

  // El `serverClientId` debe ser el client_id Web del proyecto en Google
  // Cloud — es lo que firma el `serverAuthCode` que el backend valida.
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    serverClientId: AppConstants.googleServerClientId.isEmpty
        ? null
        : AppConstants.googleServerClientId,
    scopes: const ['email', 'profile', 'openid'],
  );

  AuthSession? _session;
  AuthStatus _status = AuthStatus.initializing;
  bool _isBusy = false;
  String? _error;

  AuthSession? get session => _session;
  UserAccount? get user => _session?.user;
  String? get accessToken => _session?.accessToken;
  AuthStatus get status => _status;
  bool get isAuthenticated => _status == AuthStatus.authenticated;
  bool get isBusy => _isBusy;
  String? get error => _error;

  /// Lee la sesión persistida y deja el provider en `guest` o `authenticated`.
  /// Llamar una vez desde el splash antes de decidir la ruta inicial.
  Future<void> initialize() async {
    final saved = await _storage.read();
    if (saved != null && !saved.isExpired) {
      _session = saved;
      _status = AuthStatus.authenticated;
    } else {
      if (saved != null) {
        // Token vencido: lo borramos para no arrastrarlo.
        await _storage.clear();
      }
      _status = AuthStatus.guest;
    }
    notifyListeners();
  }

  Future<bool> loginWithPassword({
    required String usernameOrEmail,
    required String password,
  }) async {
    return _runAuth(() async {
      final session = await AuthApi.loginWithPassword(
        usernameOrEmail: usernameOrEmail,
        password: password,
      );
      await _storeSession(session);
    });
  }

  /// Lanza el flujo nativo de Google Sign-In y, si el usuario lo completa,
  /// intercambia el `serverAuthCode` con el backend.
  ///
  /// Requiere setup de plataforma:
  /// - Android: SHA-1 del keystore + OAuth client Android en Google Cloud.
  /// - iOS: GIDClientID en Info.plist y URL scheme reverse-client-id.
  /// - Common: client_id Web (`serverClientId`) configurado vía `--dart-define`.
  Future<bool> loginWithGoogle() async {
    return _runAuth(() async {
      if (AppConstants.googleServerClientId.isEmpty) {
        throw AuthException(
          'Google Sign-In no configurado: falta GOOGLE_SERVER_CLIENT_ID.',
        );
      }
      // Forzar el chooser: sin esto, el plugin reusa la última cuenta del
      // device silenciosamente y nunca muestra el picker.
      try {
        await _googleSignIn.signOut();
      } catch (_) {
        // No hay sesión previa que cerrar, OK.
      }
      final account = await _googleSignIn.signIn();
      if (account == null) {
        throw AuthException('Cancelado');
      }
      // serverAuthCode aparece sólo cuando hay serverClientId seteado y es
      // de un solo uso — lo enviamos al backend para que lo canjee con Google.
      final serverAuthCode = account.serverAuthCode;
      if (serverAuthCode == null || serverAuthCode.isEmpty) {
        throw AuthException(
          'Google no devolvió serverAuthCode. Verificá que el client_id Web '
          'esté configurado en GoogleSignIn(serverClientId: ...).',
        );
      }
      final session = await AuthApi.loginWithGoogle(
        serverAuthCode: serverAuthCode,
      );
      await _storeSession(session);
    });
  }

  Future<void> logout() async {
    final token = _session?.accessToken;
    if (token != null) {
      await AuthApi.logout(accessToken: token);
    }
    try {
      await _googleSignIn.signOut();
    } catch (_) {
      // best-effort; el usuario podría no haberse autenticado con Google.
    }
    await _storage.clear();
    _session = null;
    _status = AuthStatus.guest;
    _error = null;
    notifyListeners();
  }

  Future<void> _storeSession(AuthSession session) async {
    _session = session;
    _status = AuthStatus.authenticated;
    await _storage.save(session);
  }

  Future<bool> _runAuth(Future<void> Function() body) async {
    _isBusy = true;
    _error = null;
    notifyListeners();
    try {
      await body();
      return true;
    } on AuthException catch (e) {
      _error = e.message;
      return false;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isBusy = false;
      notifyListeners();
    }
  }

  void clearError() {
    if (_error == null) return;
    _error = null;
    notifyListeners();
  }
}
