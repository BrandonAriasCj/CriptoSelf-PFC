import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'providers/auth_provider.dart';
import 'providers/device_provider.dart';
import 'providers/alerts_provider.dart';
import 'providers/notifications_provider.dart';
import 'services/notification_service.dart';
import 'screens/splash_screen.dart';
import 'screens/home_screen.dart';
import 'screens/onboarding_screen.dart';
import 'screens/login_screen.dart';
import 'screens/demo_screen.dart';
import 'utils/theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Inicializar servicios de notificación (sin Firebase por ahora)
  await NotificationService.initialize();
  
  runApp(const CriptoSelfMobileApp());
}

class CriptoSelfMobileApp extends StatelessWidget {
  const CriptoSelfMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => DeviceProvider()),
        ChangeNotifierProvider(create: (_) => AlertsProvider()),
        // El provider de notificaciones reacciona al estado de auth: con sesión
        // activa consume /api/alerts/* + WebSocket (mismo canal que la web);
        // sin sesión, sigue en modo guest por device_id.
        ChangeNotifierProxyProvider<AuthProvider, NotificationsProvider>(
          create: (_) => NotificationsProvider(),
          update: (_, auth, notif) {
            notif!.syncAuth(auth.isAuthenticated ? auth.accessToken : null);
            return notif;
          },
        ),
      ],
      child: MaterialApp(
        title: 'CriptoSelf Mobile',
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.system,
        // Siempre mostrar la interfaz móvil real, tanto en web como en móvil
        home: const SplashScreen(),
        debugShowCheckedModeBanner: false,
        routes: {
          '/splash': (context) => const SplashScreen(),
          '/login': (context) => const LoginScreen(),
          '/onboarding': (context) => const OnboardingScreen(),
          '/home': (context) => const HomeScreen(),
          '/demo': (context) => const DemoScreen(),
        },
      ),
    );
  }
}