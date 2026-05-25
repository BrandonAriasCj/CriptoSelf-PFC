import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/device_provider.dart';
import '../providers/alerts_provider.dart';
import '../models/alert_model.dart';

class AlertsScreen extends StatefulWidget {
  const AlertsScreen({super.key});

  @override
  State<AlertsScreen> createState() => _AlertsScreenState();
}

class _AlertsScreenState extends State<AlertsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Alertas'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Disponibles'),
            Tab(text: 'Mis Suscripciones'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildAvailableAlertsTab(),
          _buildSubscriptionsTab(),
        ],
      ),
    );
  }

  Widget _buildAvailableAlertsTab() {
    return Consumer<AlertsProvider>(
      builder: (context, provider, child) {
        if (provider.isLoading && provider.availableAlerts.isEmpty) {
          return const Center(child: CircularProgressIndicator());
        }

        if (provider.error != null) {
          return _buildErrorState(provider.error!, () {
            provider.loadAvailableAlerts();
          });
        }

        if (provider.availableAlerts.isEmpty) {
          return _buildEmptyState(
            'No hay alertas disponibles',
            'Las alertas del sistema aparecerán aquí',
            Icons.campaign_outlined,
          );
        }

        return RefreshIndicator(
          onRefresh: () => provider.loadAvailableAlerts(),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Alertas de precio
              if (provider.priceAlerts.isNotEmpty) ...[
                _buildSectionHeader('Alertas de Precio'),
                ...provider.priceAlerts.map((alert) => _buildAlertCard(alert)),
                const SizedBox(height: 16),
              ],

              // Alertas de noticias
              if (provider.newsAlerts.isNotEmpty) ...[
                _buildSectionHeader('Noticias del Mercado'),
                ...provider.newsAlerts.map((alert) => _buildAlertCard(alert)),
                const SizedBox(height: 16),
              ],

              // Anuncios del sistema
              if (provider.systemAlerts.isNotEmpty) ...[
                _buildSectionHeader('Anuncios del Sistema'),
                ...provider.systemAlerts.map((alert) => _buildAlertCard(alert)),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _buildSubscriptionsTab() {
    return Consumer2<AlertsProvider, DeviceProvider>(
      builder: (context, alertsProvider, deviceProvider, child) {
        if (alertsProvider.isLoading && alertsProvider.subscriptions.isEmpty) {
          return const Center(child: CircularProgressIndicator());
        }

        if (alertsProvider.error != null) {
          return _buildErrorState(alertsProvider.error!, () {
            if (deviceProvider.device != null) {
              alertsProvider.loadSubscriptions(deviceProvider.device!.deviceId);
            }
          });
        }

        if (alertsProvider.subscriptions.isEmpty) {
          return _buildEmptyState(
            'No tienes suscripciones',
            'Suscríbete a alertas desde la pestaña "Disponibles"',
            Icons.notifications_none,
          );
        }

        return RefreshIndicator(
          onRefresh: () async {
            if (deviceProvider.device != null) {
              await alertsProvider.loadSubscriptions(deviceProvider.device!.deviceId);
            }
          },
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: alertsProvider.subscriptions.length,
            itemBuilder: (context, index) {
              final subscription = alertsProvider.subscriptions[index];
              return _buildSubscriptionCard(subscription);
            },
          ),
        );
      },
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        title,
        style: Theme.of(context).textTheme.titleMedium?.copyWith(
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildAlertCard(AlertRule alert) {
    return Consumer2<AlertsProvider, DeviceProvider>(
      builder: (context, alertsProvider, deviceProvider, child) {
        final isSubscribed = alertsProvider.isSubscribedTo(alert.id);
        
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      _getAlertIcon(alert.eventType),
                      color: _getAlertColor(alert.eventType),
                      size: 24,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            alert.name,
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            alert.description,
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Colors.grey.shade600,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Switch(
                      value: isSubscribed,
                      onChanged: (value) => _toggleSubscription(alert, value),
                    ),
                  ],
                ),
                
                const SizedBox(height: 12),
                
                Row(
                  children: [
                    _buildInfoChip(
                      Icons.schedule,
                      'Cooldown: ${alert.cooldownText}',
                      Colors.blue,
                    ),
                    const SizedBox(width: 8),
                    _buildInfoChip(
                      Icons.category,
                      alert.eventType.replaceAll('_', ' '),
                      Colors.green,
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildSubscriptionCard(AlertSubscription subscription) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  _getAlertIcon(subscription.alertRule.eventType),
                  color: _getAlertColor(subscription.alertRule.eventType),
                  size: 24,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        subscription.alertRule.name,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        subscription.alertRule.description,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.grey.shade600,
                        ),
                      ),
                    ],
                  ),
                ),
                Switch(
                  value: subscription.isActive,
                  onChanged: (value) => _toggleSubscriptionStatus(subscription, value),
                ),
              ],
            ),
            
            const SizedBox(height: 12),
            
            Row(
              children: [
                _buildInfoChip(
                  Icons.access_time,
                  'Suscrito: ${_formatDate(subscription.subscribedAt)}',
                  Colors.blue,
                ),
                const SizedBox(width: 8),
                _buildInfoChip(
                  subscription.isActive ? Icons.check_circle : Icons.pause_circle,
                  subscription.isActive ? 'Activa' : 'Pausada',
                  subscription.isActive ? Colors.green : Colors.orange,
                ),
              ],
            ),
            
            const SizedBox(height: 8),
            
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton.icon(
                  onPressed: () => _showUnsubscribeDialog(subscription),
                  icon: const Icon(Icons.delete_outline, size: 18),
                  label: const Text('Cancelar'),
                  style: TextButton.styleFrom(
                    foregroundColor: Colors.red,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoChip(IconData icon, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(String title, String subtitle, IconData icon) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 64,
              color: Colors.grey.shade400,
            ),
            const SizedBox(height: 16),
            Text(
              title,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                color: Colors.grey.shade600,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.grey.shade500,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState(String error, VoidCallback onRetry) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.red,
            ),
            const SizedBox(height: 16),
            Text(
              'Error',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                color: Colors.red,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              error,
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: onRetry,
              child: const Text('Reintentar'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _toggleSubscription(AlertRule alert, bool subscribe) async {
    final deviceProvider = Provider.of<DeviceProvider>(context, listen: false);
    final alertsProvider = Provider.of<AlertsProvider>(context, listen: false);
    
    if (deviceProvider.device == null) return;
    
    final deviceId = deviceProvider.device!.deviceId;
    bool success;
    
    if (subscribe) {
      success = await alertsProvider.subscribeToAlert(deviceId, alert.id);
    } else {
      final subscription = alertsProvider.getSubscriptionByAlertId(alert.id);
      if (subscription != null) {
        success = await alertsProvider.unsubscribeFromAlert(deviceId, subscription.id);
      } else {
        success = false;
      }
    }
    
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            success
                ? (subscribe ? 'Suscrito a ${alert.name}' : 'Suscripción cancelada')
                : 'Error: ${alertsProvider.error ?? "Operación fallida"}',
          ),
          backgroundColor: success ? Colors.green : Colors.red,
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  Future<void> _toggleSubscriptionStatus(AlertSubscription subscription, bool isActive) async {
    final deviceProvider = Provider.of<DeviceProvider>(context, listen: false);
    final alertsProvider = Provider.of<AlertsProvider>(context, listen: false);
    
    if (deviceProvider.device == null) return;
    
    final success = await alertsProvider.toggleSubscription(
      deviceProvider.device!.deviceId,
      subscription.id,
      isActive,
    );
    
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            success
                ? (isActive ? 'Suscripción activada' : 'Suscripción pausada')
                : 'Error: ${alertsProvider.error ?? "Operación fallida"}',
          ),
          backgroundColor: success ? Colors.green : Colors.red,
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  void _showUnsubscribeDialog(AlertSubscription subscription) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancelar Suscripción'),
        content: Text(
          '¿Estás seguro de que quieres cancelar la suscripción a "${subscription.alertRule.name}"?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(context).pop();
              _unsubscribe(subscription);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
            ),
            child: const Text('Confirmar'),
          ),
        ],
      ),
    );
  }

  Future<void> _unsubscribe(AlertSubscription subscription) async {
    final deviceProvider = Provider.of<DeviceProvider>(context, listen: false);
    final alertsProvider = Provider.of<AlertsProvider>(context, listen: false);
    
    if (deviceProvider.device == null) return;
    
    final success = await alertsProvider.unsubscribeFromAlert(
      deviceProvider.device!.deviceId,
      subscription.id,
    );
    
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            success
                ? 'Suscripción cancelada exitosamente'
                : 'Error: ${alertsProvider.error ?? "Operación fallida"}',
          ),
          backgroundColor: success ? Colors.green : Colors.red,
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }

  IconData _getAlertIcon(String eventType) {
    switch (eventType) {
      case 'PRICE_CHANGE_PERCENT':
        return Icons.trending_up;
      case 'PRICE_THRESHOLD':
        return Icons.attach_money;
      case 'MARKET_NEWS':
        return Icons.article;
      case 'SYSTEM_ANNOUNCEMENT':
        return Icons.announcement;
      default:
        return Icons.notifications;
    }
  }

  Color _getAlertColor(String eventType) {
    switch (eventType) {
      case 'PRICE_CHANGE_PERCENT':
        return Colors.green;
      case 'PRICE_THRESHOLD':
        return Colors.blue;
      case 'MARKET_NEWS':
        return Colors.orange;
      case 'SYSTEM_ANNOUNCEMENT':
        return Colors.purple;
      default:
        return Colors.grey;
    }
  }
}