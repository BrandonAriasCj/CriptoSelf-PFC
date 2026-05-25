# 📊 Backtesting Demo - Documentación

## Descripción

El **Backtesting Demo** es una funcionalidad que permite ejecutar simulaciones de backtesting completamente en el frontend, sin necesidad de un backend funcionando. Genera datos realistas de mercado y simula operaciones de trading con tu estrategia.

## Características

### ✅ Funcionalidades Disponibles

- **Generación de datos realistas**: Precios con tendencia y volatilidad configurable
- **Detección de patrones**: Simulación de señales de compra/venta
- **Simulación de trading**: Operaciones con stop loss y take profit
- **Métricas completas**: Capital, rentabilidad, tasa de acierto, drawdown, Sharpe ratio
- **Gráficos interactivos**: Visualización de precios, volumen y señales
- **Configuración personalizable**: Ajusta todos los parámetros de la estrategia

### 🎯 Datos Generados

1. **Precios**: Serie temporal con tendencia y volatilidad realista
2. **Volumen**: Correlacionado con los cambios de precio
3. **Patrones**: Señales de compra/venta basadas en cambios significativos
4. **Historial de capital**: Evolución del capital durante el backtesting
5. **Métricas de rendimiento**: Estadísticas completas de la estrategia

## Cómo Funciona

### Generación de Datos

```typescript
// 1. Generar fechas con intervalo específico
const fechas = generateDates(startDate, numPoints, intervalMinutes);

// 2. Generar precios con tendencia y volatilidad
const precio = generatePriceData(startPrice, numPoints, volatility, trend);

// 3. Detectar patrones de velas
const patronVela = detectPatterns(precio);

// 4. Generar volumen correlacionado
const volma = generateVolume(precio);
```

### Simulación de Trading

```typescript
// Parámetros de la estrategia
- Capital inicial: $10,000
- Riesgo por trade: 2%
- Stop Loss: 2x ATR
- Take Profit: 4x ATR

// Lógica de trading
1. Detectar señal de compra (patrón alcista)
2. Entrar en posición
3. Calcular stop loss y take profit
4. Monitorear precio
5. Cerrar posición si se alcanza SL o TP
6. Registrar resultado
```

### Métricas Calculadas

- **Capital Final**: Capital después de todas las operaciones
- **Ganancia/Pérdida**: Diferencia entre capital final e inicial
- **Rentabilidad %**: Porcentaje de ganancia o pérdida
- **Operaciones Totales**: Número de trades ejecutados
- **Operaciones Ganadas/Perdidas**: Desglose de resultados
- **Tasa de Acierto**: Porcentaje de operaciones ganadoras
- **Max Drawdown**: Máxima caída desde el pico de capital
- **Sharpe Ratio**: Ratio de rendimiento ajustado por riesgo

## Uso

### 1. Backtesting Demo Rápido

En la sección "Mis Estrategias", haz clic en "Ejecutar Backtesting":

```
1. Click en "Ejecutar Backtesting"
2. El sistema genera datos demo automáticamente
3. Visualiza resultados en gráficos y métricas
```

### 2. Backtesting Personalizado

Configura los parámetros antes de ejecutar:

```
Configuración Básica:
- Par: BTC/USDT, ETH/USDT, ADA/USDT
- Timeframe: 1m, 5m, 15m, 1h
- Fechas: Inicio y fin del período
- Capital inicial: $100 - $100,000

Configuración de Estrategia:
- EMA Rápida: 3-50 períodos
- EMA Lenta: 10-100 períodos
- Stop Loss: 0.5x - 5x ATR
- Take Profit: 1x - 10x ATR
- RSI Período: 7-30
- Riesgo por Trade: 0.5% - 10%

Configuración Avanzada:
- Volumen Mínimo: 1-50
- ADX Threshold: 15-40
- Bollinger Bands: 10-50 períodos
- ATR Período: 7-30
```

### 3. Presets Rápidos

