/// Pantalla de login. Ofrece email/password, Google Sign-In y la opción de
/// "Continuar sin cuenta" (mantiene el flow guest device del onboarding).

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';

class LoginScreen extends StatefulWidget {
  /// Si `true`, después de un login exitoso navega a `/home` reemplazando el
  /// stack. Si `false`, solo hace `pop(true)` — útil cuando se abre desde
  /// Settings sobre un usuario que estaba en modo guest.
  final bool navigateOnSuccess;

  const LoginScreen({super.key, this.navigateOnSuccess = true});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submitPassword(AuthProvider auth) async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    final ok = await auth.loginWithPassword(
      usernameOrEmail: _emailController.text.trim(),
      password: _passwordController.text,
    );
    if (ok && mounted) _onSuccess();
  }

  Future<void> _submitGoogle(AuthProvider auth) async {
    final ok = await auth.loginWithGoogle();
    if (ok && mounted) _onSuccess();
  }

  void _onSuccess() {
    if (widget.navigateOnSuccess) {
      Navigator.of(context).pushReplacementNamed('/home');
    } else {
      Navigator.of(context).pop(true);
    }
  }

  void _continueAsGuest() {
    Navigator.of(context).pushReplacementNamed('/onboarding');
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final colors = Theme.of(context).colorScheme;

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 32, 24, 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Logo + título
                Center(
                  child: Container(
                    width: 88,
                    height: 88,
                    decoration: BoxDecoration(
                      color: colors.primary,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Icon(Icons.notifications_active,
                        color: Colors.white, size: 44),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'CriptoSelf',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Iniciá sesión para sincronizar alertas',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.grey.shade600,
                      ),
                ),
                const SizedBox(height: 32),

                if (auth.error != null) _ErrorBanner(message: auth.error!),

                // Email
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  autocorrect: false,
                  decoration: const InputDecoration(
                    labelText: 'Email o usuario',
                    prefixIcon: Icon(Icons.person_outline),
                    border: OutlineInputBorder(),
                  ),
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) {
                      return 'Ingresá tu email o usuario';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 12),

                // Password
                TextFormField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: (_) =>
                      auth.isBusy ? null : _submitPassword(auth),
                  decoration: InputDecoration(
                    labelText: 'Contraseña',
                    prefixIcon: const Icon(Icons.lock_outline),
                    border: const OutlineInputBorder(),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword
                            ? Icons.visibility_outlined
                            : Icons.visibility_off_outlined,
                      ),
                      onPressed: () => setState(
                          () => _obscurePassword = !_obscurePassword),
                    ),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Ingresá tu contraseña';
                    return null;
                  },
                ),

                const SizedBox(height: 20),

                FilledButton(
                  onPressed: auth.isBusy ? null : () => _submitPassword(auth),
                  style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: auth.isBusy
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Iniciar sesión'),
                ),

                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(child: Divider(color: Colors.grey.shade300)),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Text(
                        'o',
                        style: TextStyle(color: Colors.grey.shade600),
                      ),
                    ),
                    Expanded(child: Divider(color: Colors.grey.shade300)),
                  ],
                ),
                const SizedBox(height: 16),

                OutlinedButton.icon(
                  onPressed: auth.isBusy ? null : () => _submitGoogle(auth),
                  icon: const Icon(Icons.g_mobiledata, size: 28),
                  label: const Text('Continuar con Google'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),

                const SizedBox(height: 32),

                TextButton(
                  onPressed: auth.isBusy ? null : _continueAsGuest,
                  child: const Text('Continuar sin cuenta'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  final String message;
  const _ErrorBanner({required this.message});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.red.shade200),
      ),
      child: Row(
        children: [
          Icon(Icons.error_outline, color: Colors.red.shade700, size: 18),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: TextStyle(color: Colors.red.shade800, fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }
}
