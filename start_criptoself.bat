@echo off
setlocal EnableDelayedExpansion

:: ============================================================
::  CriptoSelf -- Iniciador completo del proyecto
::  Abre 3 ventanas separadas con colores distintos:
::    [AZUL]     Backend General   --> http://localhost:8000
::    [VERDE]    Perfil Usuario    --> http://localhost:3000
::    [AMARILLO] Perfil Empresa    --> http://localhost:3001
:: ============================================================

title CriptoSelf -- Iniciador
cls
echo.
echo  =====================================================
echo   CRIPTOSELF -- INICIANDO TODOS LOS SERVICIOS
echo  =====================================================
echo.

:: ── Rutas (usando %~dp0 = carpeta del bat) ───────────────
set "ROOT=%~dp0"
set "PYTHON=%ROOT%Backend General\venv\Scripts\python.exe"

:: ── PASO 1: Verificaciones ────────────────────────────────
echo  [CHECK] Verificando estructura del proyecto...

if not exist "%ROOT%Backend General\" (
    echo  [ERROR] Carpeta "Backend General" no encontrada.
    pause & exit /b 1
)
if not exist "%ROOT%Perfil Usuario Web\" (
    echo  [ERROR] Carpeta "Perfil Usuario Web" no encontrada.
    pause & exit /b 1
)
if not exist "%ROOT%Perfil Empresa Web\" (
    echo  [ERROR] Carpeta "Perfil Empresa Web" no encontrada.
    pause & exit /b 1
)
if not exist "%PYTHON%" (
    echo  [ERROR] venv no encontrado: %PYTHON%
    pause & exit /b 1
)
if not exist "%ROOT%Perfil Usuario Web\node_modules\" (
    echo  [ERROR] node_modules faltante en Perfil Usuario Web.
    echo          Ejecuta primero: npm install
    pause & exit /b 1
)
if not exist "%ROOT%Perfil Empresa Web\node_modules\" (
    echo  [ERROR] node_modules faltante en Perfil Empresa Web.
    echo          Ejecuta primero: npm install
    pause & exit /b 1
)
echo  [CHECK] OK -- Todo en orden.
echo.

:: ── PASO 2: Liberar puertos 8000, 3000, 3001 ─────────────
echo  [PORTS] Liberando puertos 8000, 3000, 3001...

for %%P in (8000 3000 3001) do (
    set "FOUND=0"
    for /f "tokens=5" %%A in ('netstat -ano 2^>nul ^| findstr ":%%P " ^| findstr "LISTENING"') do (
        if not "%%A"=="" (
            set "FOUND=1"
            taskkill /f /pid %%A >nul 2>&1
            echo  [PORTS] Puerto %%P liberado (PID %%A terminado^)
        )
    )
    if "!FOUND!"=="0" echo  [PORTS] Puerto %%P ya estaba libre.
)

echo.
echo  Arrancando servicios en 2 segundos...
ping -n 3 127.0.0.1 >nul
echo.

:: ── PASO 3: Lanzar los 3 servicios ───────────────────────
echo  [1/3] Iniciando Backend General  (puerto 8000)...
start "CriptoSelf -- Backend [8000]" cmd /k "%ROOT%_run_backend.bat"

echo  [2/3] Iniciando Perfil Usuario   (puerto 3000)...
start "CriptoSelf -- Usuario  [3000]" cmd /k "%ROOT%_run_usuario.bat"

echo  [3/3] Iniciando Perfil Empresa   (puerto 3001)...
start "CriptoSelf -- Empresa  [3001]" cmd /k "%ROOT%_run_empresa.bat"

:: ── PASO 4: Esperar y verificar conectividad ─────────────
echo.
echo  [WAIT] Esperando 15s para que los servicios arranquen...
ping -n 16 127.0.0.1 >nul

echo.
echo  [TEST] Verificando puertos...

set RESULTS=
for %%P in (8000 3000 3001) do (
    set "PORT_LABEL[8000]=Backend General "
    set "PORT_LABEL[3000]=Perfil Usuario  "
    set "PORT_LABEL[3001]=Perfil Empresa  "
    set "STATUS=FALLO"
    for /f "tokens=5" %%A in ('netstat -ano 2^>nul ^| findstr ":%%P " ^| findstr "LISTENING"') do (
        set "STATUS=OK   "
    )
    echo  [TEST]  Puerto %%P  !STATUS!
)

:: ── PASO 5: Resumen ───────────────────────────────────────
echo.
echo  =====================================================
echo   SERVICIOS LISTOS
echo  =====================================================
echo.
echo    Backend General  ^>  http://localhost:8000
echo    Admin Django     ^>  http://localhost:8000/admin
echo    Perfil Usuario   ^>  http://localhost:3000
echo    Perfil Empresa   ^>  http://localhost:3001
echo.
echo   Presiona cualquier tecla para abrir el navegador...
pause >nul

start "" "http://localhost:3000"
timeout /t 1 /nobreak >nul
start "" "http://localhost:3001"
timeout /t 1 /nobreak >nul
start "" "http://localhost:8000/admin"

echo.
echo   Listo. Para detener todo ejecuta: stop_criptoself.bat
echo.
pause >nul
