# Sistema de Autenticación

Este proyecto implementa un sistema de autenticación robusto usando Django OAuth Toolkit y Django Allauth.

## Características

- ✅ Modelo de usuario personalizado
- ✅ Autenticación OAuth2 con tokens
- ✅ Registro y login tradicional
- ✅ Autenticación social (Google, GitHub)
- ✅ Gestión de perfiles de usuario
- ✅ Cambio de contraseña
- ✅ Verificación de email
- ✅ Permisos granulares con scopes

## Estructura del Sistema

### Apps

- **users/**: Modelo de usuario personalizado y perfiles
- **authentication/**: Views y lógica de autenticación

### Modelos

#### User (users.models.User)
Extiende AbstractUser con campos adicionales:
- Email único como identificador principal
- Campos de verificación (email, teléfono)
- Configuración de privacidad
- Avatar y biografía

#### UserProfile (users.models.UserProfile)
Perfil extendido con:
- Información profesional
- Redes sociales
- Configuración de trading
- Preferencias de notificaciones

## Endpoints de la API

### Autenticación Básica

#### POST /api/auth/register/
Registro de nuevos usuarios
```json
{
    "username": "usuario123",
    "email": "usuario@ejemplo.com",
    "password": "contraseña_segura",
    "password_confirm": "contraseña_segura",
    "first_name": "Juan",
    "last_name": "Pérez"
}
```

#### POST /api/auth/token/
Obtener token OAuth2
```json
{
    "username": "usuario@ejemplo.com",
    "password": "contraseña",
    "client_id": "tu_client_id",
    "client_secret": "tu_client_secret"
}
```

Respuesta:
```json
{
    "access_token": "token_de_acceso",
    "refresh_token": "token_de_refresco",
    "expires_in": 3600,
    "token_type": "Bearer",
    "scope": "read write",
    "user": {
        "id": 1,
        "username": "usuario123",
        "email": "usuario@ejemplo.com",
        "full_name": "Juan Pérez"
    }
}
```

### Gestión de Perfil

#### GET /api/auth/profile/
Ver perfil del usuario autenticado
```bash
curl -H "Authorization: Bearer tu_token" http://localhost:8000/api/auth/profile/
```

#### PATCH /api/auth/profile/
Actualizar perfil
```json
{
    "first_name": "Juan Carlos",
    "bio": "Trader profesional",
    "profile": {
        "company": "Trading Corp",
        "risk_tolerance": "aggressive"
    }
}
```

#### POST /api/auth/change-password/
Cambiar contraseña
```json
{
    "old_password": "contraseña_actual",
    "new_password": "nueva_contraseña",
    "new_password_confirm": "nueva_contraseña"
}
```

### Información de Usuario

#### GET /api/auth/user-info/
Información del usuario autenticado
```bash
curl -H "Authorization: Bearer tu_token" http://localhost:8000/api/auth/user-info/
```

#### POST /api/auth/logout/
Cerrar sesión (revocar token)
```bash
curl -X POST -H "Authorization: Bearer tu_token" http://localhost:8000/api/auth/logout/
```

## OAuth2 Scopes

- **read**: Permite leer información del usuario
- **write**: Permite modificar información del usuario

## Autenticación Social

### Google OAuth2
1. Configurar en Google Cloud Console
2. Agregar credenciales al .env
3. Usar endpoint: `/accounts/google/login/`

### GitHub OAuth
1. Configurar en GitHub Developer Settings
2. Agregar credenciales al .env
3. Usar endpoint: `/accounts/github/login/`

## Configuración

### 1. Variables de Entorno
Copia `.env.example` a `.env` y configura:
```bash
cp .env.example .env
```

### 2. Migraciones
```bash
python manage.py makemigrations users
python manage.py migrate
```

### 3. Crear Aplicación OAuth2
```bash
python manage.py create_oauth_app --name "Mi App" --grant-type password
```

### 4. Crear Superusuario
```bash
python manage.py createsuperuser
```

## Uso en Frontend

### React/Vue/Angular
```javascript
// Login
const response = await fetch('/api/auth/token/', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        username: 'usuario@ejemplo.com',
        password: 'contraseña',
        client_id: 'tu_client_id',
        client_secret: 'tu_client_secret'
    })
});

const data = await response.json();
localStorage.setItem('access_token', data.access_token);

// Usar token en requests
const apiResponse = await fetch('/api/auth/profile/', {
    headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    }
});
```

## Permisos Personalizados

### IsOwnerOrReadOnly
Permite solo al propietario editar sus objetos

### HasRequiredScope
Verifica scopes OAuth2 según el método HTTP

### IsVerifiedUser
Requiere que el usuario esté verificado

## Seguridad

- Tokens con expiración configurable
- Rotación automática de refresh tokens
- Límite de intentos de login
- Verificación de email obligatoria
- CORS configurado para desarrollo
- Headers de seguridad habilitados

## Testing

```bash
# Crear usuario de prueba
python manage.py shell
>>> from django.contrib.auth import get_user_model
>>> User = get_user_model()
>>> user = User.objects.create_user(
...     username='test',
...     email='test@ejemplo.com',
...     password='testpass123'
... )

# Probar endpoints
curl -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "test@ejemplo.com", "password": "testpass123", "client_id": "tu_client_id", "client_secret": "tu_client_secret"}'
```