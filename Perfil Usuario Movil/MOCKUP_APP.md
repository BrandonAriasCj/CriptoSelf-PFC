# 📱 CriptoSelf Mobile - Mockup de la App

## 🎨 Diseño Visual de la Aplicación

### 1. **Splash Screen (Pantalla de Carga)**
```
┌─────────────────────────────┐
│                             │
│                             │
│         🔔                  │
│    [Logo CriptoSelf]        │
│                             │
│      CriptoSelf             │
│   Alertas de Criptomonedas  │
│                             │
│         ⚪⚪⚪               │
│     Inicializando...        │
│                             │
│                             │
└─────────────────────────────┘
```

### 2. **Onboarding (Configuración Inicial)**

#### Pantalla 1: Bienvenida
```
┌─────────────────────────────┐
│ ████████████████████████    │ Progress: 25%
│                             │
│         🚀                  │
│                             │
│   ¡Bienvenido a CriptoSelf! │
│                             │
│ Mantente informado sobre    │
│ los movimientos más         │
│ importantes del mercado     │
│ de criptomonedas           │
│                             │
│                             │
│ [Atrás]    ⚪⚪⚪⚪    [Siguiente] │
└─────────────────────────────┘
```

#### Pantalla 4: Configuración
```
┌─────────────────────────────┐
│ ████████████████████████████ │ Progress: 100%
│                             │
│   Configuración Inicial     │
│                             │
│ ┌─────────────────────────┐ │
│ │ Nombre del dispositivo  │ │
│ │ Mi iPhone              │ │
│ └─────────────────────────┘ │
│                             │
│ Tipos de Alertas:           │
│ ☑️ Alertas de Precio        │
│ ☑️ Noticias del Mercado     │
│ ☑️ Anuncios del Sistema     │
│                             │
│ Máximo 5 alertas por hora   │
│ ────●────────────           │
│                             │
│ [Atrás]    ⚪⚪⚪●    [Comenzar] │
└─────────────────────────────┘
```

### 3. **Home Screen (Pantalla Principal)**
```
┌─────────────────────────────┐
│ CriptoSelf            🔔(3) │ AppBar
├─────────────────────────────┤
│ [Inicio] [Notif] [Alert] [⚙️] │ Bottom Nav
├─────────────────────────────┤
│                             │
│ ┌─────────────────────────┐ │
│ │ 📱 Mi iPhone      ●Activo│ │ Device Status
│ │ Máximo 5 alertas por hora│ │
│ └─────────────────────────┘ │
│                             │
│ ┌───┐ ┌───┐ ┌───┐          │ Stats Cards
│ │📊 │ │📅 │ │📆 │          │
│ │3/5│ │ 2 │ │12 │          │
│ │Sub│ │Hoy│ │Sem│          │
│ └───┘ └───┘ └───┘          │
│                             │
│ Notificaciones Recientes    │
│                             │
│ ┌─────────────────────────┐ │
│ │🚨 Bitcoin subió 7.2%    │ │
│ │  Precio actual: $52,340 │ │
│ │                   hace 2h│ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │📰 Noticias importantes  │ │
│ │  El Salvador adopta...  │ │
│ │                  hace 4h│ │
│ └─────────────────────────┘ │
│                             │
│ [Ver Todas las Notificaciones] │
└─────────────────────────────┘
```

### 4. **Notifications Screen (Notificaciones)**
```
┌─────────────────────────────┐
│ Notificaciones  [Marcar todas]│ AppBar
├─────────────────────────────┤
│ [Todas] [No Leídas] [Import]│ Tabs
├─────────────────────────────┤
│                             │
│ ┌─────────────────────────┐ │
│ │🚨 Bitcoin - Cambio 7.2% ● │ │ Unread
│ │  El precio de Bitcoin   │ │
│ │  subió significativamente│ │
│ │  📊 Precio: $52,340     │ │
│ │                   hace 2h│ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │⚠️ Ethereum - Precio     │ │ Read
│ │  ETH cruzó el umbral    │ │
│ │  de $3,000              │ │
│ │  📊 Precio: $3,045      │ │
│ │                  hace 6h│ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │📰 Noticias del Mercado  │ │
│ │  El Salvador anuncia... │ │
│ │                 hace 1d │ │
│ └─────────────────────────┘ │
│                             │
│ [Cargar más...]             │
└─────────────────────────────┘
```

