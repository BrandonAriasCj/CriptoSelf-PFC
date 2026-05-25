# 🎨 Guía de Clases de Texto Adaptativas - CriptoSelf

## 📋 Clases de Texto Principales

### Textos Principales
- `text-primary-adaptive` - Texto principal (títulos, encabezados importantes)
- `text-secondary-adaptive` - Texto secundario (subtítulos, descripciones)
- `text-accent-adaptive` - Texto de acento (enlaces, elementos destacados)

### Textos por Contraste
- `text-high-contrast` - Contraste alto (nombres de usuario, datos importantes)
- `text-medium-contrast` - Contraste medio (texto normal)
- `text-low-contrast` - Contraste bajo (metadatos, timestamps)

### Textos de Estado
- `text-success-adaptive` - Texto de éxito (verde adaptativo)
- `text-warning-adaptive` - Texto de advertencia (amarillo adaptativo)
- `text-error-adaptive` - Texto de error (rojo adaptativo)
- `text-destructive-adaptive` - Texto destructivo (acciones peligrosas)

### Textos Especiales
- `text-gradient-overlay` - Texto sobre gradientes (siempre blanco)
- `text-avatar-overlay` - Texto en avatares (blanco con sombra)
- `text-loading-adaptive` - Texto de carga
- `text-icon-adaptive` - Iconos normales
- `text-icon-active` - Iconos activos
- `text-icon-destructive` - Iconos destructivos

### Estados de Navegación
- `text-active-tab` - Pestaña activa
- `text-inactive-tab` - Pestaña inactiva
- `hover:text-inactive-tab` - Hover en pestaña inactiva

## 🚫 Clases a EVITAR

### ❌ Colores Fijos
- `text-white` → Usar `text-gradient-overlay` o `text-avatar-overlay`
- `text-black` → Usar `text-primary-adaptive`
- `text-gray-400` → Usar `text-secondary-adaptive`
- `text-gray-600` → Usar `text-medium-contrast`
- `text-gray-800` → Usar `text-high-contrast`
- `text-red-500` → Usar `text-destructive-adaptive`
- `text-blue-600` → Usar `text-accent-adaptive`

### ❌ Clases Condicionales Complejas
- `text-gray-900 dark:text-gray-100` → Usar `text-primary-adaptive`
- `text-gray-600 dark:text-gray-400` → Usar `text-secondary-adaptive`

## ✅ Ejemplos de Uso Correcto

### Títulos y Encabezados
```tsx
<h1 className="text-2xl font-bold text-primary-adaptive">
  Título Principal
</h1>

<h2 className="text-xl font-semibold text-high-contrast">
  Subtítulo Importante
</h2>
```

### Texto Descriptivo
```tsx
<p className="text-sm text-secondary-adaptive">
  Descripción o texto explicativo
</p>

<span className="text-xs text-low-contrast">
  Metadatos o información secundaria
</span>
```

### Iconos
```tsx
{/* Icono normal */}
<Icon className="w-5 h-5 text-icon-adaptive" />

{/* Icono activo */}
<Icon className="w-5 h-5 text-icon-active" />

{/* Icono destructivo */}
<LogOut className="w-4 h-4 text-icon-destructive" />
```

### Botones y Enlaces
```tsx
{/* Botón destructivo */}
<Button className="text-destructive-adaptive hover:text-destructive-adaptive">
  Eliminar
</Button>

{/* Enlace de acento */}
<a className="text-accent-adaptive hover:text-primary-adaptive">
  Ver más
</a>
```

### Estados de Navegación
```tsx
{/* Pestaña activa */}
<Button className={cn(
  "w-full justify-start gap-3",
  isActive ? "text-active-tab" : "text-inactive-tab hover:text-inactive-tab"
)}>
  {tab.label}
</Button>
```

## 🎯 Beneficios del Sistema

1. **Consistencia**: Todos los textos siguen las mismas reglas
2. **Mantenibilidad**: Cambios centralizados en CSS
3. **Accesibilidad**: Contraste adecuado automático
4. **Flexibilidad**: Fácil cambio de paleta de colores
5. **Performance**: Sin clases condicionales complejas

## 🔧 Implementación

Todas las clases están definidas en `src/styles/theme.css` y se adaptan automáticamente al tema actual usando variables CSS.

## 📱 Testing

Para probar que los textos funcionan correctamente:
1. Cambiar entre tema claro y oscuro
2. Verificar que todos los textos sean legibles
3. Comprobar el contraste en diferentes secciones
4. Validar estados hover y focus