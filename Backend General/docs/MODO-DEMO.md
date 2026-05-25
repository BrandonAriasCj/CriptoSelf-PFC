# 🎭 Modo Demo - CriptoSelf

## ¿Qué es el Modo Demo?

El modo demo es una funcionalidad que permite usar la aplicación **sin necesidad de un backend funcionando**. Es perfecto para:

- 🎨 Demostraciones y presentaciones
- 🧪 Pruebas de interfaz sin configurar el backend
- 📱 Desarrollo frontend independiente
- 🎓 Capacitación y tutoriales

## Características del Modo Demo

### ✅ Funcionalidades Disponibles

- **Login simulado**: Ingresa cualquier email y contraseña para acceder
- **Registro simulado**: Crea cuentas demo sin validación real
- **Autenticación social simulada**: Google y GitHub funcionan sin OAuth real
- **Perfil de usuario**: Actualiza tu perfil demo (se guarda en localStorage)
- **Cambio de contraseña**: Simula el cambio de contraseña
- **Navegación completa**: Accede a todas las secciones de la aplicación
- **Persistencia local**: Los datos se mantienen en el navegador

### 🎯 Cómo Funciona

1. **Sin validación**: No se validan emails, contraseñas ni datos
2. **Tokens simulados**: Se generan tokens falsos que funcionan en el frontend
3. **Datos locales**: Todo se guarda en localStorage del navegador
4. **Sin backend**: No se hacen llamadas HTTP reales al servidor

## Activar/Desactivar Modo Demo

### Activar Modo Demo

Edita el archivo `frontent_oficial/.env`:

```env
VITE_DEMO_MODE=true
```

### Desactivar Modo Demo

```env
VITE_DEMO_MODE=false
```

O simplemente comenta/elimina la línea:

```env
# VITE_DEMO_MODE=true
```

## Uso del Modo Demo

### 1. Login

Puedes ingresar **cualquier dato** en el formulario de login:

```
Email: demo@example.com
Contraseña: cualquier_cosa
```

El sistema te dejará entrar automáticamente.

### 2. Registro

Completa el formulario con cualquier información:

```
Username: usuario_demo
Email: test@demo.com
Contraseña: 123456
Nombre: Usuario
Apellido: Demo
```

Se creará un usuario demo y se hará login automático.

### 3. Login Social

Los botones de Google y GitHub funcionan sin necesidad de configurar OAuth:

- **Google**: Simula un login con cuenta de Google
- **GitHub**: Simula un login con cuenta de GitHub

### 4. Actualizar Perfil

Puedes modificar tu perfil demo y los cambios se guardarán en localStorage:

- Nombre y apellido
- Email
- Username
- Biografía

### 5. Cambiar Contraseña

El formulario de cambio de contraseña acepta cualquier valor y simula el cambio exitoso.

## Indicadores Visuales

### Banner Superior

Cuando el modo demo está activo, verás un banner amarillo/naranja en la parte superior:

```
🎭 MODO DEMO - No se requiere backend. Puedes ingresar cualquier dato para probar la aplicación.
```

### Mensajes Toast

Los mensajes de éxito incluyen indicadores de modo demo:

- ✅ "¡Bienvenido al modo demo!"
- ✅ "Perfil demo actualizado correctamente"
- ✅ "Contraseña demo cambiada correctamente"
- ✅ "Sesión demo cerrada correctamente"

## Limitaciones del Modo Demo

### ❌ No Disponible

- **Persistencia real**: Los datos se pierden al limpiar el navegador
- **Sincronización**: No hay sincronización entre dispositivos
- **Validaciones backend**: No se validan datos contra reglas de negocio
- **APIs externas**: No se conecta a servicios reales (exchanges, etc.)
- **Datos reales**: No hay acceso a datos de mercado en tiempo real

### ⚠️ Consideraciones

- Los datos son **locales** y se pierden al limpiar localStorage
- No hay **seguridad real** (es solo para demos)
- Los tokens son **falsos** y no funcionan con el backend real
- Las operaciones de trading son **simuladas**

## Desarrollo

### Archivos Modificados

1. **`frontent_oficial/src/services/demoAuth.ts`**
   - Servicio de autenticación simulada
   - Implementa todas las funciones de auth sin backend

2. **`frontent_oficial/src/contexts/AuthContext.tsx`**
   - Detecta modo demo y usa el servicio apropiado
   - Maneja la lógica de autenticación demo

3. **`frontent_oficial/src/components/DemoModeBanner.tsx`**
   - Banner visual que indica modo demo activo

4. **`frontent_oficial/.env`**
   - Variable `VITE_DEMO_MODE` para activar/desactivar

### Agregar Nuevas Funcionalidades Demo

Para agregar más funcionalidades al modo demo:

1. Agrega la función en `demoAuth.ts`:

```typescript
export const demoAuthService = {
  // ... funciones existentes
  
  async nuevaFuncion(params: any): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 500));
    // Simular lógica
    return { success: true };
  }
};
```

2. Úsala en el contexto con condicional:

```typescript
const service = isDemoMode ? demoAuthService : authService;
const result = await service.nuevaFuncion(params);
```

## Casos de Uso

### 1. Presentación a Clientes

```bash
# Activar modo demo
echo "VITE_DEMO_MODE=true" >> frontent_oficial/.env

# Iniciar frontend
cd frontent_oficial
npm run dev
```

Ahora puedes demostrar la aplicación sin preocuparte por el backend.

### 2. Desarrollo Frontend

Trabaja en la UI sin necesidad de tener el backend corriendo:

```bash
# Solo frontend
cd frontent_oficial
npm run dev
```

### 3. Testing de UI

Prueba flujos de usuario sin datos reales:

```bash
# Modo demo + tests
VITE_DEMO_MODE=true npm run test
```

## Volver a Modo Normal

Para volver a usar el backend real:

1. Desactiva el modo demo en `.env`:
   ```env
   VITE_DEMO_MODE=false
   ```

2. Asegúrate de que el backend esté corriendo:
   ```bash
   python manage.py runserver
   ```

3. Reinicia el frontend:
   ```bash
   npm run dev
   ```

## Troubleshooting

### El modo demo no se activa

1. Verifica que `.env` tenga `VITE_DEMO_MODE=true`
2. Reinicia el servidor de desarrollo
3. Limpia la caché del navegador

### Los datos no persisten

Esto es normal en modo demo. Los datos se guardan en localStorage y se pierden al:
- Limpiar caché del navegador
- Usar modo incógnito
- Cambiar de navegador

### El banner no aparece

1. Verifica que `DemoModeBanner` esté importado en `App.tsx`
2. Revisa que la variable de entorno esté correctamente configurada
3. Reinicia el servidor de desarrollo

## Soporte

Para más información o problemas:
- Revisa la documentación en `/docs`
- Consulta los logs de la consola del navegador
- Verifica la configuración en `.env`
