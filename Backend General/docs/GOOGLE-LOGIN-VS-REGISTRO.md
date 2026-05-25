# 🔐 Google OAuth: Login vs Registro

## 🎯 Flujos Separados Implementados

Ahora hay dos flujos diferentes para Google OAuth:

### 1. Login con Google (LoginForm) ✅
- **Endpoint**: `/api/auth/google/exchange-code/`
- **Comportamiento**: Solo permite usuarios YA registrados
- **Si no está registrado**: Error 404 "Usuario no registrado"

### 2. Registro con Google (RegisterForm) ✅
- **Endpoint**: `/api/auth/google/register/`
- **Comportamiento**: Crea una cuenta NUEVA
- **Si ya está registrado**: Error 409 "Usuario ya registrado"

## 📊 Comparación

| Aspecto | Login | Registro |
|---------|-------|----------|
| Endpoint | `/auth/google/exchange-code/` | `/auth/google/register/` |
| Usuario existe | ✅ Permite acceso | ❌ Error 409 |
| Usuario NO existe | ❌ Error 404 | ✅ Crea cuenta |
| Mensaje éxito | "Sesión iniciada con Google" | "¡Cuenta creada exitosamente con Google!" |

## 🔄 Flujo de Login

```
1. Usuario en LoginForm
   ↓
2. Click "Continuar con Google"
   ↓
3. Autoriza en Google
   ↓
4. Código enviado a /auth/google/exchange-code/
   ↓
5. Backend verifica que el usuario EXISTE
   ↓
   ├─ ✅ Usuario existe
   │  └─ Genera token y permite acceso
   │
   └─ ❌ Usuario NO existe
      └─ Error 404: "Usuario no registrado"
```

## 🆕 Flujo de Registro

```
1. Usuario en RegisterForm
   ↓
2. Click "Continuar con Google"
   ↓
3. Autoriza en Google
   ↓
4. Código enviado a /auth/google/register/
   ↓
5. Backend verifica que el usuario NO EXISTE
   ↓
   ├─ ✅ Usuario NO existe
   │  ├─ Crea nuevo usuario
   │  ├─ Genera token
   │  └─ Permite acceso
   │
   └─ ❌ Usuario YA existe
      └─ Error 409: "Usuario ya registrado"
```

## 💻 Código Implementado

### Backend (authentication/views.py)

#### Login (exchange-code)
```python
@api_view(['POST'])
def google_exchange_code(request):
    # ... obtener info de Google ...
    
    # Buscar usuario existente - NO crear
    try:
        user = User.objects.get(email=email)
        # ... generar token ...
    except User.DoesNotExist:
        return Response({
            'error': 'Usuario no registrado',
            'message': 'Este correo no está registrado. Por favor, regístrate primero.'
        }, status=404)
```

#### Registro (register)
```python
@api_view(['POST'])
def google_register(request):
    # ... obtener info de Google ...
    
    # Verificar que NO exista
    if User.objects.filter(email=email).exists():
        return Response({
            'error': 'Usuario ya registrado',
            'message': 'Este correo ya está registrado. Por favor, inicia sesión.'
        }, status=409)
    
    # Crear nuevo usuario
    user = User.objects.create(
        email=email,
        username=username,
        first_name=user_info.get('given_name', ''),
        last_name=user_info.get('family_name', ''),
        is_verified=True,
        email_verified=True,
    )
    # ... generar token ...
```

### Frontend (api.ts)

```typescript
export const googleAuth = {
  // Para LOGIN
  async handleCallback(code: string): Promise<LoginResponse> {
    const response = await api.post('/auth/google/exchange-code/', { code });
    return response.data;
  },

  // Para REGISTRO
  async handleRegister(code: string): Promise<LoginResponse> {
    const response = await api.post('/auth/google/register/', { code });
    return response.data;
  },
};
```

### Frontend (LoginForm.tsx)

```typescript
if (provider === 'google') {
  const authData = await googleAuth.handleCallback(code); // ← LOGIN
  // ... guardar token ...
  toast.success('Sesión iniciada con Google');
}
```

### Frontend (RegisterForm.tsx)

```typescript
if (provider === 'google') {
  const authData = await googleAuth.handleRegister(code); // ← REGISTRO
  // ... guardar token ...
  toast.success('¡Cuenta creada exitosamente con Google!');
}
```

## 🧪 Casos de Prueba

### Caso 1: Registro con Google (Usuario Nuevo)
```
1. Ve a /auth (pestaña de registro)
2. Click "Continuar con Google"
3. Usa cuenta de Google NO registrada
4. Resultado: ✅ Cuenta creada
5. Toast: "¡Cuenta creada exitosamente con Google!"
6. Redirigido a /trading
```

### Caso 2: Registro con Google (Usuario Existente)
```
1. Ve a /auth (pestaña de registro)
2. Click "Continuar con Google"
3. Usa cuenta de Google YA registrada
4. Resultado: ❌ Error 409
5. Toast: "Este correo ya está registrado. Por favor, inicia sesión."
6. Permanece en /auth
```

### Caso 3: Login con Google (Usuario Registrado)
```
1. Ve a /auth (pestaña de login)
2. Click "Continuar con Google"
3. Usa cuenta de Google registrada
4. Resultado: ✅ Acceso concedido
5. Toast: "Sesión iniciada con Google"
6. Redirigido a /trading
```

### Caso 4: Login con Google (Usuario NO Registrado)
```
1. Ve a /auth (pestaña de login)
2. Click "Continuar con Google"
3. Usa cuenta de Google NO registrada
4. Resultado: ❌ Error 404
5. Toast: "Este correo no está registrado. Por favor, regístrate primero."
6. Permanece en /auth
```

## 📝 Respuestas del API

### Login - Usuario Existe (200 OK)
```json
{
  "access_token": "token...",
  "user": { "email": "usuario@example.com", ... }
}
```

### Login - Usuario NO Existe (404 NOT FOUND)
```json
{
  "error": "Usuario no registrado",
  "message": "Este correo no está registrado. Por favor, regístrate primero.",
  "email": "nuevo@example.com"
}
```

### Registro - Usuario NO Existe (200 OK)
```json
{
  "access_token": "token...",
  "user": { "email": "nuevo@example.com", ... },
  "message": "Usuario registrado exitosamente"
}
```

### Registro - Usuario YA Existe (409 CONFLICT)
```json
{
  "error": "Usuario ya registrado",
  "message": "Este correo ya está registrado. Por favor, inicia sesión.",
  "email": "usuario@example.com"
}
```

## ✅ Checklist

- [x] Endpoint de login (`/auth/google/exchange-code/`)
- [x] Endpoint de registro (`/auth/google/register/`)
- [x] Login valida que usuario EXISTE
- [x] Registro valida que usuario NO EXISTE
- [x] Mensajes de error claros
- [x] Toasts diferenciados
- [x] Rutas registradas en urls.py
- [x] Frontend usa endpoints correctos

## 🎯 Resultado

Ahora:
- ✅ **LoginForm** solo permite login de usuarios registrados
- ✅ **RegisterForm** solo permite registro de usuarios nuevos
- ✅ Mensajes claros en cada caso
- ✅ No hay confusión entre login y registro

---

**Reinicia el backend y prueba ambos flujos.** 🚀
