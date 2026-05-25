import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/device_provider.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final TextEditingController _deviceNameController = TextEditingController();
  
  @override
  void initState() {
    super.initState();
    
    // Inicializar el controlador con el nombre actual del dispositivo
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final device = Provider.of<DeviceProvider>(context, listen: false).device;
      if (device != null) {
        _deviceNameController.text = device.deviceName;
      }
    });
  }

  @override
  void dispose() {
    _deviceNameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Configuración'),
      ),
      body: Consumer<DeviceProvider>(
        builder: (context, provider, child) {
          final device = provider.device;
          
          if (device == null) {
            return const Center(
              child: Text('No se pudo cargar la información del dispositivo'),
            );
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Información del dispositivo
                _buildSectionHeader('Información del Dispositivo'),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        ListTile(
                          leading: Icon(
                            device.platform == 'ios' 
                                ? Icons.phone_iphone 
                                : Icons.phone_android,
                            color: Theme.of(context).primaryColor,
                          ),
                          title: const Text('Plataforma'),
                          subtitle: Text(device.platform.toUpperCase()),
                        ),
                        ListTile(
                          leading: const Icon(Icons.fingerprint),
                          title: const Text('ID del Dispositivo'),
                          subtitle: Text(
                            device.deviceId.substring(0, 8) + '...',
                            style: const TextStyle(fontFamily: 'monospace'),
                          ),
                        ),
                        ListTile(
                          leading: const Icon(Icons.access_time),
                          title: const Text('Registrado'),
                          subtitle: Text(_formatDate(device.createdAt)),
                        ),
                      ],
                    ),
                  ),
                ),
                
                const SizedBox(height: 24),
                
                // Configuración del dispositivo
                _buildSectionHeader('Configuración del Dispositivo'),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        // Nombre del dispositivo
                        TextField(
                          controller: _deviceNameController,
                          decoration: const InputDecoration(
                            labelText: 'Nombre del dispositivo',
                            border: OutlineInputBorder(),
                            suffixIcon: Icon(Icons.edit),
                          ),
                          onSubmitted: (value) => _updateDeviceName(value),
                        ),
                        
                        const SizedBox(height: 16),
                        
                        // Estado de alertas
                        SwitchListTile(
                          title: const Text('Alertas Habilitadas'),
                          subtitle: Text(
                            device.enabledAlerts 
                                ? 'Recibiendo notificaciones' 
                                : 'Notificaciones pausadas',
                          ),
                          value: device.enabledAlerts,
                          onChanged: (value) => _updatePreference('enabled_alerts', value),
                        ),
                      ],
                    ),
                  ),
                ),
                
                const SizedBox(height: 24),
                
                // Tipos de alertas
                _buildSectionHeader('Tipos de Alertas'),
                Card(
                  child: Column(
                    children: [
                      SwitchListTile(
                        title: const Text('Alertas de Precio'),
                        subtitle: const Text('Cambios significativos en BTC, ETH, etc.'),
                        value: device.priceAlerts,
                        onChanged: device.enabledAlerts 
                            ? (value) => _updatePreference('price_alerts', value)
                            : null,
                      ),
                      const Divider(height: 1),
                      SwitchListTile(
                        title: const Text('Noticias del Mercado'),
                        subtitle: const Text('Noticias importantes de criptomonedas'),
                        value: device.marketNews,
                        onChanged: device.enabledAlerts 
                            ? (value) => _updatePreference('market_news', value)
                            : null,
                      ),
                      const Divider(height: 1),
                      SwitchListTile(
                        title: const Text('Anuncios del Sistema'),
                        subtitle: const Text('Comunicados oficiales de CriptoSelf'),
                        value: device.systemAnnouncements,
                        onChanged: device.enabledAlerts 
                            ? (value) => _updatePreference('system_announcements', value)
                            : null,
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 24),
                
                // Frecuencia de alertas
                _buildSectionHeader('Frecuencia de Alertas'),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Máximo ${device.maxAlertsPerHour} alertas por hora',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                        const SizedBox(height: 8),
                        Slider(
                          value: device.maxAlertsPerHour.toDouble(),
                          min: 1,
                          max: 20,
                          divisions: 19,
                          label: device.maxAlertsPerHour.toString(),
                          onChanged: device.enabledAlerts 
                              ? (value) => _updateMaxAlertsPerHour(value.round())
                              : null,
                        ),
                        Text(
                          'Controla cuántas notificaciones quieres recibir por hora',
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.grey.shade600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                
                const SizedBox(height: 24),
                
                // Estadísticas
                _buildSectionHeader('Estadísticas'),
                Consumer<DeviceProvider>(
                  builder: (context, provider, child) {
                    final stats = provider.stats;
                    if (stats == null) {
                      return const Card(
                        child: Padding(
                          padding: EdgeInsets.all(16),
                          child: Text('Cargando estadísticas...'),
                        ),
                      );
                    }
                    
                    return Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          children: [
                            _buildStatRow(
                              'Suscripciones Totales',
                              '${stats.totalSubscriptions}',
                              Icons.campaign,
                            ),
                            const Divider(),
                            _buildStatRow(
                              'Suscripciones Activas',
                              '${stats.activeSubscriptions}',
                              Icons.check_circle,
                            ),
                            const Divider(),
                            _buildStatRow(
                              'Notificaciones Hoy',
                              '${stats.notificationsToday}',
                              Icons.today,
                            ),
                            const Divider(),
                            _buildStatRow(
                              'Notificaciones Esta Semana',
                              '${stats.notificationsThisWeek}',
                              Icons.date_range,
                            ),
                            if (stats.lastNotification != null) ...[
                              const Divider(),
                              _buildStatRow(
                                'Última Notificación',
                                _formatDate(stats.lastNotification!),
                                Icons.schedule,
                              ),
                            ],
                          ],
                        ),
                      ),
                    );
                  },
                ),
                
                const SizedBox(height: 24),
                
                // Acciones
                _buildSectionHeader('Acciones'),
                Card(
                  child: Column(
                    children: [
                      ListTile(
                        leading: const Icon(Icons.refresh, color: Colors.blue),
                        title: const Text('Actualizar Estadísticas'),
                        subtitle: const Text('Recargar datos del servidor'),
                        onTap: _refreshStats,
                      ),
                      const Divider(height: 1),
                      ListTile(
                        leading: const Icon(Icons.info_outline, color: Colors.green),
                        title: const Text('Acerca de la App'),
                        subtitle: const Text('Información y versión'),
                        onTap: _showAboutDialog,
                      ),
                      const Divider(height: 1),
                      ListTile(
                        leading: const Icon(Icons.delete_forever, color: Colors.red),
                        title: const Text('Eliminar Dispositivo'),
                        subtitle: const Text('Borrar todos los datos locales'),
                        onTap: _showDeleteDeviceDialog,
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 32),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        title,
        style: Theme.of(context).textTheme.titleMedium?.copyWith(
          fontWeight: FontWeight.w600,
          color: Theme.of(context).primaryColor,
        ),
      ),
    );
  }

  Widget _buildStatRow(String label, String value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, size: 20, color: Colors.grey.shade600),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
          Text(
            value,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _updateDeviceName(String newName) async {
    final provider = Provider.of<DeviceProvider>(context, listen: false);
    
    final success = await provider.updatePreferences(
      deviceName: newName.trim().isEmpty ? null : newName.trim(),
    );
    
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            success 
                ? 'Nombre actualizado' 
                : 'Error: ${provider.error ?? "Operación fallida"}',
          ),
          backgroundColor: success ? Colors.green : Colors.red,
        ),
      );
    }
  }

  Future<void> _updatePreference(String key, bool value) async {
    final provider = Provider.of<DeviceProvider>(context, listen: false);
    
    Map<String, dynamic> updates = {};
    
    switch (key) {
      case 'enabled_alerts':
        updates['enabledAlerts'] = value;
        break;
      case 'price_alerts':
        updates['priceAlerts'] = value;
        break;
      case 'market_news':
        updates['marketNews'] = value;
        break;
      case 'system_announcements':
        updates['systemAnnouncements'] = value;
        break;
    }
    
    final success = await provider.updatePreferences(
      enabledAlerts: updates['enabledAlerts'],
      priceAlerts: updates['priceAlerts'],
      marketNews: updates['marketNews'],
      systemAnnouncements: updates['systemAnnouncements'],
    );
    
    if (mounted && !success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${provider.error ?? "Operación fallida"}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _updateMaxAlertsPerHour(int value) async {
    final provider = Provider.of<DeviceProvider>(context, listen: false);
    
    final success = await provider.updatePreferences(
      maxAlertsPerHour: value,
    );
    
    if (mounted && !success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${provider.error ?? "Operación fallida"}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _refreshStats() async {
    final provider = Provider.of<DeviceProvider>(context, listen: false);
    await provider.loadStats();
    
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Estadísticas actualizadas'),
          duration: Duration(seconds: 1),
        ),
      );
    }
  }

  void _showAboutDialog() {
    showAboutDialog(
      context: context,
      applicationName: 'CriptoSelf Mobile',
      applicationVersion: '1.0.0',
      applicationIcon: Container(
        width: 64,
        height: 64,
        decoration: BoxDecoration(
          color: Theme.of(context).primaryColor,
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Icon(
          Icons.notifications_active,
          color: Colors.white,
          size: 32,
        ),
      ),
      children: [
        const Text(
          'Aplicación móvil para recibir alertas de criptomonedas de CriptoSelf.',
        ),
        const SizedBox(height: 16),
        const Text(
          'Características:',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        const Text('• Alertas de precio en tiempo real'),
        const Text('• Noticias importantes del mercado'),
        const Text('• Anuncios del sistema'),
        const Text('• Sin necesidad de registro'),
      ],
    );
  }

  void _showDeleteDeviceDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Eliminar Dispositivo'),
        content: const Text(
          'Esta acción eliminará todos los datos locales del dispositivo y '
          'tendrás que configurarlo nuevamente.\n\n'
          '¿Estás seguro de que quieres continuar?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              _deleteDevice();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
            ),
            child: const Text('Eliminar'),
          ),
        ],
      ),
    );
  }

  Future<void> _deleteDevice() async {
    final provider = Provider.of<DeviceProvider>(context, listen: false);
    
    // Mostrar loading
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(
        child: CircularProgressIndicator(),
      ),
    );
    
    await provider.clearDevice();
    
    if (mounted) {
      Navigator.of(context).pop(); // Cerrar loading
      Navigator.of(context).pushNamedAndRemoveUntil(
        '/onboarding',
        (route) => false,
      );
    }
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year} ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
  }
}