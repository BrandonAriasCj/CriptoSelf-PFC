# 🧹 Limpiar Caché del Navegador - Solución Definitiva

## ✅ Confirmación

He verificado que el backend **SÍ está respondiendo correctamente**:

```bash
curl -X OPTIONS http://localhost:8000/api/auth/profile/

# Respuesta:
access-control-allow-origin: http://localhost:3000
access-control-allow-credentials: true
access-control-allow-methods: DELETE, GET, OPTIONS, PATCH, POST, PUT ✅
```

**El problema es que tu navegador tiene el error de CORS cacheado.**

## 🔄 Solución: Limpieza Profunda del Navegador

### Opción 1: Modo Incógnito (Más Rápido)

1. Abre una ventana de incógnito:
   - Chrome/Edge: `Ctrl + Shift + N`
   - Firefox: `Ctrl + Shift + P`

2. Ve a `http://localhost:3000`

3. Inicia sesión

4. Ve a tu perfil y prueba actualizar

**Esto debería funcionar inmediatamente** ✅

### Opción 2: Limpiar Caché Completo

#### Chrome/Edge

1. Presiona `Ctrl + Shift + Delete`

2. Selecciona:
   - ✅ Imágenes y archivos en caché
   - ✅ Cookies y otros datos de sitios

3. Intervalo de tiempo: **Desde siempre**

4. Click "Borrar datos"

5. Cierra y abre el navegador

6. Ve a `http://localhost:3000`

#### Firefox

1. Presiona `Ctrl + Shift + Delete`

2. Selecciona:
   - ✅ Caché
   - ✅ Cookies

3. Intervalo: **Todo**

4. Click "Limpiar ahora"

5. Cierra y abre el navegador

### Opción 3: DevTools Hard Reload

1. Abre DevTools: `F12`

2. Click derecho en el botón de recargar (junto a la barra de direcciones)

3. Selecciona: **"Vaciar caché y recargar de forma forzada"**

4. Espera a que cargue completamente

5. Cierra DevTools

6. Recarga la página normalmente

### Opción 4: Deshabilitar Caché en DevTools

1. Abre DevTools: `F12`

2. Ve a la pestaña **Network**

3. Marca la casilla: **"Disable cache"**

4. Mantén DevTools abierto

5. Recarga la página

6. Prueba actualizar el perfil

## 🧪 Verificar que Funciona

### En DevTools (F12)

1. Ve a la pestaña **Network**

2. Intenta actualizar el perfil

3. Busca la petición **OPTIONS** a `/api/auth/profile/`

4. Click en ella

5. Ve a la pestaña **Headers**

6. Busca **Response Headers**

7. Deberías ver:
   ```
   access-control-allow-methods: DELETE, GET, OPTIONS, PATCH, POST, PUT
   access-control-allow-origin: http://localhost:3000
   ```

8. Ahora busca la petición **PATCH** a `/api/auth/profile/`

9. Debería tener Status: **200 OK** ✅

## ⚠️ Si Aún No Funciona

### Prueba con Otro Navegador

Si usas Chrome, prueba con:
- Firefox
- Edge
- Brave

Esto confirmará si es un problema del navegador específico.

### Verifica el Puerto del Frontend

En la consola del navegador (F12):
```javascript
console.log(window.location.origin);
// Debería mostrar: http://localhost:3000
```

Si muestra otro puerto (ej: 5173), actualiza `backend/settings.py`:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",  # ← Agrega este
]
```

### Reinicia Ambos Servidores

```bash
# Terminal 1 - Backend
# Ctrl+C
python manage.py runserver

# Terminal 2 - Frontend
# Ctrl+C
npm run dev
```

## 📊 Checklist

- [ ] Backend corriendo en puerto 8000
- [ ] Frontend corriendo en puerto 3000 (o 5173)
- [ ] Navegador en modo incógnito O caché limpiado
- [ ] DevTools abierto con "Disable cache" marcado
- [ ] Intentar actualizar perfil
- [ ] Ver petición OPTIONS con status 200
- [ ] Ver petición PATCH con status 200
- [ ] Ver toast "Perfil actualizado correctamente"

## 🎯 Resultado Esperado

En DevTools → Network:

```
OPTIONS /api/auth/profile/
Status: 200 OK
Response Headers:
  access-control-allow-methods: DELETE, GET, OPTIONS, PATCH, POST, PUT ✅
  access-control-allow-origin: http://localhost:3000 ✅

PATCH /api/auth/profile/
Status: 200 OK ✅
Response: { id: 1, first_name: "...", ... }
```

En la UI:
```
Toast: "Perfil actualizado correctamente" ✅
```

## 💡 Explicación

El navegador cachea las respuestas de CORS (especialmente las respuestas OPTIONS). Cuando el backend respondía con error de CORS, el navegador guardó esa respuesta. Aunque ahora el backend responde correctamente, el navegador sigue usando la respuesta cacheada.

La solución es forzar al navegador a hacer una nueva petición sin usar el caché.

---

**IMPORTANTE**: Usa modo incógnito primero. Es la forma más rápida de verificar que el backend está funcionando correctamente.
