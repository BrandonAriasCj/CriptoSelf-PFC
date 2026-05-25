import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:pull_to_refresh/pull_to_refresh.dart';
import '../providers/device_provider.dart';
import '../providers/notifications_provider.dart';
import '../models/notification_model.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final RefreshController _refreshController = RefreshController();
  
  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _refreshController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notificaciones'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Todas'),
            Tab(text: 'No Leídas'),
            Tab(text: 'Importantes'),
          ],
        ),
        actions: [
          Consumer<NotificationsProvider>(
            builder: (context, provider, child) {
              if (provider.unreadCount > 0) {
                return TextButton(
                  onPressed: () => _markAllAsRead(),
                  child: const Text(
                    'Marcar todas',
                    style: TextStyle(color: Colors.white),
                  ),
                );
              }
              return const SizedBox.shrink();
            },
          ),
        ],
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildNotificationsList(NotificationFilter.all),
          _buildNotificationsList(NotificationFilter.unread),
          _buildNotificationsList(NotificationFilter.important),
        ],
      ),
    );
  }

  Widget _buildNotificationsList(NotificationFilter filter) {
    return Consumer2<NotificationsProvider, DeviceProvider>(
      builder: (context, notificationsProvider, deviceProvider, child) {
        if (notificationsProvider.isLoading && notificationsProvider.notifications.isEmpty) {
          return const Center(child: CircularProgressIndicator());
        }

        List<NotificationModel> notifications;
        switch (filter) {
          case NotificationFilter.unread:
            notifications = notificationsProvider.unreadNotifications;
            break;
          case NotificationFilter.important:
            notifications = [
              ...notificationsProvider.criticalNotifications,
              ...notificationsProvider.highPriorityNotifications,
            ];
            break;
          case NotificationFilter.all:
          default:
            notifications = notificationsProvider.notifications;
            break;
        }

        if (notifications.isEmpty) {
          return _buildEmptyState(filter);
        }

        return SmartRefresher(
          controller: _refreshController,
          enablePullDown: true,
          enablePullUp: true,
          onRefresh: () => _onRefresh(deviceProvider.device?.deviceId),
          onLoading: () => _onLoading(deviceProvider.device?.deviceId),
          child: ListView.builder(
            padding: const EdgeInsets.all(8),
            itemCount: notifications.length,
            itemBuilder: (context, index) {
              final notification = notifications[index];
              return _buildNotificationCard(notification, deviceProvider.device?.deviceId);
            },
          ),
        );
      },
    );
  }

  Widget _buildNotificationCard(NotificationModel notification, String? deviceId) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
      elevation: notification.isRead ? 1 : 3,
      child: InkWell(
        onTap: () => _onNotificationTap(notification, deviceId),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header con severidad y tiempo
              Row(
                children: [
                  Text(
                    notification.severityIcon,
                    style: const TextStyle(fontSize: 20),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      notification.title,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: notification.isRead 
                            ? FontWeight.normal 
                            : FontWeight.w600,
                      ),
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        notification.timeAgo,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey.shade600,
                        ),
                      ),
                      if (!notification.isRead)
                        Container(
                          width: 8,
                          height: 8,
                          margin: const EdgeInsets.only(top: 4),
                          decoration: BoxDecoration(
                            color: Theme.of(context).primaryColor,
                            shape: BoxShape.circle,
                          ),
                        ),
                    ],
                  ),
                ],
              ),
              
              const SizedBox(height: 8),
              
              // Cuerpo del mensaje
              Text(
                notification.body,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: notification.isRead 
                      ? Colors.grey.shade600 
                      : null,
                ),
              ),
              
              // Información adicional
              if (notification.ruleName != null) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(
                      Icons.label,
                      size: 16,
                      color: Colors.grey.shade500,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      notification.ruleName!,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.grey.shade500,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ],
                ),
              ],
              
              // Severidad badge
              if (notification.severity != 'info') ...[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: _getSeverityColor(notification.severity).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    notification.severityText,
                    style: TextStyle(
                      color: _getSeverityColor(notification.severity),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState(NotificationFilter filter) {
    String title;
    String subtitle;
    IconData icon;

    switch (filter) {
      case NotificationFilter.unread:
        title = 'No hay notificaciones sin leer';
        subtitle = 'Todas tus notificaciones están al día';
        icon = Icons.mark_email_read;
        break;
      case NotificationFilter.important:
        title = 'No hay notificaciones importantes';
        subtitle = 'Las alertas críticas aparecerán aquí';
        icon = Icons.priority_high;
        break;
      case NotificationFilter.all:
      default:
        title = 'No hay notificaciones';
        subtitle = 'Las alertas aparecerán aquí cuando se activen';
        icon = Icons.notifications_none;
        break;
    }

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

  Color _getSeverityColor(String severity) {
    switch (severity.toLowerCase()) {
      case 'critical':
        return Colors.red;
      case 'high':
        return Colors.orange;
      case 'medium':
        return Colors.blue;
      case 'low':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  Future<void> _onRefresh(String? deviceId) async {
    if (deviceId == null) return;
    
    final provider = Provider.of<NotificationsProvider>(context, listen: false);
    await provider.refreshNotifications(deviceId);
    _refreshController.refreshCompleted();
  }

  Future<void> _onLoading(String? deviceId) async {
    if (deviceId == null) return;
    
    final provider = Provider.of<NotificationsProvider>(context, listen: false);
    await provider.loadMoreNotifications(deviceId);
    _refreshController.loadComplete();
  }

  Future<void> _onNotificationTap(NotificationModel notification, String? deviceId) async {
    if (deviceId == null) return;

    // Marcar como clickeada si no está leída
    if (!notification.isRead) {
      final provider = Provider.of<NotificationsProvider>(context, listen: false);
      await provider.markAsClicked(deviceId, notification.id);
    }

    // Mostrar detalles de la notificación
    _showNotificationDetails(notification);
  }

  void _showNotificationDetails(NotificationModel notification) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        maxChildSize: 0.9,
        minChildSize: 0.3,
        expand: false,
        builder: (context, scrollController) => Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Handle
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              
              const SizedBox(height: 20),
              
              // Título
              Row(
                children: [
                  Text(
                    notification.severityIcon,
                    style: const TextStyle(fontSize: 24),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      notification.title,
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 16),
              
              // Información
              Row(
                children: [
                  Icon(Icons.access_time, size: 16, color: Colors.grey.shade600),
                  const SizedBox(width: 4),
                  Text(
                    notification.createdAt.toString().substring(0, 19),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.grey.shade600,
                    ),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: _getSeverityColor(notification.severity).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      notification.severityText,
                      style: TextStyle(
                        color: _getSeverityColor(notification.severity),
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 20),
              
              // Contenido
              Expanded(
                child: SingleChildScrollView(
                  controller: scrollController,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Mensaje',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        notification.body,
                        style: Theme.of(context).textTheme.bodyLarge,
                      ),
                      
                      if (notification.ruleName != null) ...[
                        const SizedBox(height: 20),
                        Text(
                          'Regla de Alerta',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          notification.ruleName!,
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ],
                      
                      if (notification.payload != null && notification.payload!.isNotEmpty) ...[
                        const SizedBox(height: 20),
                        Text(
                          'Información Adicional',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 8),
                        ...notification.payload!.entries.map((entry) => 
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 2),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '${entry.key}: ',
                                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                Expanded(
                                  child: Text(
                                    entry.value.toString(),
                                    style: Theme.of(context).textTheme.bodyMedium,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _markAllAsRead() async {
    final deviceProvider = Provider.of<DeviceProvider>(context, listen: false);
    final notificationsProvider = Provider.of<NotificationsProvider>(context, listen: false);
    
    if (deviceProvider.device != null) {
      await notificationsProvider.markAllAsRead(deviceProvider.device!.deviceId);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Todas las notificaciones marcadas como leídas'),
            duration: Duration(seconds: 2),
          ),
        );
      }
    }
  }
}

enum NotificationFilter {
  all,
  unread,
  important,
}