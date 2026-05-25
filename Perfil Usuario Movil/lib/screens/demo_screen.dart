import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/device_provider.dart';
import '../providers/alerts_provider.dart';
import '../providers/notifications_provider.dart';
import '../widgets/loading_overlay.dart';
import '../widgets/stat_card.dart';
import '../widgets/empty_state.dart';

class DemoScreen extends StatefulWidget {
  const DemoScreen({super.key});

  @override
  State<DemoScreen> createState() => _DemoScreenState();
}

class _DemoScreenState extends State<DemoScreen> {
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _initializeDemo();
  }

  Future<void> _initializeDemo() async {
    setState(() => _isLoading = true);
    
    try {
      final deviceProvider = Provider.of<DeviceProvider>(context, listen: false);
      final alertsProvider = Provider.of<AlertsProvider>(context, listen: false);
      final notificationsProvider = Provider.of<NotificationsProvider>(context, listen: false);
      
      // En web, cargar datos mock directamente
      if (kIsWeb) {
        // Simular carga de datos
        await Future.delayed(const Duration(seconds: 1));
        
        // Cargar datos mock en los providers
        deviceProvider.loadMockData();
        alertsProvider.loadMockData();
        notificationsProvider.loadMockData();
        
        if (mounted) {
          Navigator.of(context).pushReplacementNamed('/home');
        }
        return;
      }
      
      // En móvil, intentar registro real o usar mock si falla
      try {
        final success = await deviceProvider.registerDevice(
          deviceName: 'Dispositivo Demo',
          enabledAlerts: true,
          priceAlerts: true,
          marketNews: true,
          systemAnnouncements: true,
          maxAlertsPerHour: 5,
        );
        
        if (success) {
          await Future.wait([
            alertsProvider.loadAvailableAlerts(),
            alertsProvider.loadSubscriptions(deviceProvider.device!.deviceId),
            notificationsProvider.loadNotifications(deviceProvider.device!.deviceId),
          ]);
        } else {
          // Si falla, usar datos mock
          deviceProvider.loadMockData();
          alertsProvider.loadMockData();
          notificationsProvider.loadMockData();
        }
      } catch (e) {
        // En caso de error, usar datos mock
        deviceProvider.loadMockData();
        alertsProvider.loadMockData();
        notificationsProvider.loadMockData();
      }
      
      if (mounted) {
        Navigator.of(context).pushReplacementNamed('/home');
      }
    } catch (e) {
      _showError('Error: $e');
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _showError(String message) {
    if (!mounted) return;
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Error'),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              Navigator.of(context).pushReplacementNamed('/onboarding');
            },
            child: const Text('Volver'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              _initializeDemo();
            },
            child: const Text('Reintentar'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).primaryColor,
      body: LoadingOverlay(
        isLoading: _isLoading,
        message: 'Configurando modo demo...',
        child: SafeArea(
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Logo demo
                Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.2),
                        blurRadius: 10,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.play_arrow,
                    size: 60,
                    color: Color(0xFF1E88E5),
                  ),
                ),
                
                const SizedBox(height: 24),
                
                const Text(
                  'Modo Demo',
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                
                const SizedBox(height: 8),
                
                const Text(
                  'Probando CriptoSelf Mobile',
                  style: TextStyle(
                    fontSize: 16,
                    color: Colors.white70,
                  ),
                ),
                
                const SizedBox(height: 48),
                
                if (!_isLoading) ...[
                  const Text(
                    'Configurando tu experiencia...',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.white70,
                    ),
                  ),
                  
                  const SizedBox(height: 16),
                  
                  const SizedBox(
                    width: 40,
                    height: 40,
                    child: CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      strokeWidth: 3,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}