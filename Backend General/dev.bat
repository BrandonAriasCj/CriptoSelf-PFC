@echo off
:: Script rápido para desarrollo
echo Iniciando CriptoSelf...
start "Backend" cmd /k "venv\Scripts\activate && python manage.py runserver"
timeout /t 2 /nobreak >nul
start "Frontend" cmd /k "cd frontent_oficial && npm run dev"
echo Servidores iniciados!
echo Frontend: http://localhost:3000
echo Backend: http://localhost:8000