# 🎓 Guía Visual - Academia de Trading

## 📱 Flujo de Usuario

```
┌─────────────────────────────────────────────────────────────┐
│                    DASHBOARD PRINCIPAL                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  📚 Academia de Trading                                │  │
│  │  Aprende desde cero hasta nivel avanzado              │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  📊 Tu Progreso                                        │  │
│  │  ├─ 45.5% Completado                                   │  │
│  │  ├─ 5 Lecciones Completadas                           │  │
│  │  ├─ 2h 15m Tiempo Invertido                           │  │
│  │  └─ 2 Módulos Completados                             │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ 📚 Fundamentos   │  │ 📊 Análisis      │               │
│  │ del Trading      │  │ Técnico          │               │
│  │                  │  │                  │               │
│  │ 2 lecciones      │  │ 1 lección        │               │
│  │ ████████░░ 80%   │  │ ████░░░░░░ 40%   │               │
│  └──────────────────┘  └──────────────────┘               │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐               │
│  │ 🛡️ Gestión de    │  │ 🤖 Trading       │               │
│  │ Riesgo           │  │ Algorítmico      │               │
│  │                  │  │                  │               │
│  │ 1 lección        │  │ 1 lección        │               │
│  │ ██████████ 100%  │  │ ░░░░░░░░░░ 0%    │               │
│  └──────────────────┘  └──────────────────┘               │
└─────────────────────────────────────────────────────────────┘
                            ↓ Click en categoría
┌─────────────────────────────────────────────────────────────┐
│              LECCIONES DE LA CATEGORÍA                       │
│  ← Volver a la Academia                                     │
│                                                              │
│  📚 Fundamentos del Trading                                 │
│  2 lecciones • 1 completada                                 │
│  ████████████████████░░░░░░░░░░░░ 50%                      │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ ✅ 01  ¿Qué es el Trading?                            │  │
│  │        📖 Teoría • ⏱️ 15 min • 🟢 Principiante        │  │
│  │        Introducción al mundo del trading...           │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 🔵 02  Terminología Básica del Trading                │  │
│  │        📝 Quiz • ⏱️ 20 min • 🟢 Principiante          │  │
│  │        Aprende los términos más importantes...        │  │
│  │        ████████░░░░░░░░░░░░░░░░░░░░ 40% completado    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓ Click en lección
┌─────────────────────────────────────────────────────────────┐
│                    VISOR DE LECCIÓN                          │
│  ← Volver                                                   │
│                                                              │
│  📚 ¿Qué es el Trading?                                     │
│  Fundamentos del Trading                                    │
│                                                              │
│  ⏱️ 05:23                    ~15 min                        │
│  ████████████████████████████████████░░░░░░░░ 75%          │
│  Progreso: 75% • En progreso                                │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                                                        │  │
│  │  # ¿Qué es el Trading?                                │  │
│  │                                                        │  │
│  │  El **trading** es la compra y venta de instrumentos  │  │
│  │  financieros con el objetivo de obtener beneficios... │  │
│  │                                                        │  │
│  │  ## Conceptos Clave                                   │  │
│  │                                                        │  │
│  │  ### 1. Mercados Financieros                          │  │
│  │  Los mercados financieros son plataformas donde...    │  │
│  │                                                        │  │
│  │  [... contenido de la lección ...]                    │  │
│  │                                                        │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  [→ Continuar]              [✓ Completar Lección]          │
└─────────────────────────────────────────────────────────────┘
```

## 🎨 Paleta de Colores

```css
/* Fondo principal */
background: linear-gradient(to bottom right, 
  #0f172a,  /* slate-900 */
  #581c87,  /* purple-900 */
  #0f172a   /* slate-900 */
);

/* Cards */
background: rgba(255, 255, 255, 0.1);
backdrop-filter: blur(16px);
border: 1px solid rgba(255, 255, 255, 0.2);

/* Hover en cards */
border-color: rgba(168, 85, 247, 0.5); /* purple-400 */

/* Colores de categorías */
Fundamentos:  #3B82F6  /* blue-500 */
Análisis:     #10B981  /* green-500 */
Riesgo:       #F59E0B  /* amber-500 */
Algorítmico:  #8B5CF6  /* violet-500 */

/* Dificultad */
Principiante: #10B981  /* green-400 */
Intermedio:   #F59E0B  /* yellow-400 */
Avanzado:     #EF4444  /* red-400 */

/* Estados */
Completado:   #10B981  /* green-400 */
En Progreso:  #3B82F6  /* blue-400 */
No Iniciado:  #6B7280  /* gray-400 */
```

