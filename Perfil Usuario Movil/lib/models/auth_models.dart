/// Modelos de autenticación: cuenta del usuario y sesión emitida por OAuth2.

class UserAccount {
  final int id;
  final String username;
  final String email;
  final String? firstName;
  final String? lastName;
  final String? avatarUrl;

  const UserAccount({
    required this.id,
    required this.username,
    required this.email,
    this.firstName,
    this.lastName,
    this.avatarUrl,
  });

  factory UserAccount.fromJson(Map<String, dynamic> json) {
    // Backend devuelve '' cuando no hay avatar; lo normalizamos a null para
    // que la UI pueda hacer un check simple y NetworkImage no explote con ''.
    final rawAvatar = json['avatar_url'] as String?;
    return UserAccount(
      id: json['id'] as int,
      username: json['username'] as String? ?? json['email'] as String,
      email: json['email'] as String,
      firstName: json['first_name'] as String?,
      lastName: json['last_name'] as String?,
      avatarUrl: (rawAvatar != null && rawAvatar.isNotEmpty) ? rawAvatar : null,
    );
  }

  String get displayName {
    final fn = (firstName ?? '').trim();
    final ln = (lastName ?? '').trim();
    if (fn.isEmpty && ln.isEmpty) return username;
    return '$fn $ln'.trim();
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'username': username,
        'email': email,
        'first_name': firstName,
        'last_name': lastName,
        'avatar_url': avatarUrl,
      };
}

class AuthSession {
  final String accessToken;
  final String tokenType;
  final DateTime expiresAt;
  final String? scope;
  final UserAccount user;

  const AuthSession({
    required this.accessToken,
    required this.tokenType,
    required this.expiresAt,
    required this.user,
    this.scope,
  });

  /// Construye una sesión a partir de la respuesta del backend
  /// (`/api/auth/token/` o `/api/auth/google/exchange-code/`).
  factory AuthSession.fromTokenResponse(Map<String, dynamic> json) {
    final accessToken = json['access_token'] as String;
    final tokenType = json['token_type'] as String? ?? 'Bearer';
    final expiresIn = json['expires_in'] as int? ?? 3600;
    final userJson = json['user'] as Map<String, dynamic>;
    return AuthSession(
      accessToken: accessToken,
      tokenType: tokenType,
      expiresAt: DateTime.now().add(Duration(seconds: expiresIn)),
      scope: json['scope'] as String?,
      user: UserAccount.fromJson(userJson),
    );
  }

  bool get isExpired => DateTime.now().isAfter(expiresAt);

  /// `true` si la sesión va a vencer pronto (menos de 5 min). Útil para que el
  /// caller decida si refresca o no antes de una llamada importante.
  bool get isExpiringSoon =>
      expiresAt.difference(DateTime.now()) < const Duration(minutes: 5);

  String get authorizationHeader => '$tokenType $accessToken';

  Map<String, dynamic> toJson() => {
        'access_token': accessToken,
        'token_type': tokenType,
        'expires_at': expiresAt.toIso8601String(),
        'scope': scope,
        'user': user.toJson(),
      };

  factory AuthSession.fromJson(Map<String, dynamic> json) => AuthSession(
        accessToken: json['access_token'] as String,
        tokenType: json['token_type'] as String? ?? 'Bearer',
        expiresAt: DateTime.parse(json['expires_at'] as String),
        scope: json['scope'] as String?,
        user: UserAccount.fromJson(json['user'] as Map<String, dynamic>),
      );
}

/// Excepción uniforme para fallos de autenticación. El AuthProvider la mapea
/// a mensajes user-friendly en la UI.
class AuthException implements Exception {
  final String message;
  final int? statusCode;
  AuthException(this.message, {this.statusCode});

  @override
  String toString() => 'AuthException($statusCode): $message';
}
