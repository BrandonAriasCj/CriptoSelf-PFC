@echo off
echo Reiniciando backend de Django...
echo.

REM Matar procesos de Python
taskkill /F /IM python.exe 2>nul

echo Esperando 2 segundos...
timeout /t 2 /nobreak >nul

echo Iniciando servidor Django...
python manage.py runserver

pause
