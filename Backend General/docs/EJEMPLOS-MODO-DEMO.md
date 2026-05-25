# 💡 Ejemplos de Uso - Modo Demo

## Escenarios de Uso

### 1. Presentación a Cliente

**Situación**: Necesitas demostrar la aplicación pero el backend no está disponible.

```bash
# Activar modo demo
cd frontent_oficial
echo "VITE_DEMO_MODE=true" > .env
npm run dev
```

**Durante la demo:**
- Login: `cliente@empresa.com` / `demo123`
- Navega por todas las secciones
- Muestra las funcionalidades sin preocuparte por datos reales

### 2. Desarrollo Frontend Independiente

**Situación**: Quieres trabajar en la UI sin depender del backend.

```bash
# Solo frontend en modo demo
cd frontent_oficial
npm run dev
```

**Ventajas:**
- No necesitas correr el backend
- Cambios instantáneos en la UI
- Sin errores de conexión
- Desarrollo más rápido

### 3. Testing de Flujos de Usuario

**Situación**: Necesitas probar diferentes flujos sin crear usuarios reales.

```javascript
// Puedes probar múltiples usuarios
Usuario 1: admin@test.com / pass123
Usuario 2: trader@demo.com / demo456
Usuario 3: investor@example.com / test789
```

### 4. Capacitación de Equipo

**Situación**: Entrenar al equipo sin riesgo de afectar datos reales.

```bash
# Cada miembro puede usar su propio "usuario"
Persona 1: juan@training.com / training123
Persona 2: maria@training.com / training456
Persona 3: pedro@training.com / training789
```

### 5. Screenshots y Documentación

**Situación**: Necesitas capturar pantallas para documentación.

```bash
# Modo demo con datos consistentes
Email: docs@example.com
Password: screenshot123
```

**Beneficios:**
- Datos consistentes en cada captura
- Sin información sensible
- Fácil de reproducir

## Ejemplos de Código

### Verificar si está en Modo Demo

```typescript
// En cualquier componente
const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

if (isDemoMode) {
  console.log('🎭 Aplicación en modo demo');
}
```

### Mostrar Contenido Condicional

```typescript
import React from 'react';

const MyComponent = () => {
  const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';

  return (
    <div>
      {isDemoMode && (
        <div className="bg-yellow-100 p-4 rounded">
          ⚠️ Estás viendo datos de demostración
        </div>
      )}
      
      {/* Resto del componente */}
    </div>
  );
};
```

### Agregar Funcionalidad Demo Personalizada

```typescript
// En tu servicio
export const myService = {
  async getData() {
    const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true';
    
    if (isDemoMode) {
      // Retornar datos simulados
      return {
        data: [
          { id: 1, name: 'Demo Item 1' },
          { id: 2, name: 'Demo Item 2' },
        ]
      };
    }
    
    // Llamada real al API
    return await api.get('/data');
  }
};
```

## Casos de Uso Avanzados

### 1. Demo con Datos Predefinidos

```typescript
// demoData.ts
export const demoUsers = {
  admin: {
    email: 'admin@demo.com',
    password: 'admin123',
    role: 'admin',
    profile: {
      first_name: 'Admin',
      last_name: 'Demo',
      bio: 'Administrador del sistema'
    }
  },
  trader: {
    email: 'trader@demo.com',
    password: 'trader123',
    role: 'trader',
    profile: {
      first_name: 'Trader',
      last_name: 'Demo',
      bio: 'Trader profesional'
    }
  }
};

// Usar en login
const user = demoUsers[email.split('@')[0]];
if (user) {
  return user;
}
```

### 2. Simular Delays de Red

```typescript
// demoAuth.ts
async login(email: string, password: string) {
  // Simular delay de red variable
  const delay = Math.random() * 1000 + 500; // 500-1500ms
  await new Promise(resolve => setTimeout(resolve, delay));
  
  // Resto de la lógica
}
```

### 3. Simular Errores Ocasionales

```typescript
async login(email: string, password: string) {
  // 10% de probabilidad de error
  if (Math.random() < 0.1) {
    throw new Error('Error de red simulado');
  }
  
  // Login exitoso
  return { /* ... */ };
}
```

### 4. Modo Demo con Persistencia Mejorada

```typescript
// Guardar en sessionStorage en lugar de localStorage
// para que los datos se borren al cerrar el navegador
sessionStorage.setItem('demo_user', JSON.stringify(user));
```

