@echo off
title CriptoSelf - Desarrollo
color 0A

echo.
echo ========================================
echo 🚀 CriptoSelf - Iniciando Desarrollo
echo ========================================
echo.

:: Verificar si Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python no encontrado. Por favor instala Python
    pause
    exit /b 1
)

:: Verificar si Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js no encontrado. Por favor instala Node.js
    pause
    exit /b 1
)

:: Verificar entorno virtual
if not exist "venv" (
    echo 📦 Creando entorno virtual...
    python -m venv venv
)

:: Verificar dependencias del frontend
if not exist "frontent_oficial\node_modules" (
    echo 📦 Instalando dependencias del frontend...
    cd frontent_oficial
    npm install
    cd ..
)

echo 🎯 Iniciando servidores...
echo.

:: Crear archivos temporales para los PIDs
echo. > backend.pid
echo. > frontend.pid

:: Iniciar Backend
echo 🐍 Iniciando Backend Django...
start "Backend Django" cmd /k "venv\Scripts\activate && python manage.py runserver 8000"

:: Esperar un poco
timeout /t 3 /nobreak >nul

:: Iniciar Frontend
echo ⚛️ Iniciando Frontend React...
start "Frontend React" cmd /k "cd frontent_oficial && npm run dev"

echo.
echo 🎉 ¡Servidores iniciados correctamente!
echo.
echo 📱 Frontend: http://localhost:3000
echo 🔧 Backend:  http://localhost:8000  
echo 🔑 Admin:    http://localhost:8000/admin
echo.
echo 💡 Cierra las ventanas de terminal para detener los servidores
echo.
pause