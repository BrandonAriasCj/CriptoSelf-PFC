# API Móvil de Alertas - Perfil Usuario Móvil Mínimo

Esta API proporciona un perfil de usuario móvil mínimo enfocado exclusivamente en alertas, sin requerir autenticación completa. Los dispositivos se identifican por un `device_id` único.

## Características

- ✅ **Sin autenticación**: Identificación por device_id único
- ✅ **Alertas predefinidas**: Solo alertas del sistema, no personalizables
- ✅ **Push notifications**: Soporte para FCM (Firebase Cloud Messaging)
- ✅ **Control de frecuencia**: Límite configurable de alertas por hora
- ✅ **Preferencias básicas**: Tipos de alertas que quiere recibir
- ✅ **Historial**: Tracking de notificaciones enviadas y leídas

## Endpoints Principales

### 1. Health Check
```
GET /api/mobile/health/
```
Verifica que la API esté funcionando.

### 2. Registrar Dispositivo
```
POST /api/mobile/devices/
```
Registra un nuevo dispositivo móvil anónimo.

**Body:**
```json
{
  "device_name": "iPhone de Juan",
  "platform": "ios",
  "fcm_token": "fcm_token_here",
  "enabled_alerts": true,
  "price_alerts": true,
  "market_news": true,
  "system_announcements": true,
  "max_alerts_per_hour": 5
}
```

**Response:**
```json
{
  "device_id": "uuid-here",
  "device_name": "iPhone de Juan",
  "platform": "ios",
  "enabled_alerts": true,
  "created_at": "2024-01-01T12:00:00Z"
}
```

### 3. Obtener Info del Dispositivo
```
GET /api/mobile/devices/{device_id}/
```
Obtiene información del dispositivo y actualiza `last_active_at`.

### 4. Actualizar Preferencias
```
PATCH /api/mobile/devices/{device_id}/
```
Actualiza las preferencias del dispositivo.

### 5. Ver Alertas Disponibles
```
GET /api/mobile/alerts/
```
Lista todas las alertas predefinidas del sistema disponibles para suscripción.

**Response:**
```json
{
  "count": 6,
  "results": [
    {
      "id": 1,
      "name": "Bitcoin - Cambio Mayor 5%",
      "event_type": "PRICE_CHANGE_PERCENT",
      "params": {
        "symbol": "BTC",
        "threshold": 5.0,
        "direction": "both"
      },
      "enabled": true,
      "cooldown_seconds": 3600,
      "created_at": "2024-01-01T12:00:00Z"
    }
  ]
}
```

### 6. Gestionar Suscripciones
```
GET /api/mobile/devices/{device_id}/subscriptions/
POST /api/mobile/devices/{device_id}/subscriptions/
PATCH /api/mobile/devices/{device_id}/subscriptions/{id}/
DELETE /api/mobile/devices/{device_id}/subscriptions/{id}/
```

**Crear suscripción:**
```json
{
  "alert_rule_id": 1,
  "is_active": true
}
```

### 7. Ver Notificaciones
```
GET /api/mobile/devices/{device_id}/notifications/
```

**Query params:**
- `hours`: Horas hacia atrás (default: 24)
- `unread`: Solo no leídas (true/false)
- `limit`: Máximo resultados (default: 50, max: 100)

### 8. Marcar Notificación como Leída
```
POST /api/mobile/devices/{device_id}/notifications/{notification_id}/action/
```

**Body:**
```json
{
  "action": "read"  // o "click"
}
```

### 9. Estadísticas del Dispositivo
```
GET /api/mobile/devices/{device_id}/stats/
```

**Response:**
```json
{
  "total_subscriptions": 3,
  "active_subscriptions": 3,
  "notifications_today": 5,
  "notifications_this_week": 12,
  "last_notification": "2024-01-01T15:30:00Z"
}
```

## Alertas Predefinidas del Sistema

El sistema incluye estas alertas básicas:

1. **Bitcoin - Cambio Mayor 5%**: Cambios significativos en el precio de BTC
2. **Ethereum - Cambio Mayor 5%**: Cambios significativos en el precio de ETH
3. **Bitcoin - Precio Cruza $50,000**: Cuando BTC cruza el umbral de $50k
4. **Ethereum - Precio Cruza $3,000**: Cuando ETH cruza el umbral de $3k
5. **Noticias Importantes del Mercado**: Noticias de alta importancia
6. **Anuncios del Sistema**: Comunicados oficiales de la plataforma

## Flujo de Uso Típico

1. **Registro**: La app móvil registra el dispositivo con `POST /api/mobile/devices/`
2. **Exploración**: Ve alertas disponibles con `GET /api/mobile/alerts/`
3. **Suscripción**: Se suscribe a alertas de interés con `POST /api/mobile/devices/{device_id}/subscriptions/`
4. **Recepción**: Recibe push notifications automáticamente
5. **Consulta**: Ve historial con `GET /api/mobile/devices/{device_id}/notifications/`
6. **Interacción**: Marca como leídas con `POST .../action/`

## Configuración del Servidor

### 1. Ejecutar Migraciones
```bash
python manage.py migrate mobile_alerts
```

### 2. Crear Alertas del Sistema
```bash
python manage.py setup_mobile_alerts
```

### 3. Limpiar Dispositivos Inactivos (opcional)
```bash
python manage.py cleanup_mobile_devices --days 30
```

## Limitaciones y Consideraciones

- **Sin autenticación**: Los dispositivos son anónimos, no hay usuarios registrados
- **Alertas limitadas**: Solo alertas predefinidas del sistema, no personalizables
- **Frecuencia controlada**: Máximo configurable de alertas por hora por dispositivo
- **Limpieza automática**: Dispositivos inactivos se pueden limpiar periódicamente
- **FCM requerido**: Para push notifications reales se necesita configurar Firebase

## Integración con Sistema Principal

El sistema móvil se integra automáticamente con el sistema principal de alertas:

- **Signal handlers**: Escucha cuando se crean nuevas notificaciones
- **Dispatcher**: Envía notificaciones a dispositivos móviles suscritos
- **Evaluador**: Las reglas del sistema se evalúan normalmente
- **WebSocket**: Los dispositivos móviles pueden usar WebSocket si lo desean

## Próximos Pasos

Para una implementación completa, considerar:

1. **Firebase Setup**: Configurar Firebase Cloud Messaging para push notifications reales
2. **Rate Limiting**: Implementar rate limiting por IP para prevenir abuso
3. **Analytics**: Agregar métricas y analytics de uso
4. **Geolocalización**: Alertas basadas en ubicación
5. **Personalización**: Permitir cierto nivel de personalización de alertas