# 🔍 Diagnóstico Google OAuth

## ✅ Mejoras Aplicadas

He agregado logging detallado en todo el flujo de autenticación con Google para diagnosticar el problema.

## 🔄 Flujo Completo

```
1. Usuario click en "Continuar con Google"
   └─> LoginForm.handleSocialLogin('google')
   
2. Se abre popup con URL de Google
   └─> googleAuth.getAuthUrl()
   
3. Usuario autoriza en Google
   └─> Google redirige a /auth/google/callback?code=...
   
4. GoogleCallback envía mensaje al padre
   └─> window.opener.postMessage({ type: 'google-auth-success', code })
   
5. LoginForm recibe el mensaje
   └─> handleMessage() procesa el código
   
6. Intercambio de código por token de Google
   └─> googleAuth.handleCallback(code)
   └─> POST https://oauth2.googleapis.com/token
   └─> Retorna: access_token de Google
   
7. Envío de token al backend
   └─> loginWithSocial('google', accessToken)
   └─> socialAuthService.loginWithGoogle(accessToken)
   └─> POST /api/auth/social/ { provider: 'google', access_token }
   
8. Backend procesa
   └─> Obtiene info del usuario de Google
   └─> Crea/actualiza usuario en BD
   └─> Genera token OAuth2 de tu app
   └─> Retorna: { access_token, user }
   
9. Frontend guarda token
   └─> localStorage.setItem('access_token', ...)
   └─> setToken() y setUser()
   └─> navigate('/trading')
```

## 🔍 Cómo Diagnosticar

### 1. Abre la Consola del Navegador
```
F12 → Console
```

### 2. Intenta Login con Google

Deberías ver estos logs en orden:

```
✅ Código de google recibido: 4/0AY0e-g7...
🔄 Intercambiando código por token de google...
🔄 Google: Intercambiando código por token...
✅ Token de Google obtenido exitosamente
✅ Token de google obtenido: ya29.a0AfH6...
🔄 Enviando token al backend para autenticación...
🔄 Iniciando login social con google...
📤 Enviando token de google al backend...
✅ Respuesta del backend recibida: { hasAccessToken: true, hasUser: true, user: {...} }
💾 Guardando tokens en localStorage...
✅ Tokens guardados exitosamente
🔄 Actualizando estado de autenticación...
✅ Usuario autenticado con google: user@example.com
🔄 Redirigiendo a la aplicación...
📍 Navegando a: /trading
```

### 3. Identifica Dónde Falla

#### Si ves hasta "Código de google recibido" pero no más:
**Problema**: El intercambio de código por token de Google está fallando

**Solución**:
1. Verifica que `VITE_GOOGLE_CLIENT_SECRET` esté configurado en `.env`
2. Verifica que el `redirect_uri` coincida en Google Console

#### Si ves hasta "Token de google obtenido" pero no más:
**Problema**: El backend no está respondiendo o está fallando

**Solución**:
1. Verifica que el backend esté corriendo
2. Revisa los logs del backend Django
3. Verifica que `/api/auth/social/` esté configurado

#### Si ves "Respuesta del backend recibida" pero hasAccessToken es false:
**Problema**: El backend no está generando el token

**Solución**:
1. Revisa los logs del backend
2. Verifica que la aplicación OAuth2 esté creada en Django
3. Ejecuta: `python manage.py create_oauth_app`

#### Si ves todo pero no redirige:
**Problema**: El estado no se está actualizando

**Solución**:
1. Verifica que localStorage tenga el token:
   ```javascript
   localStorage.getItem('access_token')
   ```
2. Recarga la página manualmente

## 🔧 Verificaciones

### 1. Variables de Entorno

Verifica que tengas en `frontent_oficial/.env`:

```env
VITE_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=tu-client-secret
VITE_API_BASE_URL=http://localhost:8000/api
```

### 2. Google Console

Verifica en https://console.cloud.google.com/apis/credentials:

- **Authorized JavaScript origins**:
  - `http://localhost:5173`
  - `http://localhost:3000`

- **Authorized redirect URIs**:
  - `http://localhost:5173/auth/google/callback`
  - `http://localhost:3000/auth/google/callback`

### 3. Backend Django

Verifica que la aplicación OAuth2 exista:

```bash
python manage.py shell -c "from oauth2_provider.models import Application; print(Application.objects.count())"
```

Si es 0, créala:

```bash
python manage.py create_oauth_app
```

### 4. Backend Logs

Revisa los logs del backend mientras haces login:

```bash
python manage.py runserver
```

Deberías ver:

```
POST /api/auth/social/ 200 OK
```

## 🐛 Errores Comunes

### Error: "redirect_uri_mismatch"
**Causa**: El redirect_uri no coincide con Google Console

**Solución**:
1. Ve a Google Console
2. Agrega: `http://localhost:5173/auth/google/callback`

### Error: "invalid_client"
**Causa**: Client ID o Secret incorrectos

**Solución**:
1. Verifica las variables de entorno
2. Regenera las credenciales en Google Console

### Error: "invalid_grant"
**Causa**: El código ya fue usado o expiró

**Solución**:
1. Intenta de nuevo (los códigos expiran rápido)
2. Asegúrate de no estar usando el código dos veces

### Error: "No se recibió access_token del backend"
**Causa**: El backend no está generando el token

**Solución**:
1. Verifica que la app OAuth2 exista en Django
2. Revisa los logs del backend para ver el error específico

## 📝 Comandos Útiles

### Ver token en localStorage
```javascript
console.log('Token:', localStorage.getItem('access_token'));
console.log('User:', localStorage.getItem('user'));
```

### Limpiar localStorage
```javascript
localStorage.clear();
location.reload();
```

### Probar endpoint del backend
```bash
curl -X POST http://localhost:8000/api/auth/social/ \
  -H "Content-Type: application/json" \
  -d '{"provider": "google", "access_token": "ya29.a0..."}'
```

## ✅ Próximos Pasos

1. **Intenta login con Google**
2. **Abre la consola** (F12)
3. **Copia todos los logs** que veas
4. **Identifica dónde se detiene** el flujo
5. **Aplica la solución** correspondiente

Si sigues teniendo problemas, comparte los logs de la consola y los logs del backend.

---

**Estado**: 🔍 Diagnóstico habilitado
**Versión**: 1.0
**Última actualización**: Noviembre 2024
