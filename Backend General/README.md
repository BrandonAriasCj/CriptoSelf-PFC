# 🚀 CriptoSelf - Plataforma de Simulacion de inversion y trading en criptomonedas

Una plataforma completa de trading algorítmico con autenticación avanzada, construida con Django REST Framework y React + Vite.

## ⚡ Inicio Rápido

### Windows
```bash
# Doble clic o ejecutar:
start-dev.bat
```

### Linux/Mac
```bash
chmod +x start-dev.sh
./start-dev.sh
```

### Multiplataforma
```bash
node start-dev.js
```

## 🌐 URLs de Desarrollo
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000  
- **Admin**: http://localhost:8000/admin

## Características

### 🔐 Sistema de Autenticación
- Autenticación OAuth2 con Django OAuth Toolkit
- Autenticación social (Google, GitHub) con Django Allauth
- Modelo de usuario personalizado con perfiles extendidos
- Gestión de tokens con scopes granulares
- Verificación de email y recuperación de contraseña

### 📊 API y Funcionalidades
- API REST con Django REST Framework
- Sistema de backtesting con Backtrader
- Modelo de tareas (Task) con operaciones CRUD
- Panel de administración personalizado
- Configuración con variables de entorno
- Base de datos SQLite (configurable)

## Instalación

1. Crear un entorno virtual:
```bash
python -m venv venv
```

2. Activar el entorno virtual:
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

3. Instalar dependencias:
```bash
pip install -r requirements.txt
```

4. Configurar variables de entorno:
```bash
cp .env.example .env
```

5. Ejecutar migraciones:
```bash
python manage.py makemigrations users
python manage.py makemigrations
python manage.py migrate
```

6. Crear aplicación OAuth2:
```bash
python manage.py create_oauth_app --name "Mi App Frontend"
```

7. Crear superusuario:
```bash
python manage.py createsuperuser
```

8. Ejecutar el servidor:
```bash
python manage.py runserver
```

## Endpoints de la API

### 🔐 Autenticación
- `POST /api/auth/register/` - Registro de usuarios
- `POST /api/auth/token/` - Obtener token OAuth2
- `GET /api/auth/profile/` - Ver/editar perfil de usuario
- `POST /api/auth/change-password/` - Cambiar contraseña
- `POST /api/auth/logout/` - Cerrar sesión
- `GET /api/auth/user-info/` - Información del usuario

### 📊 Backtesting
- `GET /api/backtesting/run-demo/` - Ejecutar demo de backtesting
- `POST /api/backtesting/run-custom/` - Backtesting personalizado
- `GET /api/backtesting/strategy-info/` - Información de estrategias

### 🎓 Academia de Trading
- `GET /api/lessons/categories/` - Lista de categorías de lecciones
- `GET /api/lessons/categories/{id}/lessons/` - Lecciones por categoría
- `GET /api/lessons/lessons/{id}/` - Detalle de lección específica
- `POST /api/lessons/lessons/{id}/start/` - Iniciar una lección
- `POST /api/lessons/lessons/{id}/progress/` - Actualizar progreso
- `POST /api/lessons/quizzes/{id}/submit/` - Enviar respuestas de quiz
- `GET /api/lessons/progress/summary/` - Resumen de progreso del usuario
- `GET /api/lessons/recommendations/` - Lecciones recomendadas

### 📝 Tareas
- `GET /api/health/` - Verificar estado de la API
- `GET /api/tasks/` - Listar todas las tareas
- `POST /api/tasks/` - Crear nueva tarea
- `GET /api/tasks/{id}/` - Obtener tarea específica
- `PUT /api/tasks/{id}/` - Actualizar tarea completa
- `PATCH /api/tasks/{id}/` - Actualizar tarea parcialmente
- `DELETE /api/tasks/{id}/` - Eliminar tarea

### 🌐 Autenticación Social
- `/accounts/google/login/` - Login con Google
- `/accounts/github/login/` - Login con GitHub

## Panel de Administración

Accede al panel de administración en: `http://localhost:8000/admin/`

## Estructura del Proyecto

```
<<<<<<< HEAD
trading-simulator/
├── backend/                    # Configuración principal Django
│   ├── settings.py            # Configuraciones del proyecto
│   ├── urls.py               # URLs principales
│   └── wsgi.py               # WSGI para deployment
├── api/                       # API REST principal
│   ├── models.py             # Modelos de datos
│   ├── views.py              # Vistas de la API
│   ├── serializers.py        # Serializadores DRF
│   └── urls.py               # URLs de la API
├── authentication/            # Sistema de autenticación
│   ├── views.py              # Vistas de auth
│   ├── permissions.py        # Permisos personalizados
│   └── urls.py               # URLs de autenticación
├── backtesting/              # Motor de backtesting
│   ├── models.py             # Modelos de estrategias
│   ├── views.py              # Vistas de backtesting
│   ├── custom_strategy.py    # Estrategias personalizadas
│   └── demo.py               # Demo de backtesting
├── lessons/                  # Sistema académico
│   ├── models.py             # Modelos de lecciones y quizzes
│   ├── views.py              # API de la academia
│   ├── serializers.py        # Serializadores de lecciones
│   ├── admin.py              # Panel de administración
│   └── management/commands/  # Comandos para poblar contenido
├── users/                    # Gestión de usuarios
│   ├── models.py             # Modelo de usuario personalizado
│   └── serializers.py        # Serializadores de usuario
├── frontent_oficial/         # Frontend React + Vite
│   ├── src/
│   │   ├── components/       # Componentes React
│   │   ├── pages/           # Páginas principales
│   │   │   ├── Academy.tsx  # Página principal de la academia
│   │   │   ├── CategoryLessons.tsx # Lecciones por categoría
│   │   │   └── LessonDetail.tsx    # Detalle de lección individual
│   │   ├── contexts/        # Contextos React
│   │   ├── services/        # Servicios API
│   │   └── styles/          # Estilos CSS
│   ├── package.json         # Dependencias Node.js
│   └── vite.config.ts       # Configuración Vite
├── docs/                     # Documentación
├── requirements.txt          # Dependencias Python
├── manage.py                # Utilidad Django
├── start-dev.*              # Scripts de inicio
└── README.md                # Este archivo
```

## 🚀 Próximas Funcionalidades

- [ ] **Simulacion** con indicadores tecnicos
- [ ] **Estadisticas** y simulación de montecarlo
- [ ] **Academy** sección para el aprendizaje
- [ ] **Aplicacion mobil** informacion clave y notificaciones.
- [ ] - [ ] **Alertas y notificaciones** push en tiempo real




⭐ **¡Dale una estrella al proyecto si te resulta útil!** ⭐
=======
backend/
├── backend/          # Configuración principal del proyecto
├── api/              # App de la API
├── manage.py         # Utilidad de Django
├── requirements.txt  # Dependencias
└── README.md        # Este archivo
```

