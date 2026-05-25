# Diagnóstico: Academia sin Lecciones

## Cambios Realizados

### 1. ✅ Componente AuthStatus Eliminado
- Removido el import de `AuthStatus` en `AcademyComplete.tsx`
- Eliminada la sección que mostraba el estado de autenticación
- El error alert ahora se muestra solo cuando hay errores

## Problema: No Aparecen Lecciones en Producción

### Posibles Causas

#### 1. Base de Datos Vacía
**Síntoma**: No hay lecciones en la base de datos de producción

**Verificación**:
```bash
# Ejecutar en el servidor de producción
python check_and_populate_lessons.py
```

**Solución**:
```bash
# Poblar las lecciones
python manage.py populate_lessons
```

#### 2. Migraciones No Aplicadas
**Síntoma**: Las tablas de lessons no existen en la base de datos

**Verificación**:
```bash
python manage.py showmigrations lessons
```

**Solución**:
```bash
python manage.py migrate lessons
```

#### 3. Error en la API
**Síntoma**: La API devuelve error 500 o 404

**Verificación**:
- Abrir DevTools (F12) en el navegador
- Ir a la pestaña Network
- Recargar la página de Academia
- Buscar la petición a `/api/lessons/categories/`
- Ver el código de respuesta y el mensaje de error

**Solución según el error**:
- **401 Unauthorized**: Problema de autenticación (ya solucionado, las vistas ahora permiten acceso sin auth)
- **404 Not Found**: URL incorrecta o app no registrada
- **500 Internal Server Error**: Error en el código del backend

#### 4. CORS o Proxy
**Síntoma**: Las peticiones son bloqueadas por CORS

**Verificación**:
- Ver errores de CORS en la consola del navegador
- Verificar que las peticiones lleguen al backend

**Solución**:
```python
# En backend/settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://tu-dominio-produccion.com"
]
```

#### 5. URL Base Incorrecta
**Síntoma**: Las peticiones van a la URL incorrecta

**Verificación**:
```typescript
// En frontent_oficial/src/hooks/useAcademyApi.ts
// Verificar que las URLs sean correctas:
const response = await fetch('/api/lessons/categories/', {
```

**Solución**:
- Si estás en desarrollo, asegúrate de que el proxy esté configurado
- Si estás en producción, verifica la variable de entorno `VITE_API_URL`

### Pasos de Diagnóstico

#### Paso 1: Verificar Backend
```bash
# 1. Verificar que el servidor esté corriendo
curl http://localhost:8000/api/lessons/categories/

# 2. Verificar lecciones en la base de datos
python check_and_populate_lessons.py

# 3. Si no hay lecciones, poblarlas
python manage.py populate_lessons
```

#### Paso 2: Verificar Frontend
```javascript
// En la consola del navegador (F12)
fetch('/api/lessons/categories/')
  .then(r => r.json())
  .then(data => console.log('Categorías:', data))
  .catch(err => console.error('Error:', err))
```

#### Paso 3: Verificar Logs
```bash
# Backend logs
tail -f logs/django.log

# O si usas gunicorn
tail -f logs/gunicorn.log
```

### Solución Rápida

Si las lecciones no aparecen, ejecuta estos comandos en orden:

```bash
# 1. Aplicar migraciones
python manage.py migrate

# 2. Poblar lecciones
python manage.py populate_lessons

# 3. Verificar que se crearon
python check_and_populate_lessons.py

# 4. Reiniciar el servidor
# En desarrollo:
# Ctrl+C y volver a ejecutar python manage.py runserver

# En producción:
sudo systemctl restart gunicorn
# o
sudo systemctl restart tu-servicio-django
```

### Verificación Final

Después de aplicar las soluciones:

1. **Abrir el navegador** en la sección Academia
2. **Abrir DevTools** (F12)
3. **Ir a la pestaña Network**
4. **Recargar la página**
5. **Verificar**:
   - ✅ Petición a `/api/lessons/categories/` devuelve 200 OK
   - ✅ La respuesta contiene un array con 4 categorías
   - ✅ Las categorías se muestran en la interfaz

### Datos de Fallback

El frontend tiene datos de fallback que se muestran si la API falla:
- 4 categorías predefinidas
- 2 lecciones de ejemplo por categoría

Si ves estos datos, significa que:
- ❌ La API no está funcionando correctamente
- ❌ Las lecciones no están en la base de datos
- ✅ El frontend está funcionando (muestra fallback)

### Contacto y Soporte

Si el problema persiste:
1. Revisa los logs del backend
2. Verifica que todas las apps estén en `INSTALLED_APPS`
3. Asegúrate de que las URLs estén correctamente configuradas
4. Verifica los permisos de la base de datos

## Archivos Modificados

1. **frontent_oficial/src/pages/AcademyComplete.tsx**
   - Eliminado import de AuthStatus
   - Eliminada sección de AuthStatus
   - Simplificado el manejo de errores

2. **check_and_populate_lessons.py** (NUEVO)
   - Script para verificar y poblar lecciones
   - Útil para diagnóstico rápido

## Próximos Pasos

1. Ejecutar `python check_and_populate_lessons.py` en producción
2. Si no hay lecciones, ejecutar `python manage.py populate_lessons`
3. Verificar que las lecciones aparezcan en la interfaz
4. Si persiste el problema, revisar logs del backend
