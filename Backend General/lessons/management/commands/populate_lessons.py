from django.core.management.base import BaseCommand
from lessons.models import LessonCategory, Lesson, Quiz, QuizQuestion, QuizAnswer


class Command(BaseCommand):
    help = 'Poblar la base de datos con lecciones de trading'

    def handle(self, *args, **options):
        self.stdout.write('Creando lecciones de trading...')
        
        # Crear categorías
        categories_data = [
            {
                'name': 'Fundamentos del Trading',
                'description': 'Conceptos básicos y terminología del trading',
                'order': 1,
                'icon': '📚',
                'color': '#3B82F6'
            },
            {
                'name': 'Análisis Técnico',
                'description': 'Herramientas y técnicas de análisis técnico',
                'order': 2,
                'icon': '📊',
                'color': '#10B981'
            },
            {
                'name': 'Gestión de Riesgo',
                'description': 'Estrategias para gestionar el riesgo en trading',
                'order': 3,
                'icon': '🛡️',
                'color': '#F59E0B'
            },
            {
                'name': 'Trading Algorítmico',
                'description': 'Automatización y backtesting de estrategias',
                'order': 4,
                'icon': '🤖',
                'color': '#8B5CF6'
            }
        ]
        
        categories = {}
        for cat_data in categories_data:
            category, created = LessonCategory.objects.get_or_create(
                name=cat_data['name'],
                defaults=cat_data
            )
            categories[cat_data['name']] = category
            if created:
                self.stdout.write(f'✓ Categoría creada: {category.name}')
        
        # Lecciones de Fundamentos del Trading
        fundamentos_lessons = [
            {
                'title': '¿Qué es el Trading?',
                'description': 'Introducción al mundo del trading y los mercados financieros',
                'content': '''
# ¿Qué es el Trading?

El **trading** es la compra y venta de instrumentos financieros con el objetivo de obtener beneficios a corto plazo. A diferencia de la inversión a largo plazo, el trading se centra en aprovechar las fluctuaciones de precios en períodos más cortos.

## Conceptos Clave

### 1. Mercados Financieros
Los mercados financieros son plataformas donde se negocian activos como:
- **Acciones**: Participaciones en empresas
- **Forex**: Divisas internacionales
- **Criptomonedas**: Monedas digitales como Bitcoin, Ethereum
- **Commodities**: Materias primas como oro, petróleo

### 2. Tipos de Trading
- **Day Trading**: Operaciones que se abren y cierran el mismo día
- **Swing Trading**: Operaciones que duran días o semanas
- **Scalping**: Operaciones muy rápidas, minutos o segundos
- **Position Trading**: Operaciones a largo plazo

### 3. Participantes del Mercado
- **Retail Traders**: Traders individuales
- **Institucionales**: Bancos, fondos de inversión
- **Market Makers**: Proveedores de liquidez

## Ventajas y Riesgos

### Ventajas
✅ Potencial de ganancias rápidas
✅ Flexibilidad horaria
✅ Acceso global a mercados
✅ Apalancamiento disponible

### Riesgos
⚠️ Pérdidas pueden ser significativas
⚠️ Requiere conocimiento y experiencia
⚠️ Estrés emocional
⚠️ Costos de transacción

## Conclusión
El trading puede ser una actividad lucrativa, pero requiere educación, práctica y una gestión adecuada del riesgo.
                ''',
                'difficulty': 'beginner',
                'lesson_type': 'theory',
                'duration_minutes': 15,
                'order': 1
            },
            {
                'title': 'Terminología Básica del Trading',
                'description': 'Aprende los términos más importantes que todo trader debe conocer',
                'content': '''
# Terminología Básica del Trading

## Términos Fundamentales

### Posiciones
- **Long (Compra)**: Apostar a que el precio subirá
- **Short (Venta)**: Apostar a que el precio bajará
- **Posición Abierta**: Operación activa en el mercado
- **Posición Cerrada**: Operación finalizada

### Precios
- **Bid**: Precio de compra (lo que pagan por tu activo)
- **Ask**: Precio de venta (lo que pagas por el activo)
- **Spread**: Diferencia entre Bid y Ask
- **Slippage**: Diferencia entre precio esperado y ejecutado

### Órdenes
- **Market Order**: Orden a precio de mercado (inmediata)
- **Limit Order**: Orden a precio específico
- **Stop Loss**: Orden para limitar pérdidas
- **Take Profit**: Orden para asegurar ganancias

### Análisis
- **Soporte**: Nivel donde el precio tiende a rebotar hacia arriba
- **Resistencia**: Nivel donde el precio tiende a rebotar hacia abajo
- **Tendencia**: Dirección general del precio (alcista, bajista, lateral)
- **Volatilidad**: Medida de variación del precio

### Gestión de Capital
- **Apalancamiento**: Usar capital prestado para amplificar posiciones
- **Margen**: Garantía requerida para operar con apalancamiento
- **Drawdown**: Pérdida máxima desde un pico
- **ROI**: Retorno sobre la inversión

### Indicadores Técnicos
- **Media Móvil**: Promedio del precio en un período
- **RSI**: Índice de Fuerza Relativa (sobrecompra/sobreventa)
- **MACD**: Convergencia/Divergencia de Medias Móviles
- **Bollinger Bands**: Bandas de volatilidad

## Emociones en Trading
- **FOMO**: Fear of Missing Out (miedo a perderse oportunidades)
- **FUD**: Fear, Uncertainty, Doubt (miedo, incertidumbre, duda)
- **Revenge Trading**: Operar por venganza tras pérdidas

## Consejos Importantes
1. **Nunca inviertas más de lo que puedes permitirte perder**
2. **La educación es tu mejor inversión**
3. **Practica con cuentas demo antes de usar dinero real**
4. **Mantén un diario de trading**
                ''',
                'difficulty': 'beginner',
                'lesson_type': 'theory',
                'duration_minutes': 20,
                'order': 2
            }
        ]
        
        # Lecciones de Análisis Técnico
        analisis_lessons = [
            {
                'title': 'Introducción al Análisis Técnico',
                'description': 'Fundamentos del análisis técnico y lectura de gráficos',
                'content': '''
# Introducción al Análisis Técnico

El **análisis técnico** es el estudio de los movimientos de precios pasados para predecir futuros movimientos. Se basa en la premisa de que toda la información relevante ya está reflejada en el precio.

## Principios Fundamentales

### 1. El Precio lo Descuenta Todo
- Toda la información (económica, política, psicológica) está reflejada en el precio
- No necesitas conocer las causas, solo observar el efecto en el precio

### 2. Los Precios se Mueven en Tendencias
- Las tendencias tienden a persistir más que a revertirse
- Identificar la tendencia es clave para el éxito

### 3. La Historia se Repite
- Los patrones de comportamiento humano se repiten
- Los patrones gráficos históricos tienden a repetirse

## Tipos de Gráficos

### 1. Gráfico de Líneas
- Conecta precios de cierre
- Útil para ver tendencias generales
- Menos detalle que otros tipos

### 2. Gráfico de Barras
- Muestra: Apertura, Máximo, Mínimo, Cierre (OHLC)
- Más información que el gráfico de líneas
- Permite ver la volatilidad intraperiodo

### 3. Gráfico de Velas Japonesas
- Similar a barras pero más visual
- Cuerpo: diferencia entre apertura y cierre
- Mechas: máximos y mínimos del período
- Colores: verde/blanco (alcista), rojo/negro (bajista)

## Timeframes (Marcos Temporales)

### Timeframes Comunes
- **1m, 5m, 15m**: Scalping y day trading
- **1h, 4h**: Day trading y swing trading
- **1D, 1W**: Swing trading y análisis a largo plazo

### Regla de Múltiples Timeframes
- Analiza siempre múltiples timeframes
- Timeframe mayor: tendencia general
- Timeframe menor: puntos de entrada/salida

## Conceptos Básicos

### Soporte y Resistencia
- **Soporte**: Nivel donde la demanda supera la oferta
- **Resistencia**: Nivel donde la oferta supera la demanda
- Cuando se rompen, pueden intercambiar roles

### Tendencias
- **Alcista**: Máximos y mínimos crecientes
- **Bajista**: Máximos y mínimos decrecientes
- **Lateral**: Precio se mueve en rango

### Volumen
- Confirma la fuerza de los movimientos
- Alto volumen + ruptura = movimiento más confiable
- Divergencias de volumen pueden señalar cambios

## Herramientas Básicas

### Líneas de Tendencia
- Conectan mínimos en tendencia alcista
- Conectan máximos en tendencia bajista
- Actúan como soporte/resistencia dinámicos

### Canales
- Líneas paralelas que contienen el precio
- Canal alcista: línea de tendencia + paralela superior
- Canal bajista: línea de tendencia + paralela inferior

## Próximos Pasos
En las siguientes lecciones profundizaremos en:
- Patrones de velas japonesas
- Indicadores técnicos
- Patrones gráficos
- Estrategias de trading
                ''',
                'difficulty': 'beginner',
                'lesson_type': 'theory',
                'duration_minutes': 25,
                'order': 1
            }
        ]
        
        # Lecciones de Gestión de Riesgo
        riesgo_lessons = [
            {
                'title': 'Fundamentos de la Gestión de Riesgo',
                'description': 'Aprende a proteger tu capital y gestionar el riesgo en cada operación',
                'content': '''
# Fundamentos de la Gestión de Riesgo

La **gestión de riesgo** es el aspecto más importante del trading. Puedes tener razón en el 90% de tus análisis, pero si no gestionas bien el riesgo, puedes perder todo tu capital.

## Principios Fundamentales

### 1. Preservación del Capital
- Tu objetivo principal es NO perder dinero
- Las ganancias vienen después de preservar el capital
- "No es cuánto ganas, sino cuánto no pierdes"

### 2. Regla del 1-2%
- Nunca arriesgues más del 1-2% de tu capital por operación
- Con 50 operaciones perdedoras consecutivas al 2%, aún tendrías 36% de tu capital
- Esta regla te permite sobrevivir a rachas perdedoras

### 3. Risk-Reward Ratio
- Relación entre riesgo asumido y ganancia potencial
- Mínimo recomendado: 1:2 (arriesgas $1 para ganar $2)
- Con ratio 1:2 y 40% de aciertos, eres rentable

## Herramientas de Gestión de Riesgo

### Stop Loss
- **Definición**: Orden que cierra automáticamente una posición perdedora
- **Tipos**:
  - Stop Loss fijo: Precio específico
  - Trailing Stop: Se mueve con el precio favorable
  - Stop Loss porcentual: Basado en % de pérdida

### Take Profit
- **Definición**: Orden que cierra automáticamente una posición ganadora
- **Estrategias**:
  - Take Profit fijo: Objetivo específico
  - Take Profit parcial: Cerrar parte de la posición
  - Trailing Profit: Dejar correr las ganancias

### Position Sizing (Tamaño de Posición)
```
Fórmula básica:
Tamaño = (Capital × % Riesgo) / (Precio Entrada - Stop Loss)

Ejemplo:
Capital: $10,000
Riesgo: 2% = $200
Entrada: $100
Stop Loss: $95
Diferencia: $5

Tamaño = $200 / $5 = 40 acciones
```

## Tipos de Riesgo

### 1. Riesgo de Mercado
- Movimientos adversos del precio
- **Mitigación**: Stop Loss, diversificación

### 2. Riesgo de Liquidez
- Dificultad para cerrar posiciones
- **Mitigación**: Operar activos líquidos

### 3. Riesgo de Apalancamiento
- Amplifica tanto ganancias como pérdidas
- **Mitigación**: Usar apalancamiento conservador

### 4. Riesgo Emocional
- Decisiones basadas en emociones
- **Mitigación**: Plan de trading, disciplina

## Estrategias de Gestión

### Diversificación
- No pongas todos los huevos en una canasta
- Diversifica por:
  - Activos diferentes
  - Sectores diferentes
  - Estrategias diferentes
  - Timeframes diferentes

### Correlación
- Evita activos altamente correlacionados
- Si BTC baja, muchas altcoins también bajan
- Diversificación real requiere baja correlación

### Gestión de Drawdown
- **Drawdown**: Pérdida desde el pico máximo
- Establece límite máximo de drawdown (ej: 20%)
- Si lo alcanzas, para de operar y revisa tu estrategia

## Psicología del Riesgo

### Sesgo de Pérdida
- Las pérdidas duelen más que las ganancias equivalentes
- Tendencia a mantener posiciones perdedoras demasiado tiempo
- **Solución**: Stop Loss automático

### Overconfidence
- Exceso de confianza tras rachas ganadoras
- Tendencia a aumentar el riesgo
- **Solución**: Mantener reglas consistentes

### Revenge Trading
- Operar para "recuperar" pérdidas rápidamente
- Aumenta el riesgo exponencialmente
- **Solución**: Tomar descansos tras pérdidas

## Plan de Gestión de Riesgo

### Antes de Cada Operación
1. ¿Cuánto estoy dispuesto a perder?
2. ¿Dónde pondré el Stop Loss?
3. ¿Cuál es mi objetivo de ganancia?
4. ¿El ratio riesgo/beneficio es favorable?
5. ¿Qué tamaño de posición usaré?

### Durante la Operación
1. Respetar el Stop Loss
2. No mover el Stop Loss en contra
3. Considerar Take Profit parcial
4. Monitorear sin sobre-operar

### Después de la Operación
1. Registrar en diario de trading
2. Analizar qué funcionó/no funcionó
3. Ajustar estrategia si es necesario
4. Mantener disciplina emocional

## Conclusión
La gestión de riesgo no es opcional, es obligatoria. Los traders exitosos no son los que nunca pierden, sino los que saben cómo perder poco y ganar mucho.
                ''',
                'difficulty': 'intermediate',
                'lesson_type': 'theory',
                'duration_minutes': 30,
                'order': 1
            }
        ]
        
        # Lecciones de Trading Algorítmico
        algoritmo_lessons = [
            {
                'title': 'Introducción al Trading Algorítmico',
                'description': 'Conceptos básicos del trading automatizado y backtesting',
                'content': '''
# Introducción al Trading Algorítmico

El **trading algorítmico** es la ejecución de operaciones mediante programas informáticos que siguen reglas predefinidas. Elimina las emociones y permite operar 24/7.

## ¿Qué es el Trading Algorítmico?

### Definición
- Uso de algoritmos para tomar decisiones de trading
- Ejecución automática basada en reglas específicas
- Eliminación del factor emocional humano

### Ventajas
✅ **Velocidad**: Ejecución instantánea de órdenes
✅ **Precisión**: Sin errores humanos de cálculo
✅ **Disciplina**: Sigue el plan sin desviaciones
✅ **Backtesting**: Prueba estrategias con datos históricos
✅ **24/7**: Opera continuamente en mercados globales

### Desventajas
❌ **Complejidad técnica**: Requiere conocimientos de programación
❌ **Fallos técnicos**: Errores de código o conectividad
❌ **Sobreoptimización**: Estrategias que solo funcionan en el pasado
❌ **Costos**: Desarrollo, mantenimiento, infraestructura

## Componentes de un Sistema Algorítmico

### 1. Fuente de Datos
- **Datos en tiempo real**: Precios, volumen, orderbook
- **Datos históricos**: Para backtesting y desarrollo
- **Datos fundamentales**: Noticias, eventos económicos
- **APIs**: Binance, Coinbase, Alpha Vantage

### 2. Señales de Trading
- **Técnicas**: Basadas en indicadores y patrones
- **Fundamentales**: Basadas en noticias y eventos
- **Cuantitativas**: Modelos matemáticos complejos
- **Machine Learning**: Algoritmos de aprendizaje automático

### 3. Gestión de Riesgo
- **Position Sizing**: Cálculo automático del tamaño
- **Stop Loss**: Órdenes automáticas de protección
- **Diversificación**: Distribución automática del riesgo
- **Límites**: Máximo drawdown, exposición por activo

### 4. Ejecución de Órdenes
- **Market Orders**: Ejecución inmediata
- **Limit Orders**: Ejecución a precio específico
- **Algoritmos de ejecución**: TWAP, VWAP, Iceberg
- **Slippage Control**: Minimización de costos

## Tipos de Estrategias Algorítmicas

### 1. Trend Following
- Sigue la dirección de la tendencia
- Indicadores: Moving Averages, MACD, ADX
- Funciona bien en mercados con tendencia clara

### 2. Mean Reversion
- Asume que los precios vuelven a la media
- Indicadores: RSI, Bollinger Bands, Z-Score
- Funciona bien en mercados laterales

### 3. Arbitraje
- Explota diferencias de precio entre mercados
- Tipos: Espacial, temporal, estadístico
- Requiere ejecución muy rápida

### 4. Market Making
- Proporciona liquidez comprando y vendiendo
- Gana del spread bid-ask
- Requiere capital significativo

## Backtesting

### ¿Qué es el Backtesting?
- Prueba de estrategias con datos históricos
- Simula cómo habría funcionado la estrategia en el pasado
- Herramienta fundamental para validar ideas

### Métricas Importantes
- **Retorno Total**: Ganancia/pérdida total
- **Sharpe Ratio**: Retorno ajustado por riesgo
- **Maximum Drawdown**: Pérdida máxima
- **Win Rate**: Porcentaje de operaciones ganadoras
- **Profit Factor**: Ganancias totales / Pérdidas totales

### Errores Comunes
- **Look-ahead Bias**: Usar información futura
- **Survivorship Bias**: Solo considerar activos exitosos
- **Overfitting**: Optimizar demasiado para datos históricos
- **Transaction Costs**: No considerar comisiones y slippage

## Herramientas y Plataformas

### Lenguajes de Programación
- **Python**: Pandas, NumPy, Backtrader, Zipline
- **R**: quantmod, PerformanceAnalytics
- **C++**: Para estrategias de alta frecuencia
- **JavaScript**: Para aplicaciones web

### Plataformas de Backtesting
- **Backtrader**: Framework Python gratuito
- **QuantConnect**: Plataforma cloud
- **TradingView**: Pine Script
- **MetaTrader**: MQL4/MQL5

### APIs de Datos
- **Binance API**: Criptomonedas
- **Alpha Vantage**: Acciones y forex
- **Yahoo Finance**: Datos gratuitos
- **Quandl**: Datos financieros diversos

## Desarrollo de una Estrategia Simple

### Estrategia: Cruce de Medias Móviles
```python
# Pseudocódigo
if MA_corta > MA_larga and posicion != "long":
    cerrar_posicion_short()
    abrir_posicion_long()
elif MA_corta < MA_larga and posicion != "short":
    cerrar_posicion_long()
    abrir_posicion_short()
```

### Pasos de Desarrollo
1. **Idea**: Definir la hipótesis de trading
2. **Reglas**: Especificar condiciones de entrada/salida
3. **Código**: Implementar la lógica
4. **Backtest**: Probar con datos históricos
5. **Optimización**: Ajustar parámetros
6. **Validación**: Probar en datos fuera de muestra
7. **Paper Trading**: Probar en tiempo real sin dinero
8. **Live Trading**: Implementar con capital real

## Consideraciones Importantes

### Riesgos Técnicos
- **Bugs en el código**: Pueden causar pérdidas significativas
- **Fallos de conectividad**: Pérdida de conexión con el broker
- **Latencia**: Retrasos en la ejecución
- **Datos erróneos**: Información incorrecta puede generar señales falsas

### Mejores Prácticas
- **Testing exhaustivo**: Probar en múltiples escenarios
- **Monitoreo constante**: Supervisar el sistema en vivo
- **Logs detallados**: Registrar todas las operaciones
- **Backup systems**: Sistemas de respaldo
- **Kill switches**: Mecanismos de parada de emergencia

## Conclusión
El trading algorítmico ofrece ventajas significativas pero requiere conocimientos técnicos sólidos. La clave está en desarrollar, probar y monitorear cuidadosamente las estrategias.
                ''',
                'difficulty': 'advanced',
                'lesson_type': 'theory',
                'duration_minutes': 35,
                'order': 1
            }
        ]
        
        # Crear lecciones
        all_lessons = [
            (categories['Fundamentos del Trading'], fundamentos_lessons),
            (categories['Análisis Técnico'], analisis_lessons),
            (categories['Gestión de Riesgo'], riesgo_lessons),
            (categories['Trading Algorítmico'], algoritmo_lessons)
        ]
        
        for category, lessons in all_lessons:
            for lesson_data in lessons:
                lesson, created = Lesson.objects.get_or_create(
                    category=category,
                    title=lesson_data['title'],
                    defaults=lesson_data
                )
                if created:
                    self.stdout.write(f'✓ Lección creada: {lesson.title}')
                    
                    # Crear quiz para algunas lecciones
                    if 'Terminología' in lesson.title:
                        self.create_terminology_quiz(lesson)
                    elif 'Gestión de Riesgo' in lesson.title:
                        self.create_risk_management_quiz(lesson)
        
        self.stdout.write(self.style.SUCCESS('¡Lecciones creadas exitosamente!'))
    
    def create_terminology_quiz(self, lesson):
        """Crear quiz de terminología"""
        quiz = Quiz.objects.create(
            lesson=lesson,
            title='Quiz: Terminología Básica',
            description='Evalúa tu conocimiento de los términos básicos del trading',
            passing_score=70.0,
            time_limit_minutes=10
        )
        
        # Pregunta 1
        q1 = QuizQuestion.objects.create(
            quiz=quiz,
            question_text='¿Qué significa "Long" en trading?',
            question_type='multiple_choice',
            points=1.0,
            order=1
        )
        QuizAnswer.objects.create(question=q1, answer_text='Apostar a que el precio bajará', is_correct=False, order=1)
        QuizAnswer.objects.create(question=q1, answer_text='Apostar a que el precio subirá', is_correct=True, order=2)
        QuizAnswer.objects.create(question=q1, answer_text='Mantener una posición por mucho tiempo', is_correct=False, order=3)
        
        # Pregunta 2
        q2 = QuizQuestion.objects.create(
            quiz=quiz,
            question_text='¿Qué es el "Spread"?',
            question_type='multiple_choice',
            points=1.0,
            order=2
        )
        QuizAnswer.objects.create(question=q2, answer_text='La diferencia entre Bid y Ask', is_correct=True, order=1)
        QuizAnswer.objects.create(question=q2, answer_text='El apalancamiento máximo', is_correct=False, order=2)
        QuizAnswer.objects.create(question=q2, answer_text='La volatilidad del mercado', is_correct=False, order=3)
        
        self.stdout.write(f'✓ Quiz creado para: {lesson.title}')
    
    def create_risk_management_quiz(self, lesson):
        """Crear quiz de gestión de riesgo"""
        quiz = Quiz.objects.create(
            lesson=lesson,
            title='Quiz: Gestión de Riesgo',
            description='Evalúa tu comprensión de la gestión de riesgo',
            passing_score=80.0,
            time_limit_minutes=15
        )
        
        # Pregunta 1
        q1 = QuizQuestion.objects.create(
            quiz=quiz,
            question_text='¿Cuál es la regla recomendada para el riesgo por operación?',
            question_type='multiple_choice',
            points=1.0,
            order=1
        )
        QuizAnswer.objects.create(question=q1, answer_text='5-10% del capital', is_correct=False, order=1)
        QuizAnswer.objects.create(question=q1, answer_text='1-2% del capital', is_correct=True, order=2)
        QuizAnswer.objects.create(question=q1, answer_text='10-20% del capital', is_correct=False, order=3)
        
        # Pregunta 2
        q2 = QuizQuestion.objects.create(
            quiz=quiz,
            question_text='¿Qué es un Stop Loss?',
            question_type='multiple_choice',
            points=1.0,
            order=2
        )
        QuizAnswer.objects.create(question=q2, answer_text='Una orden para asegurar ganancias', is_correct=False, order=1)
        QuizAnswer.objects.create(question=q2, answer_text='Una orden para limitar pérdidas', is_correct=True, order=2)
        QuizAnswer.objects.create(question=q2, answer_text='Una orden de compra a precio específico', is_correct=False, order=3)
        
        self.stdout.write(f'✓ Quiz creado para: {lesson.title}')