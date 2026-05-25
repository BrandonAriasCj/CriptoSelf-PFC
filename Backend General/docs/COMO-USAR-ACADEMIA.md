# 📚 Cómo Usar la Academia de Trading

## 🎯 Resumen Rápido

Tu academia de trading está **100% funcional** y conectada entre frontend y backend. Aquí te explico cómo usarla:

## ✅ Estado Actual

```
✅ Backend Django configurado
✅ 4 categorías de lecciones creadas
✅ 5 lecciones completas con contenido
✅ 2 quizzes funcionales
✅ API REST completa
✅ Frontend React conectado
✅ Estilos consistentes con tu app
✅ Sistema de progreso funcionando
```

## 🚀 Acceso Rápido

### 1. Desde la Aplicación
1. Inicia sesión en tu aplicación
2. Click en el menú lateral: **"Academia"** (icono 📚)
3. Verás el dashboard con todas las categorías

### 2. URL Directa
```
http://localhost:5173/education
```

## 📖 Navegación

### Dashboard Principal
```
Academia de Trading
├─ Tu Progreso (estadísticas globales)
├─ 📚 Fundamentos del Trading (2 lecciones)
├─ 📊 Análisis Técnico (1 lección)
├─ 🛡️ Gestión de Riesgo (1 lección)
└─ 🤖 Trading Algorítmico (1 lección)
```

### Flujo de Uso
1. **Dashboard** → Click en una categoría
2. **Lista de Lecciones** → Click en una lección
3. **Visor de Lección** → Lee el contenido
4. **Progreso** → Se actualiza automáticamente
5. **Quiz** (si disponible) → Completa la evaluación

## 📝 Contenido Disponible

### Módulo 1: Fundamentos del Trading 📚
**Lección 1: ¿Qué es el Trading?** (15 min)
- Conceptos clave del trading
- Tipos de trading (Day, Swing, Scalping)
- Mercados financieros
- Ventajas y riesgos

**Lección 2: Terminología Básica** (20 min) + Quiz
- Posiciones (Long/Short)
- Órdenes (Market/Limit/Stop Loss)
- Análisis (Soporte/Resistencia)
- Gestión de capital
- **Quiz de 2 preguntas**

### Módulo 2: Análisis Técnico 📊
**Lección 3: Introducción al Análisis Técnico** (25 min)
- Principios fundamentales
- Tipos de gráficos (Líneas, Barras, Velas)
- Timeframes
- Soporte y resistencia
- Tendencias y volumen

### Módulo 3: Gestión de Riesgo 🛡️
**Lección 4: Fundamentos de la Gestión de Riesgo** (30 min) + Quiz
- Regla del 1-2%
- Risk-Reward Ratio
- Stop Loss y Take Profit
- Position Sizing
- Psicología del riesgo
- **Quiz de 2 preguntas**

### Módulo 4: Trading Algorítmico 🤖
**Lección 5: Introducción al Trading Algorítmico** (35 min)
- Componentes de un sistema algorítmico
- Tipos de estrategias
- Backtesting
- Herramientas y plataformas
- Desarrollo de estrategias

## 🎮 Características Interactivas

### Temporizador en Tiempo Real
- ⏱️ Cuenta el tiempo que pasas en cada lección
- ⏸️ Pausa/Reanuda con un click
- 📊 Se guarda automáticamente

### Barra de Progreso
- 📈 Actualización en tiempo real
- 🎯 Progreso por lección (0-100%)
- 📊 Progreso por categoría
- 🏆 Progreso global

### Sistema de Quizzes
- ❓ Preguntas de opción múltiple
- ✅ Respuestas correctas/incorrectas
- 📊 Puntuación automática
- 🔄 Múltiples intentos permitidos
- 📈 Historial de intentos

### Estados Visuales
- ⚪ No iniciado (círculo vacío)
- 🔵 En progreso (círculo con punto azul)
- ✅ Completado (check verde)

## 🎨 Diseño Visual

