# Autenticación Segura con Google OAuth 2.0

## 🔒 Flujo Seguro Implementado

Este proyecto implementa un flujo de autenticación OAuth 2.0 completamente seguro donde **el client_secret NUNCA se expone al frontend**.

## 📋 Arquitectura del Flujo

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐         ┌──────────────┐
│   Usuario   │────────▶│   Frontend   │────────▶│   Backend   │────────▶│    Google    │
│             │         │  (React)     │         │  (Django)   │         │    OAuth     │
└─────────────┘         └──────────────┘         └─────────────┘         └──────────────┘
      │                        │                        │                        │
      │  1. Click Login        │                        │                        │
      │───────────────────────▶│                        │                        │
      │                        │                        │                        │
      │  2. Redirect a Google  │                        │                        │
      │◀───────────────────────│                        │                        │
      │                        │                        │                        │
      │  3. Autoriza en Google │                        │                        │
      │───────────────────────────────────────────────────────────────────────▶│
      │                        │                        │                        │
      │  4. Recibe CÓDIGO      │                        │                        │
      │◀───────────────────────────────────────────────────────────────────────│
      │                        │                        │                        │
      │  5. Envía código       │                        │                        │
      │───────────────────────▶│                        │                        │
      │                        │  6. Envía código       │                        │
      │                        │───────────────────────▶│                        │
      │                        │                        │  7. Intercambia código │
      │                        │                        │  + client_secret       │
      │                        │                        │───────────────────────▶│
      │                        │                        │                        │
      │                        │                        │  8. Recibe access_token│
      │                        │                        │◀───────────────────────│
      │                        │                        │                        │
      │                        │                        │  9. Obtiene info user  │
      │                        │                        │───────────────────────▶│
      │                        │                        │◀───────────────────────│
      │                        │                        │                        │
      │                        │  10. Crea token OAuth2 │                        │
      │                        │  de la aplicación      │                        │
      │                        │◀───────────────────────│                        │
      │  11. Recibe token      │                        │                        │
      │◀───────────────────────│                        │                        │
```

## 🔑 Componentes Clave

### 1. Frontend (React)

**Archivo**: `frontent_oficial/src/services/api.ts`

```typescript
export const googleAuth = {
  getAuthUrl(): string {
    // Solo usa el Client ID (público)
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/google/callback`;
    const scope = 'openid email profile';

    return `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `response_type=code&` +  // ← IMPORTANTE: pide CÓDIGO, no token
      `access_type=offline`;
  },

  async handleCallback(code: string): Promise<LoginResponse> {
    // Envía el código al backend para intercambio seguro
    const response = await api.post('/auth/google/exchange-code/', {
      code,  // ← Solo envía el código
    });
    return response.data;
  },
};
```

### 2. Backend (Django)

**Archivo**: `authentication/views.py`

```python
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def google_exchange_code(request):
    """
    Intercambiar código de Google por access_token de forma segura
    """
    code = request.data.get('code')
    
    # Intercambiar código por token con Google usando client_secret
    token_response = requests.post('https://oauth2.googleapis.com/token', data={
        'client_id': settings.GOOGLE_CLIENT_ID,
        'client_secret': settings.GOOGLE_CLIENT_SECRET,  # ← Seguro en el backend
        'code': code,
        'grant_type': 'authorization_code',
        'redirect_uri': settings.GOOGLE_REDIRECT_URI,
    })
    
    # Obtener información del usuario
    access_token = token_response.json().get('access_token')
    user_info = requests.get(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        headers={'Authorization': f'Bearer {access_token}'}
    ).json()
    
    # Crear o actualizar usuario
    user, created = User.objects.get_or_create(email=user_info['email'], ...)
    
    # Crear token OAuth2 de nuestra aplicación
    access_token_obj = AccessToken.objects.create(
        user=user,
        application=application,
        token=secrets.token_urlsafe(30),
        expires=datetime.now() + timedelta(seconds=expires_seconds),
        scope='read write'
    )
    
    return Response({
        'access_token': access_token_obj.token,
        'user': UserSerializer(user).data
    })
```

## 🔐 Variables de Entorno

### Backend (.env)

```bash
# Google OAuth2 - Backend tiene AMBOS valores
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-client-secret  # ← NUNCA en el frontend
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

### Frontend (frontent_oficial/.env)

```bash
# Google OAuth2 - Frontend solo tiene el Client ID
VITE_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
# ❌ NO incluir VITE_GOOGLE_CLIENT_SECRET
```

## ✅ Ventajas de este Flujo

1. **Seguridad**: El `client_secret` nunca se expone al navegador
2. **Control**: El backend valida y controla todo el proceso
3. **Flexibilidad**: Puedes agregar lógica adicional (logging, validaciones, etc.)
4. **Tokens propios**: Generas tokens OAuth2 de tu propia aplicación
5. **Consistencia**: Mismo flujo de autenticación para todos los métodos

## 🚀 Cómo Usar

### 1. Configurar Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un proyecto o selecciona uno existente
3. Habilita la API de Google+ 
4. Ve a "Credenciales" → "Crear credenciales" → "ID de cliente de OAuth 2.0"
5. Configura:
   - Tipo de aplicación: Aplicación web
   - URIs de redirección autorizados: `http://localhost:3000/auth/google/callback`
   - Orígenes de JavaScript autorizados: `http://localhost:3000`

### 2. Configurar Variables de Entorno

Copia los valores de Google Cloud Console a tus archivos `.env`:

```bash
# Backend
GOOGLE_CLIENT_ID=tu-client-id-aqui
GOOGLE_CLIENT_SECRET=tu-client-secret-aqui
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Frontend
VITE_GOOGLE_CLIENT_ID=tu-client-id-aqui
```

### 3. Crear Aplicación OAuth2 en Django

```bash
python manage.py create_oauth_app
```

### 4. Probar el Flujo

1. Inicia el backend: `python manage.py runserver`
2. Inicia el frontend: `cd frontent_oficial && npm run dev`
3. Ve a `http://localhost:3000/auth`
4. Click en "Continuar con Google"
5. Autoriza en Google
6. ¡Listo! Deberías estar autenticado

## 🔍 Debugging

Si tienes problemas, revisa:

1. **Console del navegador**: Verás logs del flujo
2. **Terminal del backend**: Verás los requests y respuestas
3. **Google Cloud Console**: Verifica que las URIs de redirección coincidan

### Logs Esperados

**Frontend:**
```
✅ Código de google recibido: 4/0AeanS0a...
🔄 Enviando código al backend para intercambio seguro...
✅ Autenticación con Google completada exitosamente
```

**Backend:**
```
POST /api/auth/google/exchange-code/
Intercambiando código con Google...
Usuario creado/actualizado: user@example.com
Token OAuth2 creado exitosamente
```

## 📚 Referencias

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Django OAuth Toolkit](https://django-oauth-toolkit.readthedocs.io/)
- [OAuth 2.0 Authorization Code Flow](https://oauth.net/2/grant-types/authorization-code/)

## ⚠️ Notas de Seguridad

1. **NUNCA** expongas el `client_secret` en el frontend
2. **SIEMPRE** usa HTTPS en producción
3. **VALIDA** los tokens en el backend
4. **LIMITA** los scopes a lo mínimo necesario
5. **ROTA** las credenciales periódicamente