## 🔌 Arquitectura de Conexión

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  AcademyComplete.tsx (Componente Principal)          │   │
│  │  ├─ Estado: categories, userProgress, lessons        │   │
│  │  ├─ Vistas: dashboard, category, lesson              │   │
│  │  └─ Navegación: handleTabChange, handleLessonClick   │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓ usa                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  useAcademyApi.ts (Hooks Personalizados)            │   │
│  │  ├─ useAcademyCategories()                           │   │
│  │  ├─ useUserProgress()                                │   │
│  │  └─ useCategoryLessons()                             │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓ llama                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Fetch API con Authorization Bearer Token           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTP Request
┌─────────────────────────────────────────────────────────────┐
│                         BACKEND                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  lessons/urls.py (Rutas)                             │   │
│  │  ├─ /api/lessons/categories/                         │   │
│  │  ├─ /api/lessons/categories/{id}/lessons/            │   │
│  │  ├─ /api/lessons/lessons/{id}/                       │   │
│  │  ├─ /api/lessons/lessons/{id}/start/                 │   │
│  │  ├─ /api/lessons/lessons/{id}/progress/              │   │
│  │  ├─ /api/lessons/quizzes/{id}/submit/                │   │
│  │  └─ /api/lessons/progress/summary/                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓ procesa                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  lessons/views.py (Vistas)                           │   │
│  │  ├─ LessonCategoryListView                           │   │
│  │  ├─ LessonsByCategoryView                            │   │
│  │  ├─ LessonDetailView                                 │   │
│  │  ├─ start_lesson()                                   │   │
│  │  ├─ update_lesson_progress()                         │   │
│  │  ├─ submit_quiz()                                    │   │
│  │  └─ user_progress_summary()                          │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓ usa                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  lessons/serializers.py (Serializadores)            │   │
│  │  ├─ LessonCategorySerializer                         │   │
│  │  ├─ LessonSerializer                                 │   │
│  │  ├─ LessonProgressSerializer                         │   │
│  │  ├─ QuizSerializer                                   │   │
│  │  └─ UserQuizAttemptSerializer                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓ accede                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  lessons/models.py (Modelos)                         │   │
│  │  ├─ LessonCategory                                   │   │
│  │  ├─ Lesson                                           │   │
│  │  ├─ LessonProgress                                   │   │
│  │  ├─ Quiz                                             │   │
│  │  ├─ QuizQuestion                                     │   │
│  │  ├─ QuizAnswer                                       │   │
│  │  └─ UserQuizAttempt                                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓ guarda en                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  PostgreSQL / SQLite Database                        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Modelo de Datos

```
┌─────────────────────┐
│  LessonCategory     │
├─────────────────────┤
│ id                  │
│ name                │
│ description         │
│ order               │
│ icon                │
│ color               │
└─────────────────────┘
          │
          │ 1:N
          ↓
┌─────────────────────┐
│  Lesson             │
├─────────────────────┤
│ id                  │
│ category_id         │◄─────┐
│ title               │      │
│ description         │      │
│ content             │      │
│ difficulty          │      │
│ lesson_type         │      │
│ duration_minutes    │      │
│ order               │      │
│ is_active           │      │
└─────────────────────┘      │
          │                  │
          │ 1:N              │
          ↓                  │
┌─────────────────────┐      │
│  LessonProgress     │      │
├─────────────────────┤      │
│ id                  │      │
│ user_id             │      │
│ lesson_id           │──────┘
│ status              │
│ progress_percentage │
│ time_spent_minutes  │
│ score               │
│ started_at          │
│ completed_at        │
└─────────────────────┘

┌─────────────────────┐
│  Quiz               │
├─────────────────────┤
│ id                  │
│ lesson_id           │◄─────┐
│ title               │      │
│ description         │      │
│ passing_score       │      │
│ time_limit_minutes  │      │
└─────────────────────┘      │
          │                  │
          │ 1:N              │
          ↓                  │
┌─────────────────────┐      │
│  QuizQuestion       │      │
├─────────────────────┤      │
│ id                  │      │
│ quiz_id             │──────┘
│ question_text       │
│ question_type       │
│ points              │
│ order               │
└─────────────────────┘
          │
          │ 1:N
          ↓
┌─────────────────────┐
│  QuizAnswer         │
├─────────────────────┤
│ id                  │
│ question_id         │
│ answer_text         │
│ is_correct          │
│ order               │
└─────────────────────┘

┌─────────────────────┐
│  UserQuizAttempt    │
├─────────────────────┤
│ id                  │
│ user_id             │
│ quiz_id             │
│ score               │
│ max_score           │
│ percentage          │
│ passed              │
│ time_taken_minutes  │
│ started_at          │
│ completed_at        │
└─────────────────────┘
```

