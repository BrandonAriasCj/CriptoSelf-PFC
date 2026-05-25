[CmdletBinding()]
param(
    [ValidateSet('start', 'stop', 'status')]
    [string]$Action = 'start'
)

$ErrorActionPreference = 'Stop'
$Root = $PSScriptRoot

$Services = @(
    [PSCustomObject]@{
        Name    = 'BACKEND'
        Color   = 'Cyan'
        Port    = 8000
        Url     = 'http://localhost:8000'
        Cwd     = Join-Path $Root 'Backend General'
        File    = Join-Path $Root 'Backend General\venv\Scripts\python.exe'
        ArgList = 'manage.py runserver 0.0.0.0:8000 --noreload'
    },
    [PSCustomObject]@{
        Name    = 'USUARIO'
        Color   = 'Green'
        Port    = 3000
        Url     = 'http://localhost:3000'
        Cwd     = Join-Path $Root 'Perfil Usuario Web'
        File    = $env:ComSpec
        ArgList = '/c npm run dev'
    },
    [PSCustomObject]@{
        Name    = 'EMPRESA'
        Color   = 'Yellow'
        Port    = 3001
        Url     = 'http://localhost:3001'
        Cwd     = Join-Path $Root 'Perfil Empresa Web'
        File    = $env:ComSpec
        ArgList = '/c npm run dev'
    }
)

function Write-Tag {
    param([string]$Tag, [string]$Color, [string]$Message)
    Write-Host "[$Tag] " -ForegroundColor $Color -NoNewline
    Write-Host $Message
}

function Free-Port {
    param([int]$Port)
    $killed = $false
    try {
        $conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    } catch { $conns = $null }
    foreach ($c in $conns) {
        try {
            Stop-Process -Id $c.OwningProcess -Force -ErrorAction Stop
            Write-Tag 'PORTS' 'DarkGray' "Puerto $Port liberado (PID $($c.OwningProcess))"
            $killed = $true
        } catch {}
    }
    return $killed
}

function Stop-All {
    Write-Host ''
    Write-Tag 'STOP' 'Magenta' 'Deteniendo servicios CriptoSelf...'
    foreach ($s in $Services) { [void](Free-Port $s.Port) }
    Write-Tag 'STOP' 'Green' 'Listo.'
}

function Show-Status {
    Write-Host ''
    Write-Tag 'STATUS' 'Magenta' 'Estado de servicios:'
    foreach ($s in $Services) {
        try {
            $conn = Get-NetTCPConnection -LocalPort $s.Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
        } catch { $conn = $null }
        if ($conn) {
            Write-Tag $s.Name $s.Color "OK    puerto $($s.Port)  (PID $($conn.OwningProcess))"
        } else {
            Write-Tag $s.Name 'DarkGray' "OFF   puerto $($s.Port)"
        }
    }
    Write-Host ''
}

if ($Action -ieq 'stop') { Stop-All; exit 0 }
if ($Action -ieq 'status') { Show-Status; exit 0 }

# ---------- start ----------
Write-Host ''
Write-Host '=====================================================' -ForegroundColor Magenta
Write-Host '  CRIPTOSELF DEV - INICIANDO BACKEND + USUARIO + EMPRESA' -ForegroundColor Magenta
Write-Host '=====================================================' -ForegroundColor Magenta
Write-Host ''

# Pre-flight checks
Write-Tag 'CHECK' 'Magenta' 'Verificando dependencias...'
$problems = @()
if (-not (Test-Path $Services[0].File))                              { $problems += "venv Python no encontrado: $($Services[0].File)" }
if (-not (Test-Path (Join-Path $Services[1].Cwd 'node_modules')))    { $problems += 'node_modules faltante en "Perfil Usuario Web" (ejecuta npm install)' }
if (-not (Test-Path (Join-Path $Services[2].Cwd 'node_modules')))    { $problems += 'node_modules faltante en "Perfil Empresa Web" (ejecuta npm install)' }
if ($problems.Count) {
    foreach ($p in $problems) { Write-Tag 'ERROR' 'Red' $p }
    exit 1
}
Write-Tag 'CHECK' 'Green' 'OK'