Usa configuraciones predefinidas:

#### Conservador
```
- Stop Loss: 1.5x ATR
- Take Profit: 3.0x ATR
- Riesgo: 1% por trade
- RSI: 21 períodos
- ADX: 30 threshold
```

#### Agresivo
```
- Stop Loss: 3.0x ATR
- Take Profit: 6.0x ATR
- Riesgo: 5% por trade
- RSI: 7 períodos
- ADX: 20 threshold
```

#### Scalping
```
- Timeframe: 1m
- EMA Rápida: 5
- EMA Lenta: 13
- Stop Loss: 0.5x ATR
- Take Profit: 1.5x ATR
- Riesgo: 1% por trade
```

## Ejemplos de Resultados

### Ejemplo 1: Estrategia Rentable

```
Capital Inicial: $10,000
Capital Final: $12,500
Ganancia: +$2,500 (+25%)

Operaciones:
- Total: 45
- Ganadas: 28 (62.2%)
- Perdidas: 17 (37.8%)

Métricas:
- Max Drawdown: 8.5%
- Sharpe Ratio: 1.85
- Risk/Reward: 1:2
```

### Ejemplo 2: Estrategia con Pérdidas

```
Capital Inicial: $10,000
Capital Final: $8,750
Pérdida: -$1,250 (-12.5%)

Operaciones:
- Total: 38
- Ganadas: 14 (36.8%)
- Perdidas: 24 (63.2%)

Métricas:
- Max Drawdown: 15.2%
- Sharpe Ratio: -0.45
- Risk/Reward: 1:2
```

## Algoritmos de Generación

### 1. Generación de Precios

```typescript
// Precio con tendencia y volatilidad
newPrice = previousPrice * (1 + randomChange + trendChange)

donde:
- randomChange = (random - 0.5) * 2 * volatility
- trendChange = trend (constante)
- volatility = 0.01 - 0.03 (según timeframe)
- trend = 0.0001 - 0.0005 (tendencia alcista leve)
```

### 2. Detección de Patrones

```typescript
// Patrón alcista
if (cambio > 1.5% && random > 0.7) {
  return 1; // Señal de compra
}

// Patrón bajista
if (cambio < -1.5% && random > 0.7) {
  return -1; // Señal de venta
}
```

### 3. Generación de Volumen

```typescript
// Volumen correlacionado con cambio de precio
baseVolume = 800 + random * 400
volumeMultiplier = 1 + (priceChange * 50)
volume = baseVolume * volumeMultiplier
```

### 4. Simulación de Trading

```typescript
// Entrada en posición
if (señal de compra) {
  precioEntrada = precioActual
  stopLoss = precioEntrada - (ATR * stopLossMult)
  takeProfit = precioEntrada + (ATR * takeProfitMult)
}

// Salida de posición
if (precio <= stopLoss) {
  pérdida = capital * riskPerTrade
  capital -= pérdida
}

if (precio >= takeProfit) {
  ganancia = capital * riskPerTrade * (TP/SL)
  capital += ganancia
}
```

## Ventajas del Modo Demo

### 1. Sin Dependencias
- No requiere backend funcionando
- No necesita datos históricos reales
- No depende de APIs externas

### 2. Rapidez
- Generación instantánea de datos
- Ejecución rápida de simulaciones
- Ideal para pruebas y demos

### 3. Flexibilidad
- Configura cualquier parámetro
- Prueba diferentes estrategias
- Experimenta sin riesgos

### 4. Educativo
- Entiende cómo funcionan las estrategias
- Visualiza el impacto de los parámetros
- Aprende sobre gestión de riesgo

## Limitaciones

### ❌ No Incluye

- **Datos reales**: Los precios son simulados
- **Slippage**: No se simula deslizamiento de precio
- **Comisiones**: No se incluyen fees de trading
- **Liquidez**: No se considera profundidad de mercado
- **Eventos externos**: No hay noticias o eventos del mercado
- **Correlaciones**: No hay correlación entre activos

