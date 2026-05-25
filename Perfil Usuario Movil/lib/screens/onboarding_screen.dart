import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/device_provider.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;
  
  // Configuración inicial
  final TextEditingController _deviceNameController = TextEditingController();
  bool _enabledAlerts = true;
  bool _priceAlerts = true;
  bool _marketNews = true;
  bool _systemAnnouncements = true;
  int _maxAlertsPerHour = 5;

  final List<OnboardingPage> _pages = [
    OnboardingPage(
      title: '¡Bienvenido a CriptoSelf!',
      description: 'Mantente informado sobre los movimientos más importantes del mercado de criptomonedas con alertas personalizadas.',
      icon: Icons.rocket_launch,
      color: Colors.blue,
    ),
    OnboardingPage(
      title: 'Alertas Inteligentes',
      description: 'Recibe notificaciones sobre cambios significativos de precios, noticias importantes y anuncios del sistema.',
      icon: Icons.notifications_active,
      color: Colors.orange,
    ),
    OnboardingPage(
      title: 'Sin Registro Requerido',
      description: 'Comienza a usar la app inmediatamente. Solo necesitamos configurar tu dispositivo para las notificaciones.',
      icon: Icons.phone_android,
      color: Colors.green,
    ),
  ];

  @override
  void dispose() {
    _deviceNameController.dispose();
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Indicador de progreso
            Container(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: List.generate(
                  _pages.length + 1, // +1 para la página de configuración
                  (index) => Expanded(
                    child: Container(
                      height: 4,
                      margin: const EdgeInsets.symmetric(horizontal: 2),
                      decoration: BoxDecoration(
                        color: index <= _currentPage
                            ? Theme.of(context).primaryColor
                            : Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                ),
              ),
            ),
            
            // Contenido principal
            Expanded(
              child: PageView(
                controller: _pageController,
                onPageChanged: (index) {
                  setState(() {
                    _currentPage = index;
                  });
                },
                children: [
                  ..._pages.map((page) => _buildOnboardingPage(page)),
                  _buildConfigurationPage(),
                ],
              ),
            ),
            
            // Botones de navegación
            Container(
              padding: const EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Botón Atrás
                  if (_currentPage > 0)
                    TextButton(
                      onPressed: () {
                        _pageController.previousPage(
                          duration: const Duration(milliseconds: 300),
                          curve: Curves.easeInOut,
                        );
                      },
                      child: const Text('Atrás'),
                    )
                  else
                    const SizedBox(width: 80),
                  
                  // Indicadores de página
                  Row(
                    children: List.generate(
                      _pages.length + 1,
                      (index) => Container(
                        width: 8,
                        height: 8,
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: index == _currentPage
                              ? Theme.of(context).primaryColor
                              : Colors.grey.shade300,
                        ),
                      ),
                    ),
                  ),
                  
                  // Botón Siguiente/Finalizar
                  ElevatedButton(
                    onPressed: _currentPage == _pages.length
                        ? _finishOnboarding
                        : () {
                            _pageController.nextPage(
                              duration: const Duration(milliseconds: 300),
                              curve: Curves.easeInOut,
                            );
                          },
                    child: Text(
                      _currentPage == _pages.length ? 'Comenzar' : 'Siguiente',
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOnboardingPage(OnboardingPage page) {
    return Padding(
      padding: const EdgeInsets.all(32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Icono
          Container(
            width: 120,
            height: 120,
            decoration: BoxDecoration(
              color: page.color.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              page.icon,
              size: 60,
              color: page.color,
            ),
          ),
          
          const SizedBox(height: 32),
          
          // Título
          Text(
            page.title,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
          ),
          
          const SizedBox(height: 16),
          
          // Descripción
          Text(
            page.description,
            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
              color: Colors.grey.shade600,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildConfigurationPage() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Configuración Inicial',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          
          const SizedBox(height: 8),
          
          Text(
            'Personaliza tu experiencia de alertas',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: Colors.grey.shade600,
            ),
          ),
          
          const SizedBox(height: 24),
          
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Nombre del dispositivo
                  TextField(
                    controller: _deviceNameController,
                    decoration: const InputDecoration(
                      labelText: 'Nombre del dispositivo (opcional)',
                      hintText: 'Mi iPhone',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Configuración de alertas
                  Text(
                    'Tipos de Alertas',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  
                  const SizedBox(height: 12),
                  
                  SwitchListTile(
                    title: const Text('Alertas de Precio'),
                    subtitle: const Text('Cambios significativos en BTC, ETH, etc.'),
                    value: _priceAlerts,
                    onChanged: (value) {
                      setState(() {
                        _priceAlerts = value;
                      });
                    },
                  ),
                  
                  SwitchListTile(
                    title: const Text('Noticias del Mercado'),
                    subtitle: const Text('Noticias importantes de criptomonedas'),
                    value: _marketNews,
                    onChanged: (value) {
                      setState(() {
                        _marketNews = value;
                      });
                    },
                  ),
                  
                  SwitchListTile(
                    title: const Text('Anuncios del Sistema'),
                    subtitle: const Text('Comunicados oficiales de CriptoSelf'),
                    value: _systemAnnouncements,
                    onChanged: (value) {
                      setState(() {
                        _systemAnnouncements = value;
                      });
                    },
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Límite de alertas
                  Text(
                    'Frecuencia de Alertas',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  
                  const SizedBox(height: 12),
                  
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Máximo $_maxAlertsPerHour alertas por hora',
                            style: Theme.of(context).textTheme.bodyLarge,
                          ),
                          
                          const SizedBox(height: 8),
                          
                          Slider(
                            value: _maxAlertsPerHour.toDouble(),
                            min: 1,
                            max: 20,
                            divisions: 19,
                            label: '$_maxAlertsPerHour',
                            onChanged: (value) {
                              setState(() {
                                _maxAlertsPerHour = value.round();
                              });
                            },
                          ),
                          
                          Text(
                            'Controla cuántas notificaciones quieres recibir',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Colors.grey.shade600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _finishOnboarding() async {
    final deviceProvider = Provider.of<DeviceProvider>(context, listen: false);
    
    // Mostrar loading
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(
        child: CircularProgressIndicator(),
      ),
    );
    
    try {
      final success = await deviceProvider.registerDevice(
        deviceName: _deviceNameController.text.trim().isEmpty 
            ? null 
            : _deviceNameController.text.trim(),
        enabledAlerts: _enabledAlerts,
        priceAlerts: _priceAlerts,
        marketNews: _marketNews,
        systemAnnouncements: _systemAnnouncements,
        maxAlertsPerHour: _maxAlertsPerHour,
      );
      
      if (mounted) {
        Navigator.of(context).pop(); // Cerrar loading
        
        if (success) {
          Navigator.of(context).pushReplacementNamed('/home');
        } else {
          _showErrorDialog(deviceProvider.error ?? 'Error desconocido');
        }
      }
    } catch (e) {
      if (mounted) {
        Navigator.of(context).pop(); // Cerrar loading
        _showErrorDialog(e.toString());
      }
    }
  }

  void _showErrorDialog(String error) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Error'),
        content: Text('No se pudo completar la configuración:\n\n$error'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }
}

class OnboardingPage {
  final String title;
  final String description;
  final IconData icon;
  final Color color;

  OnboardingPage({
    required this.title,
    required this.description,
    required this.icon,
    required this.color,
  });
}