### Colores por Categoría
- 📚 Fundamentos: Azul (#3B82F6)
- 📊 Análisis: Verde (#10B981)
- 🛡️ Riesgo: Ámbar (#F59E0B)
- 🤖 Algorítmico: Violeta (#8B5CF6)

### Niveles de Dificultad
- 🟢 Principiante (verde)
- 🟡 Intermedio (amarillo)
- 🔴 Avanzado (rojo)

### Tipos de Lección
- 📖 Teoría
- 📊 Práctica
- 📝 Quiz
- 🎮 Simulación

## 🔧 Comandos de Administración

### Ver Estadísticas
```bash
python manage.py shell -c "from lessons.models import *; print(f'Categorías: {LessonCategory.objects.count()}'); print(f'Lecciones: {Lesson.objects.count()}'); print(f'Quizzes: {Quiz.objects.count()}')"
```

### Repoblar Lecciones
```bash
python manage.py populate_lessons
```

### Acceder al Admin
```bash
# Navegar a:
http://localhost:8000/admin/lessons/

# Puedes editar:
- Categorías
- Lecciones
- Quizzes
- Preguntas y respuestas
- Ver progreso de usuarios
```

## 📊 API Endpoints

### Públicos (sin autenticación)
```bash
# Listar categorías
GET /api/lessons/categories/

# Lecciones por categoría
GET /api/lessons/categories/1/lessons/

# Detalle de lección
GET /api/lessons/lessons/1/
```

### Protegidos (requieren autenticación)
```bash
# Iniciar lección
POST /api/lessons/lessons/1/start/

# Actualizar progreso
POST /api/lessons/lessons/1/progress/
Body: {
  "progress_percentage": 50,
  "time_spent_minutes": 10
}

# Enviar quiz
POST /api/lessons/quizzes/1/submit/
Body: {
  "answers": {
    "1": [2],  # question_id: [answer_id]
    "2": [1]
  },
  "time_taken_minutes": 5
}

# Resumen de progreso
GET /api/lessons/progress/summary/

# Recomendaciones
GET /api/lessons/recommendations/
```

## 🎯 Próximos Pasos Sugeridos

### Contenido
1. ✏️ Agregar más lecciones a cada categoría
2. 📹 Incluir videos educativos
3. 🖼️ Agregar imágenes y gráficos
4. 📝 Crear más quizzes

### Funcionalidades
1. 🏆 Sistema de badges y logros
2. 📜 Certificados al completar módulos
3. 💬 Foro de discusión
4. 🎮 Simulador de trading integrado

### Mejoras UX
1. 📱 Optimizar para móvil
2. 🔔 Notificaciones de progreso
3. 📊 Dashboard de estadísticas avanzado
4. 🎨 Temas personalizables

## 🐛 Solución de Problemas

### No veo las lecciones
```bash
# Verificar que existen en la BD
python manage.py shell -c "from lessons.models import Lesson; print(Lesson.objects.count())"

# Si es 0, repoblar:
python manage.py populate_lessons
```

### Error 401 en la API
- Verifica que estés autenticado
- Revisa que el token sea válido
- Los endpoints de categorías y lecciones son públicos

### El progreso no se guarda
- Verifica la conexión con el backend
- Revisa la consola del navegador para errores
- Asegúrate de estar autenticado

### Estilos no se ven bien
- Verifica que Tailwind CSS esté configurado
- Revisa que los archivos CSS estén importados
- Limpia la caché del navegador

## 📞 Soporte

Si tienes problemas:
1. Revisa la consola del navegador (F12)
2. Revisa los logs del servidor Django
3. Verifica que ambos servidores estén corriendo:
   - Backend: `python manage.py runserver`
   - Frontend: `npm run dev`

## ✨ Conclusión

Tu academia está **lista para usar**. El sistema:

✅ Conecta frontend con backend perfectamente
✅ Maneja autenticación de forma segura
✅ Proporciona feedback visual excelente
✅ Incluye contenido educativo valioso
✅ Rastrea progreso del usuario
✅ Mantiene estilos consistentes

**¡Disfruta aprendiendo trading!** 🚀📚

---

**Última actualización**: Noviembre 2024
**Versión**: 1.0.0
**Estado**: Producción Ready ✅