### ⚠️ Consideraciones

- Los resultados son **simulados** y no garantizan rendimiento real
- La generación de patrones es **aleatoria** con probabilidades
- El volumen es **sintético** y correlacionado artificialmente
- Los datos no reflejan **condiciones reales** del mercado

## Comparación: Demo vs Real

| Característica | Modo Demo | Modo Real |
|---------------|-----------|-----------|
| Datos | Generados localmente | API de exchange |
| Velocidad | Instantáneo | Depende de red |
| Precisión | Simulada | Real |
| Costo | Gratis | Puede tener fees |
| Dependencias | Ninguna | Backend + API |
| Uso | Demos, pruebas | Trading real |

## Casos de Uso

### 1. Aprendizaje
```
Objetivo: Entender cómo funcionan las estrategias
Uso: Experimenta con diferentes parámetros
Beneficio: Aprende sin riesgo
```

### 2. Desarrollo
```
Objetivo: Probar nuevas estrategias
Uso: Valida lógica antes de implementar
Beneficio: Desarrollo más rápido
```

### 3. Presentaciones
```
Objetivo: Demostrar funcionalidades
Uso: Muestra resultados sin backend
Beneficio: Demo independiente
```

### 4. Testing
```
Objetivo: Validar interfaz de usuario
Uso: Prueba componentes con datos
Beneficio: Testing completo
```

## Mejores Prácticas

### 1. Configuración Realista
```
✅ Usa parámetros típicos del mercado
✅ Configura risk/reward razonable (1:2 o mejor)
✅ Limita el riesgo por trade (1-3%)
✅ Usa timeframes apropiados
```

### 2. Interpretación de Resultados
```
⚠️ Los resultados son simulados
⚠️ No garantizan rendimiento real
⚠️ Usa como referencia, no como predicción
⚠️ Valida con datos reales antes de operar
```

### 3. Experimentación
```
🔬 Prueba múltiples configuraciones
🔬 Compara diferentes estrategias
🔬 Analiza el impacto de cada parámetro
🔬 Documenta tus hallazgos
```

## Troubleshooting

### Problema: Resultados poco realistas

**Solución:**
```
1. Ajusta la volatilidad (0.01-0.03)
2. Reduce el riesgo por trade (1-2%)
3. Usa ratios risk/reward conservadores (1:2)
4. Aumenta el número de operaciones
```

### Problema: Muy pocas operaciones

**Solución:**
```
1. Reduce el threshold de detección de patrones
2. Aumenta el período de backtesting
3. Usa timeframes más cortos (1m, 5m)
4. Ajusta los parámetros de entrada
```

### Problema: Drawdown muy alto

**Solución:**
```
1. Reduce el riesgo por trade
2. Aumenta el stop loss
3. Mejora la tasa de acierto necesaria
4. Usa gestión de capital más conservadora
```

## Próximas Mejoras

Posibles mejoras futuras:

- [ ] Simular slippage y comisiones
- [ ] Agregar más tipos de patrones
- [ ] Incluir indicadores técnicos adicionales
- [ ] Simular diferentes condiciones de mercado
- [ ] Agregar backtesting multi-activo
- [ ] Exportar resultados a CSV/JSON
- [ ] Comparar múltiples estrategias
- [ ] Optimización automática de parámetros

## Recursos Adicionales

- [MODO-DEMO.md](./MODO-DEMO.md) - Documentación del modo demo general
- [EJEMPLOS-MODO-DEMO.md](./EJEMPLOS-MODO-DEMO.md) - Ejemplos de uso
- [CAMBIOS-MODO-DEMO.md](./CAMBIOS-MODO-DEMO.md) - Cambios técnicos

## Soporte

Para más información:
1. Revisa la documentación completa
2. Consulta los ejemplos de uso
3. Experimenta con diferentes configuraciones
4. Compara resultados con datos reales
