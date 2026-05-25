# 🚀 Guía de Desarrollo - CriptoSelf

## Scripts Disponibles

### Windows

#### Opción 1: Script Batch Simple (Recomendado)
```bash
# Doble clic en el archivo o ejecutar:
start-dev.bat
```

#### Opción 2: Script PowerShell Avanzado
```powershell
# Ejecutar en PowerShell:
.\start-dev.ps1
```

#### Opción 3: Script Rápido
```bash
# Para inicio rápido:
dev.bat
```

### Linux/Mac

#### Script Bash
```bash
# Hacer ejecutable (solo la primera vez):
chmod +x start-dev.sh

# Ejecutar:
./start-dev.sh
```

### Multiplataforma

#### Script Node.js
```bash
# Ejecutar:
node start-dev.js
```

## URLs de Desarrollo

- **Frontend (React)**: http://localhost:3000
- **Backend (Django)**: http://localhost:8000
- **Admin Django**: http://localhost:8000/admin
- **API Docs**: http://localhost:8000/api/

## Inicio Manual

### Backend (Django)
```bash
# Activar entorno virtual
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Instalar dependencias (primera vez)
pip install -r requirements.txt

# Ejecutar migraciones (primera vez)
python manage.py migrate

# Crear superusuario (primera vez)
python manage.py createsuperuser

# Iniciar servidor
python manage.py runserver
```

### Frontend (React + Vite)
```bash
# Ir al directorio del frontend
cd frontent_oficial

# Instalar dependencias (primera vez)
npm install

# Iniciar servidor de desarrollo
npm run dev
```

## Configuración Inicial

### 1. Backend
1. Crear entorno virtual: `python -m venv venv`
2. Activar entorno: `venv\Scripts\activate`
3. Instalar dependencias: `pip install -r requirements.txt`
4. Ejecutar migraciones: `python manage.py migrate`
5. Crear superusuario: `python manage.py createsuperuser`
6. Crear aplicación OAuth2: `python manage.py create_oauth_app`

### 2. Frontend
1. Ir al directorio: `cd frontent_oficial`
2. Instalar dependencias: `npm install`
3. Configurar variables de entorno en `.env`

### 3. Variables de Entorno

#### Backend (.env)
```env
SECRET_KEY=tu-secret-key-aqui
DEBUG=True
```

#### Frontend (frontent_oficial/.env)
```env
VITE_OAUTH_CLIENT_ID=tu-client-id
VITE_OAUTH_CLIENT_SECRET=tu-client-secret
VITE_API_BASE_URL=http://localhost:8000/api
VITE_GOOGLE_CLIENT_ID=tu-google-client-id
VITE_GITHUB_CLIENT_ID=tu-github-client-id
```

## Características del Sistema de Autenticación

### 🔐 Autenticación Tradicional
- Login con email/password
- Registro de usuarios
- Gestión de perfiles
- Cambio de contraseña

### 🌐 Autenticación Social
- Login con Google
- Login con GitHub
- Creación automática de usuarios
- Integración OAuth2

## Comandos Útiles

### Django
```bash
# Crear migraciones
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Crear aplicación OAuth2
python manage.py create_oauth_app

# Shell interactivo
python manage.py shell

# Recopilar archivos estáticos
python manage.py collectstatic
```

### React
```bash
# Instalar nueva dependencia
npm install nombre-paquete

# Ejecutar tests
npm test

# Build para producción
npm run build

# Preview del build
npm run preview
```

## Estructura del Proyecto

```
├── backend/                 # Configuración Django
├── frontent_oficial/        # Aplicación React
├── api/                     # API REST
├── authentication/          # Sistema de autenticación
├── users/                   # Gestión de usuarios
├── backtesting/            # Sistema de backtesting
├── start-dev.bat           # Script Windows
├── start-dev.ps1           # Script PowerShell
├── start-dev.sh            # Script Linux/Mac
├── start-dev.js            # Script Node.js
└── requirements.txt        # Dependencias Python
```

## Solución de Problemas

### Puerto en uso
Si los puertos 3000 o 8000 están en uso:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Problemas de CORS
Verificar configuración en `backend/settings.py`:
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

### Problemas de autenticación
1. Verificar credenciales OAuth2 en `.env`
2. Crear nueva aplicación OAuth2: `python manage.py create_oauth_app`
3. Verificar configuración de CORS

## Contacto y Soporte

Para problemas o preguntas sobre el desarrollo, consulta la documentación o crea un issue en el repositorio.