# 🔐 Configuración de Google OAuth

## ❌ Problema Actual

```
Error: client_secret is missing
```

Tu archivo `.env` tiene el `VITE_GOOGLE_CLIENT_ID` pero falta el `VITE_GOOGLE_CLIENT_SECRET`.

## ✅ Solución Rápida

### 1. Obtener el Client Secret de Google

1. Ve a [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Selecciona tu proyecto
3. Click en tu **OAuth 2.0 Client ID**
4. Verás el **Client Secret** en la pantalla
5. Cópialo

### 2. Agregar al archivo .env

Abre `frontent_oficial/.env` y reemplaza:

```env
VITE_GOOGLE_CLIENT_SECRET=TU_CLIENT_SECRET_AQUI
```

Con tu Client Secret real:

```env
VITE_GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456...
```

### 3. Reiniciar el Servidor

```bash
# Detén el servidor (Ctrl+C)
# Inicia de nuevo
npm run dev
```

### 4. Probar de Nuevo

Intenta login con Google nuevamente. Ahora debería funcionar.

## 📋 Archivo .env Completo

Tu archivo debería verse así:

```env
# OAuth2 Configuration
VITE_OAUTH_CLIENT_ID=your-oauth-client-id-here
VITE_OAUTH_CLIENT_SECRET=your-oauth-client-secret-here

# API Configuration
VITE_API_BASE_URL=http://localhost:8000/api

# Google OAuth2 (para autenticación social)
VITE_GOOGLE_CLIENT_ID=YOUR-CLIENT-ID.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=GOCSPX-tu-client-secret-aqui

# GitHub OAuth2 (para autenticación social)
VITE_GITHUB_CLIENT_ID=your-github-client-id
VITE_GITHUB_CLIENT_SECRET=your-github-client-secret
```

## 🔒 Seguridad

⚠️ **IMPORTANTE**: El Client Secret **NO debería estar en el frontend** en producción.

### Para Desarrollo (Actual)
- ✅ Está bien tener el secret en `.env` localmente
- ✅ Asegúrate de que `.env` esté en `.gitignore`
- ✅ Nunca subas el `.env` a GitHub

### Para Producción (Futuro)
Deberías mover el intercambio de código al backend:

1. Frontend envía el `code` al backend
2. Backend intercambia el `code` por `access_token` usando el secret
3. Backend devuelve el `access_token` al frontend

## 🔍 Verificar que Funcione

Después de agregar el secret:

1. Reinicia el servidor frontend
2. Abre la consola (F12)
3. Intenta login con Google
4. Deberías ver:

```
✅ Código de google recibido: 4/0AY0e-g7...
🔄 Intercambiando código por token de google...
🔄 Google: Intercambiando código por token...
✅ Token de Google obtenido exitosamente
🔄 Enviando token al backend...
✅ Usuario autenticado con google
```

## ❓ Si No Tienes el Client Secret

Si no encuentras el Client Secret:

### Opción 1: Regenerar Credenciales

1. Ve a [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Elimina el OAuth Client ID actual
3. Crea uno nuevo:
   - **Application type**: Web application
   - **Name**: CriptoSelf
   - **Authorized JavaScript origins**:
     - `http://localhost:5173`
     - `http://localhost:3000`
   - **Authorized redirect URIs**:
     - `http://localhost:5173/auth/google/callback`
     - `http://localhost:3000/auth/google/callback`
4. Click **Create**
5. Copia el **Client ID** y **Client Secret**
6. Actualiza tu `.env`

### Opción 2: Ver el Secret Existente

1. Ve a [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Click en tu OAuth 2.0 Client ID
3. El Client Secret debería estar visible
4. Si no lo ves, click en "Reset Secret" para generar uno nuevo

## 🎯 Resumen

1. ✅ Obtén el Client Secret de Google Console
2. ✅ Agrégalo a `frontent_oficial/.env`
3. ✅ Reinicia el servidor
4. ✅ Prueba el login de nuevo

**¡Eso debería resolver el problema!** 🚀

---

**Estado**: ⚠️ Requiere configuración
**Prioridad**: Alta
**Tiempo estimado**: 5 minutos