### 5. **Alerts Screen (Gestión de Alertas)**
```
┌─────────────────────────────┐
│ Alertas                     │ AppBar
├─────────────────────────────┤
│ [Disponibles] [Mis Suscripciones] │ Tabs
├─────────────────────────────┤
│                             │
│ 📈 Alertas de Precio        │ Section
│                             │
│ ┌─────────────────────────┐ │
│ │📊 Bitcoin - Cambio 5%   │ │
│ │  Cambio de 5.0% en BTC │ │
│ │  ⏰ Cooldown: 1h  🏷️ PRICE │ │
│ │                    ●ON │ │ Switch
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │🎯 Bitcoin - $50,000     │ │
│ │  BTC cruza $50000       │ │
│ │  ⏰ Cooldown: 2h  🏷️ THRESHOLD │
│ │                   ○OFF │ │
│ └─────────────────────────┘ │
│                             │
│ 📰 Noticias del Mercado     │
│                             │
│ ┌─────────────────────────┐ │
│ │📰 Noticias Importantes  │ │
│ │  Noticias importantes   │ │
│ │  ⏰ Cooldown: 30min 🏷️ NEWS │
│ │                    ●ON │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### 6. **Settings Screen (Configuración)**
```
┌─────────────────────────────┐
│ Configuración               │ AppBar
├─────────────────────────────┤
│                             │
│ Información del Dispositivo │ Section
│ ┌─────────────────────────┐ │
│ │📱 Plataforma: ANDROID   │ │
│ │🔑 ID: a3b4c5d6...       │ │
│ │⏰ Registrado: 24/05/2026│ │
│ └─────────────────────────┘ │
│                             │
│ Configuración del Dispositivo│
│ ┌─────────────────────────┐ │
│ │┌─────────────────────┐  │ │
│ ││ Mi iPhone          ✏️ │  │ │
│ │└─────────────────────┘  │ │
│ │☑️ Alertas Habilitadas   │ │
│ └─────────────────────────┘ │
│                             │
│ Tipos de Alertas            │
│ ┌─────────────────────────┐ │
│ │☑️ Alertas de Precio     │ │
│ │☑️ Noticias del Mercado  │ │
│ │☑️ Anuncios del Sistema  │ │
│ └─────────────────────────┘ │
│                             │
│ Frecuencia de Alertas       │
│ ┌─────────────────────────┐ │
│ │ Máximo 5 alertas por hora│ │
│ │ ──●──────────────       │ │
│ └─────────────────────────┘ │
│                             │
│ Estadísticas                │
│ ┌─────────────────────────┐ │
│ │📊 Suscripciones: 3      │ │
│ │📅 Notificaciones hoy: 2 │ │
│ │📆 Esta semana: 12       │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### 7. **Notification Detail Modal**
```
┌─────────────────────────────┐
│          ────               │ Handle
│                             │
│ 🚨 Bitcoin - Cambio Mayor 5%│ Title
│                             │
│ ⏰ 24/05/2026 15:30    🔴Alta│ Info
│                             │
│ Mensaje                     │
│ ─────────                   │
│ El precio de Bitcoin ha     │
│ experimentado un cambio     │
│ significativo del 7.2% en   │
│ las últimas horas.          │
│                             │
│ Regla de Alerta             │
│ ─────────────               │
│ Bitcoin - Cambio Mayor 5%   │
│                             │
│ Información Adicional       │
│ ────────────────────        │
│ symbol: BTC                 │
│ price_change: +7.2%         │
│ current_price: $52,340      │
│ previous_price: $48,850     │
│                             │
│                             │
│                             │
└─────────────────────────────┘
```

## 🎨 Paleta de Colores

- **Primario**: #1E88E5 (Azul)
- **Secundario**: #26A69A (Verde Azulado)
- **Acento**: #FF7043 (Naranja)
- **Error**: #E53935 (Rojo)
- **Warning**: #FFA726 (Amarillo)
- **Success**: #66BB6A (Verde)
- **Background**: #F5F5F5 (Gris Claro)
- **Surface**: #FFFFFF (Blanco)

## 📐 Componentes UI

### Iconos por Tipo de Alerta
- 📈 **Precio**: Cambios porcentuales
- 🎯 **Umbral**: Cruces de precio
- 📰 **Noticias**: Información del mercado
- 📢 **Sistema**: Anuncios oficiales

### Estados de Severidad
- 🚨 **Crítica**: Rojo
- ⚠️ **Alta**: Naranja
- 📊 **Media**: Azul
- ℹ️ **Baja**: Verde
- 🔔 **Info**: Gris

### Indicadores de Estado
- ● **Activo**: Verde
- ○ **Inactivo**: Gris
- 🔴 **No leído**: Punto rojo
- ✅ **Leído**: Sin indicador

## 🔄 Flujo de Navegación

```
Splash → Onboarding → Home
                        ↓
                   ┌─────────┐
                   │  Home   │
                   └─────────┘
                        ↓
        ┌───────────────┼───────────────┐
        ↓               ↓               ↓
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│Notifications│ │   Alerts    │ │  Settings   │
└─────────────┘ └─────────────┘ └─────────────┘
        ↓               ↓               ↓
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   Detail    │ │ Subscribe   │ │   Update    │
│   Modal     │ │   Toggle    │ │ Preferences │
└─────────────┘ └─────────────┘ └─────────────┘
```

## 📱 Responsive Design

- **Teléfonos**: 360dp - 414dp width
- **Tablets**: 768dp+ width
- **Orientación**: Portrait y Landscape
- **Densidades**: mdpi, hdpi, xhdpi, xxhdpi

## ⚡ Animaciones y Transiciones

- **Splash**: Fade in + Scale animation
- **Onboarding**: Slide transitions
- **Navigation**: Smooth tab transitions
- **Cards**: Ripple effect on tap
- **Modals**: Slide up from bottom
- **Loading**: Circular progress indicators
- **Pull to refresh**: Material design refresh
- **Switches**: Smooth toggle animations