## 🚀 Comandos Útiles

```bash
# Poblar lecciones
python manage.py populate_lessons

# Crear migraciones
python manage.py makemigrations lessons

# Aplicar migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Acceder al admin
http://localhost:8000/admin/

# Ver lecciones en el admin
http://localhost:8000/admin/lessons/

# Iniciar servidor
python manage.py runserver

# Iniciar frontend
cd frontent_oficial
npm run dev
```

## 📱 Responsive Design

```
┌─────────────────────────────────────────┐
│  MÓVIL (< 768px)                        │
│  ┌───────────────────────────────────┐  │
│  │  [☰] CriptoSelf          [👤]    │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  📚 Academia de Trading           │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  📊 Tu Progreso                   │  │
│  │  45.5% • 5 lecciones              │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  📚 Fundamentos del Trading       │  │
│  │  2 lecciones • 80%                │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  📊 Análisis Técnico              │  │
│  │  1 lección • 40%                  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  DESKTOP (> 1024px)                                         │
│  ┌─────────────┬─────────────────────────────────────────┐  │
│  │  Sidebar    │  Header                                 │  │
│  │             │  📚 Academia de Trading                 │  │
│  │  📚 Mis     ├─────────────────────────────────────────┤  │
│  │  Estrategias│                                         │  │
│  │             │  ┌──────────────────────────────────┐   │  │
│  │  📈 Trading │  │  📊 Tu Progreso                  │   │  │
│  │             │  │  45.5% • 5 lecciones • 2h 15m    │   │  │
│  │  📊 Actividad│  └──────────────────────────────────┘   │  │
│  │             │                                         │  │
│  │  📚 Academia│  ┌──────────┐  ┌──────────┐           │  │
│  │             │  │ 📚 Fund. │  │ 📊 Anál. │           │  │
│  │  ⚙️ Config  │  │ Trading  │  │ Técnico  │           │  │
│  │             │  │ 80%      │  │ 40%      │           │  │
│  │             │  └──────────┘  └──────────┘           │  │
│  │  [👤] User  │                                         │  │
│  │  [🚪] Logout│  ┌──────────┐  ┌──────────┐           │  │
│  │             │  │ 🛡️ Riesgo│  │ 🤖 Algo. │           │  │
│  │             │  │ 100%     │  │ 0%       │           │  │
│  │             │  └──────────┘  └──────────┘           │  │
│  └─────────────┴─────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## ✨ Características Destacadas

### 1. Manejo de Errores Inteligente
- ✅ No redirige automáticamente en errores 401
- ✅ Muestra mensajes de error informativos
- ✅ Datos de fallback para mejor UX
- ✅ Retry automático en fallos de red

### 2. Progreso en Tiempo Real
- ✅ Temporizador que cuenta el tiempo invertido
- ✅ Actualización automática cada 30 segundos
- ✅ Barra de progreso animada
- ✅ Sincronización con el backend

### 3. Sistema de Quizzes
- ✅ Preguntas de opción múltiple
- ✅ Puntuación automática
- ✅ Feedback inmediato
- ✅ Múltiples intentos permitidos
- ✅ Historial de intentos

### 4. Navegación Fluida
- ✅ Transiciones suaves entre vistas
- ✅ Estado persistente
- ✅ Breadcrumbs claros
- ✅ Botones de retroceso intuitivos

### 5. Diseño Consistente
- ✅ Mismos colores que el resto de la app
- ✅ Mismos componentes UI
- ✅ Mismas animaciones
- ✅ Mismo sistema de temas (dark/light)

## 🎯 Conclusión

La academia está **completamente integrada** con tu aplicación de trading:

✅ **Backend**: API REST completa con Django
✅ **Frontend**: Componentes React con TypeScript
✅ **Diseño**: Estilos consistentes con la app
✅ **Contenido**: 5 lecciones educativas completas
✅ **Funcionalidad**: Progreso, quizzes, navegación
✅ **UX**: Responsive, intuitivo, con feedback visual

**¡Todo listo para usar!** 🚀
