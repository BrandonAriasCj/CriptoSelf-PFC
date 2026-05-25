# 🧪 Prueba Rápida de OAuth 2.0 Seguro

## ⚡ Inicio Rápido

### 1. Verificar Configuración
```bash
python test_oauth_config.py
```

Deberías ver:
```
✅ Configuración completa y correcta
```

### 2. Iniciar Servidores

**Terminal 1 - Backend:**
```bash
python manage.py runserver
```

**Terminal 2 - Frontend:**
```bash
cd frontent_oficial
npm run dev
```

### 3. Probar Login con Google

1. Abre el navegador en `http://localhost:3000/auth`
2. Abre la consola del navegador (F12)
3. Click en "Continuar con Google"
4. Autoriza en Google

### 4. Verificar Logs

**Console del navegador (Frontend):**
```
✅ Código de google recibido: 4/0Aean...
🔄 Enviando código al backend para intercambio seguro...
✅ Autenticación con Google completada exitosamente
```

**Terminal del backend:**
```
POST /api/auth/google/exchange-code/
[Timestamp] "POST /api/auth/google/exchange-code/ HTTP/1.1" 200
```

### 5. Verificar Sesión

Después del login, deberías:
- ✅ Ser redirigido a `/dashboard`
- ✅ Ver tu información de usuario
- ✅ Tener un token guardado en localStorage

## 🔍 Debugging

### Si el popup no se abre:
- Verifica que no esté bloqueado por el navegador
- Revisa la consola por errores

### Si recibes error 401:
- Verifica que las credenciales en `.env` sean correctas
- Ejecuta `python test_oauth_config.py`

### Si el código no se intercambia:
- Verifica que el backend esté corriendo
- Revisa los logs del backend
- Verifica que la URL de redirección en Google Cloud Console sea correcta

## 📊 Flujo Completo

```
1. Usuario click "Continuar con Google"
   ↓
2. Popup abre Google OAuth
   ↓
3. Usuario autoriza
   ↓
4. Google redirige con código
   ↓
5. Frontend recibe código
   ↓
6. Frontend envía código al backend
   ↓
7. Backend intercambia código por token (con client_secret)
   ↓
8. Backend obtiene info del usuario de Google
   ↓
9. Backend crea/actualiza usuario
   ↓
10. Backend genera token OAuth2 propio
   ↓
11. Backend envía token al frontend
   ↓
12. Frontend guarda token y redirige
   ↓
13. ✅ Usuario autenticado
```

## ✅ Checklist de Prueba

- [ ] Backend corriendo en puerto 8000
- [ ] Frontend corriendo en puerto 3000
- [ ] Consola del navegador abierta
- [ ] Click en "Continuar con Google"
- [ ] Popup de Google se abre
- [ ] Autorización exitosa
- [ ] Logs en consola del navegador
- [ ] Logs en terminal del backend
- [ ] Redirección a dashboard
- [ ] Usuario autenticado

## 🎯 Resultado Esperado

Después de completar el flujo:
- Token guardado en `localStorage.access_token`
- Usuario guardado en `localStorage.user`
- Sesión activa
- Acceso a rutas protegidas

## 🔐 Verificar Seguridad

### ✅ Correcto:
- Client secret solo en backend `.env`
- Código enviado al backend
- Token generado por el backend

### ❌ Incorrecto:
- Client secret en frontend `.env`
- Intercambio directo frontend → Google
- Token de Google usado directamente

## 📝 Notas

- El flujo es completamente seguro
- El client_secret nunca se expone al navegador
- Todo el intercambio ocurre en el backend
- Los tokens son generados por nuestra aplicación

---

**¿Todo funcionó? ¡Perfecto! 🎉**

Si tienes problemas, consulta:
- `docs/GOOGLE-OAUTH-SEGURO.md` - Guía completa
- `docs/CAMBIOS-OAUTH-SEGURO.md` - Detalles técnicos
