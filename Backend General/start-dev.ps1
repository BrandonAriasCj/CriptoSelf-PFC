# Script para iniciar el desarrollo completo (Frontend + Backend)
# Ejecutar con: .\start-dev.ps1

Write-Host "🚀 Iniciando CriptoSelf - Desarrollo Completo" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Cyan

# Función para verificar si un puerto está en uso
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    }
    catch {
        return $false
    }
}

# Verificar puertos
Write-Host "🔍 Verificando puertos..." -ForegroundColor Yellow

if (Test-Port 8000) {
    Write-Host "⚠️  Puerto 8000 (Backend) ya está en uso" -ForegroundColor Red
    $continue = Read-Host "¿Continuar de todos modos? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        exit 1
    }
}

if (Test-Port 3000) {
    Write-Host "⚠️  Puerto 3000 (Frontend) ya está en uso" -ForegroundColor Red
    $continue = Read-Host "¿Continuar de todos modos? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        exit 1
    }
}

# Verificar dependencias
Write-Host "📦 Verificando dependencias..." -ForegroundColor Yellow

# Verificar Python y venv
if (!(Test-Path "venv")) {
    Write-Host "❌ No se encontró el entorno virtual. Creando..." -ForegroundColor Red
    python -m venv venv
}

# Verificar Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js no encontrado. Por favor instala Node.js" -ForegroundColor Red
    exit 1
}

# Verificar npm dependencies en frontend
if (!(Test-Path "frontent_oficial/node_modules")) {
    Write-Host "📦 Instalando dependencias del frontend..." -ForegroundColor Yellow
    Set-Location frontent_oficial
    npm install
    Set-Location ..
}

Write-Host "🎯 Iniciando servidores..." -ForegroundColor Green

# Función para manejar Ctrl+C
$cleanup = {
    Write-Host "`n🛑 Deteniendo servidores..." -ForegroundColor Red
    Get-Job | Stop-Job
    Get-Job | Remove-Job
    Write-Host "✅ Servidores detenidos correctamente" -ForegroundColor Green
    exit 0
}

# Registrar el manejador de Ctrl+C
Register-EngineEvent PowerShell.Exiting -Action $cleanup

# Iniciar Backend (Django)
Write-Host "🐍 Iniciando Backend Django en puerto 8000..." -ForegroundColor Blue
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    & "venv\Scripts\Activate.ps1"
    python manage.py runserver 8000
}

# Esperar un poco para que el backend se inicie
Start-Sleep -Seconds 3

# Iniciar Frontend (Vite)
Write-Host "⚛️  Iniciando Frontend React en puerto 3000..." -ForegroundColor Cyan
$frontendJob = Start-Job -ScriptBlock {
    Set-Location "$using:PWD\frontent_oficial"
    npm run dev
}

Write-Host "`n🎉 ¡Servidores iniciados correctamente!" -ForegroundColor Green
Write-Host "📱 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔧 Backend:  http://localhost:8000" -ForegroundColor Blue
Write-Host "🔑 Admin:    http://localhost:8000/admin" -ForegroundColor Magenta
Write-Host "`n💡 Presiona Ctrl+C para detener ambos servidores" -ForegroundColor Yellow

# Mostrar logs en tiempo real
try {
    while ($true) {
        # Mostrar logs del backend
        $backendOutput = Receive-Job $backendJob -ErrorAction SilentlyContinue
        if ($backendOutput) {
            Write-Host "[BACKEND] $backendOutput" -ForegroundColor Blue
        }
        
        # Mostrar logs del frontend
        $frontendOutput = Receive-Job $frontendJob -ErrorAction SilentlyContinue
        if ($frontendOutput) {
            Write-Host "[FRONTEND] $frontendOutput" -ForegroundColor Cyan
        }
        
        # Verificar si los jobs siguen corriendo
        if ((Get-Job $backendJob).State -eq "Completed" -or (Get-Job $frontendJob).State -eq "Completed") {
            Write-Host "❌ Uno de los servidores se detuvo inesperadamente" -ForegroundColor Red
            break
        }
        
        Start-Sleep -Seconds 1
    }
} finally {
    # Limpiar jobs
    Get-Job | Stop-Job
    Get-Job | Remove-Job
}