# Free ports
Write-Tag 'PORTS' 'Magenta' 'Liberando puertos 8000, 3000, 3001...'
foreach ($s in $Services) {
    if (-not (Free-Port $s.Port)) {
        Write-Tag 'PORTS' 'DarkGray' "Puerto $($s.Port) ya estaba libre."
    }
}

# Start processes in order
$Processes = @()
$Subscribers = @()

foreach ($s in $Services) {
    Write-Tag 'START' $s.Color "$($s.Name)  ->  $($s.Url)"

    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName               = $s.File
    $psi.Arguments              = $s.ArgList
    $psi.WorkingDirectory       = $s.Cwd
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError  = $true
    $psi.UseShellExecute        = $false
    $psi.CreateNoWindow         = $true

    $p = New-Object System.Diagnostics.Process
    $p.StartInfo = $psi
    $p.EnableRaisingEvents = $true

    $meta = [PSCustomObject]@{ Name = $s.Name; Color = $s.Color }

    $handler = {
        if ($null -ne $EventArgs.Data -and $EventArgs.Data.Trim() -ne '') {
            $m = $Event.MessageData
            Write-Host "[$($m.Name)] " -ForegroundColor $m.Color -NoNewline
            Write-Host $EventArgs.Data
        }
    }

    $Subscribers += Register-ObjectEvent -InputObject $p -EventName OutputDataReceived -Action $handler -MessageData $meta
    $Subscribers += Register-ObjectEvent -InputObject $p -EventName ErrorDataReceived  -Action $handler -MessageData $meta

    [void]$p.Start()
    $p.BeginOutputReadLine()
    $p.BeginErrorReadLine()

    $Processes += [PSCustomObject]@{ Service = $s; Process = $p }

    # Arranque ordenado: backend primero, luego cada frontend tras un breve respiro
    Start-Sleep -Seconds 2
}

Write-Host ''
Write-Host '=====================================================' -ForegroundColor Magenta
Write-Host '  Servicios en ejecucion (Ctrl+C para detener todo)'    -ForegroundColor Magenta
foreach ($s in $Services) {
    Write-Host ("    {0,-8}  ->  {1}" -f $s.Name, $s.Url) -ForegroundColor $s.Color
}
Write-Host '=====================================================' -ForegroundColor Magenta
Write-Host ''

# Main loop: vigila procesos hasta Ctrl+C o muerte de alguno
try {
    while ($true) {
        Start-Sleep -Milliseconds 500
        foreach ($entry in $Processes) {
            if ($entry.Process.HasExited) {
                Write-Host ''
                Write-Tag 'FATAL' 'Red' "$($entry.Service.Name) termino inesperadamente (exitCode=$($entry.Process.ExitCode)). Deteniendo todo."
                throw 'service-died'
            }
        }
    }
}
catch {
    # Ctrl+C o muerte de servicio
}
finally {
    Write-Host ''
    Write-Tag 'STOP' 'Magenta' 'Cerrando procesos hijos...'
    foreach ($entry in $Processes) {
        try {
            if (-not $entry.Process.HasExited) {
                $entry.Process.Kill($true)  # incluye descendientes
            }
        } catch {}
    }
    # Belt-and-suspenders: matar cualquier cosa todavia en los puertos
    foreach ($s in $Services) { [void](Free-Port $s.Port) }

    foreach ($sub in $Subscribers) {
        try { Unregister-Event -SubscriptionId $sub.Id -ErrorAction SilentlyContinue } catch {}
    }
    Get-Job | Where-Object { $_.State -ne 'Running' } | Remove-Job -Force -ErrorAction SilentlyContinue

    Write-Tag 'STOP' 'Green' 'Todos los servicios detenidos.'
}
