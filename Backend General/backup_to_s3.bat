@echo off
REM Script para ejecutar backup en Windows
echo Iniciando backup de base de datos...
python backup_to_s3.py
if %ERRORLEVEL% NEQ 0 (
    echo Error durante el backup
    exit /b 1
)
echo Backup completado
