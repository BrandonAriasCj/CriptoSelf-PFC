@echo off
title CriptoSelf — Detener servicios

cls
echo.
echo  =====================================================
echo   CRIPTOSELF — DETENIENDO SERVICIOS
echo  =====================================================
echo.

:: Matar procesos de Python (Django)
echo  [1/3] Deteniendo Backend General (Python/Django)...
taskkill /f /im python.exe >nul 2>&1
if %errorlevel%==0 (
    echo        OK — Proceso Python terminado
) else (
    echo        INFO — No habia procesos Python corriendo
)

:: Matar procesos de Node (Vite)
echo  [2/3] Deteniendo frontends (Node/Vite)...
taskkill /f /im node.exe >nul 2>&1
if %errorlevel%==0 (
    echo        OK — Procesos Node terminados
) else (
    echo        INFO — No habia procesos Node corriendo
)

:: Liberar puertos por si acaso
echo  [3/3] Verificando puertos 8000, 3000, 3001...
for %%P in (8000 3000 3001) do (
    for /f "tokens=5" %%a in ('netstat -ano ^| find ":%%P " ^| find "LISTENING" 2^>nul') do (
        taskkill /f /pid %%a >nul 2>&1
    )
)

echo.
echo  =====================================================
echo   TODOS LOS SERVICIOS DETENIDOS
echo  =====================================================
echo.
ping -n 3 127.0.0.1 >nul
