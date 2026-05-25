# 🔄 Reiniciar Backend - Solución al Error de Perfil

## ⚠️ Problema

El error `ERR_NETWORK` al actualizar el perfil indica que el backend no está procesando correctamente la solicitud PATCH.

## ✅ Solución: Reiniciar el Backend

Los cambios en `authentication/views.py` y `users/serializers.py` requieren reiniciar el servidor Django.

### Paso 1: Detener el Backend

En la terminal donde está corriendo el backend:
```bash
# Presiona Ctrl+C para detener el servidor
```

### Paso 2: Reiniciar el Backend

```bash
python manage.py runserver
```

Deberías ver:
```
Watching for file changes with StatReloader
Performing system checks...

System check identified no issues (0 silenced).
[Fecha y hora]
Django version X.X.X, using settings 'backend.settings'
Starting development server at http://127.0.0.1:8000/
Quit the server with CTRL-BREAK.
```

### Paso 3: Verificar que Funciona

```bash
# En otra terminal
curl http://localhost:8000/api/auth/test/

# Deberías ver:
# {"message":"Endpoint de prueba funcionando","method":"GET"}
```

## 🧪 Probar la Actualización de Perfil

### Opción 1: Desde el Navegador

1. Ve a tu perfil: `http://localhost:3000/profile`
2. Click en "Editar Perfil"
3. Modifica tu nombre o teléfono
4. Click en "Guardar Cambios"
5. Deberías ver: "Perfil actualizado correctamente" ✅

### Opción 2: Con el Script de Prueba

```bash
python test_profile_update.py
```

Sigue las instrucciones:
1. Obtén tu token desde el navegador:
   - Abre la consola (F12)
   - Ejecuta: `localStorage.getItem('access_token')`
   - Copia el token
2. Pégalo en el script
3. El script probará GET y PATCH

## 🔍 Verificar Logs del Backend

Después de intentar actualizar el perfil, revisa la terminal del backend. Deberías ver:

```
[Fecha] "PATCH /api/auth/profile/ HTTP/1.1" 200 XXX
```

Si ves un error 500 o 400, revisa el traceback completo en la terminal.

## 📝 Cambios Aplicados

### 1. users/serializers.py
```python
class UserUpdateSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(required=False)  # ← Ahora opcional
    
    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', None)
        # ... actualización mejorada
```

### 2. authentication/views.py
```python
class ProfileView(generics.RetrieveUpdateAPIView):
    def update(self, request, *args, **kwargs):
        # Fuerza partial=True
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        # ...
```

## ⚠️ Si el Problema Persiste

### 1. Verificar Puerto 8000

```bash
# Windows (PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess

# Si hay otro proceso usando el puerto, deténlo o usa otro puerto:
python manage.py runserver 8001
```

### 2. Verificar CORS

En `backend/settings.py`:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

### 3. Verificar Autenticación

En la consola del navegador:
```javascript
// Ver token
console.log(localStorage.getItem('access_token'));

// Si es null, necesitas hacer login de nuevo
```

### 4. Limpiar Caché del Navegador

1. Abre DevTools (F12)
2. Click derecho en el botón de recargar
3. Selecciona "Vaciar caché y recargar de forma forzada"

## 📊 Checklist de Verificación

- [ ] Backend detenido (Ctrl+C)
- [ ] Backend reiniciado (`python manage.py runserver`)
- [ ] Backend corriendo en puerto 8000
- [ ] Endpoint de prueba funciona (`curl http://localhost:8000/api/auth/test/`)
- [ ] Frontend corriendo en puerto 3000
- [ ] Usuario autenticado (token en localStorage)
- [ ] Intentar actualizar perfil
- [ ] Ver logs en terminal del backend

## 🎯 Resultado Esperado

Después de reiniciar el backend:

1. **Frontend**: Click "Guardar Cambios"
2. **Backend**: Procesa la solicitud PATCH
3. **Backend**: Retorna usuario actualizado (200 OK)
4. **Frontend**: Muestra toast "Perfil actualizado correctamente"
5. **Frontend**: Actualiza la UI con los nuevos datos

## 📞 Si Aún No Funciona

Comparte los siguientes logs:

1. **Terminal del backend** (últimas 20 líneas)
2. **Consola del navegador** (errores en rojo)
3. **Network tab** (request/response del PATCH)

---

**Nota**: El reinicio del backend es NECESARIO para que los cambios en los archivos Python surtan efecto.