## Flujos de Trabajo

### Workflow 1: Desarrollo de Nueva Feature

```bash
# 1. Activar modo demo
VITE_DEMO_MODE=true

# 2. Desarrollar feature en frontend
# - Crear componentes
# - Agregar estilos
# - Implementar lógica

# 3. Probar con datos demo
# - Login rápido
# - Navegar a la feature
# - Verificar funcionamiento

# 4. Desactivar modo demo
VITE_DEMO_MODE=false

# 5. Integrar con backend real
# - Ajustar llamadas API
# - Manejar errores reales
# - Testing completo
```

### Workflow 2: Bug Fixing

```bash
# 1. Reproducir bug en modo demo
VITE_DEMO_MODE=true

# 2. Identificar el problema
# - Usar datos consistentes
# - Sin interferencia del backend

# 3. Aplicar fix

# 4. Verificar en modo demo

# 5. Verificar con backend real
VITE_DEMO_MODE=false
```

### Workflow 3: Code Review

```bash
# Revisor puede probar cambios sin configurar backend

# 1. Checkout de la rama
git checkout feature/nueva-funcionalidad

# 2. Activar modo demo
VITE_DEMO_MODE=true

# 3. Instalar dependencias
npm install

# 4. Iniciar app
npm run dev

# 5. Revisar cambios visualmente
# - Sin necesidad de backend
# - Sin configuración adicional
```

## Tips y Trucos

### 1. Datos Consistentes para Screenshots

```typescript
// Crear un usuario específico para screenshots
const SCREENSHOT_USER = {
  email: 'demo@criptoself.com',
  first_name: 'Demo',
  last_name: 'User',
  username: 'demouser'
};
```

### 2. Modo Demo con Logs Detallados

```typescript
if (isDemoMode) {
  console.log('🎭 [DEMO] Login attempt:', email);
  console.log('🎭 [DEMO] Generated token:', token);
  console.log('🎭 [DEMO] User created:', user);
}
```

### 3. Resetear Estado Demo

```typescript
// Función para limpiar todos los datos demo
export const resetDemoState = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  console.log('🎭 [DEMO] Estado reseteado');
};
```

### 4. Exportar/Importar Datos Demo

```typescript
// Exportar estado actual
export const exportDemoState = () => {
  const state = {
    token: localStorage.getItem('access_token'),
    user: JSON.parse(localStorage.getItem('user') || '{}')
  };
  
  const blob = new Blob([JSON.stringify(state, null, 2)], 
    { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'demo-state.json';
  a.click();
};

// Importar estado
export const importDemoState = (file: File) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const state = JSON.parse(e.target?.result as string);
    localStorage.setItem('access_token', state.token);
    localStorage.setItem('user', JSON.stringify(state.user));
  };
  reader.readAsText(file);
};
```

## Troubleshooting

### Problema: El modo demo no se activa

**Solución:**
```bash
# Verificar .env
cat frontent_oficial/.env | grep DEMO

# Debe mostrar:
# VITE_DEMO_MODE=true

# Si no, agregar:
echo "VITE_DEMO_MODE=true" >> frontent_oficial/.env

# Reiniciar servidor
npm run dev
```

### Problema: Los datos no persisten

**Solución:**
```javascript
// Verificar localStorage
console.log('Token:', localStorage.getItem('access_token'));
console.log('User:', localStorage.getItem('user'));

// Si están vacíos, hacer login nuevamente
```

### Problema: El banner no aparece

**Solución:**
```typescript
// Verificar que DemoModeBanner esté importado en App.tsx
import { DemoModeBanner } from './components/DemoModeBanner';

// Y renderizado
<DemoModeBanner />
```

## Recursos Adicionales

- [MODO-DEMO.md](./MODO-DEMO.md) - Documentación completa
- [ACTIVAR-MODO-DEMO.md](./ACTIVAR-MODO-DEMO.md) - Guía rápida
- [CAMBIOS-MODO-DEMO.md](./CAMBIOS-MODO-DEMO.md) - Resumen de cambios

## Feedback

Si tienes ideas para mejorar el modo demo o encuentras problemas, por favor:
1. Documenta el caso de uso
2. Describe el comportamiento esperado
3. Proporciona ejemplos de código si es posible
