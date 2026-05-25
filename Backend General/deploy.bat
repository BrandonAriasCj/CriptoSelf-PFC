@echo off
SETLOCAL ENABLEDELAYEDEXPANSION

REM ======================================
REM CONFIGURACIÓN
REM =====================================
REM Configura estas variables como env vars antes de ejecutar, o editalas aqui localmente.
IF "%PEM_PATH%"=="" SET PEM_PATH=C:\path\to\your-key.pem
IF "%SERVER_USER%"=="" SET SERVER_USER=bitnami
IF "%SERVER_IP%"=="" (
    echo ERROR: define SERVER_IP antes de ejecutar este script.
    exit /b 1
)
IF "%REMOTE_PATH%"=="" SET REMOTE_PATH=/home/bitnami/CriptoSelf


cd frontent_oficial
echo Construyendo proyecto React...
call npm run build

IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Error al construir React.
    exit /b 1
)

echo 🧹 Eliminando build anterior del servidor...
ssh -i "%PEM_PATH%" %SERVER_USER%@%SERVER_IP% "sudo rm -rf %REMOTE_PATH%/static_frontend"

echo 🚀 Subiendo nueva carpeta build al servidor...
scp -i "%PEM_PATH%" -r build %SERVER_USER%@%SERVER_IP%:%REMOTE_PATH%

echo 🔄 Renombrando carpeta 'build' a 'static_frontend' en el servidor...
ssh -i "%PEM_PATH%" %SERVER_USER%@%SERVER_IP% "sudo chown -R bitnami:bitnami %REMOTE_PATH%/build && sudo mv %REMOTE_PATH%/build %REMOTE_PATH%/static_frontend"

IF %ERRORLEVEL% NEQ 0 (
    echo ❌ Error al renombrar la carpeta en el servidor.
    exit /b 1
)

echo Mantener cambios y actualizar rama main
ssh -i "%PEM_PATH%" %SERVER_USER%@%SERVER_IP% "cd %REMOTE_PATH% && git stash && . pull_main.sh && git stash pop && pip install -r requirements.txt"

echo Realizar migraciones...
ssh -i "%PEM_PATH%" %SERVER_USER%@%SERVER_IP% "cd %REMOTE_PATH% && python manage.py makemigrations && python manage.py makemigrations operaciones && python manage.py migrate"

echo 🔐 Asignando permisos correctos para Nginx...
ssh -i "%PEM_PATH%" %SERVER_USER%@%SERVER_IP% "sudo chown -R daemon:daemon %REMOTE_PATH%/static_frontend && sudo chmod -R 755 %REMOTE_PATH%/static_frontend"

echo 🔄 Reiniciando gunicorn y nginx...
ssh -i "%PEM_PATH%" %SERVER_USER%@%SERVER_IP% "sudo systemctl restart gunicorn.service && sudo systemctl reload nginx"

echo.
echo ✅ DEPLOY COMPLETADO: Build copiado correctamente.
echo.
pause
