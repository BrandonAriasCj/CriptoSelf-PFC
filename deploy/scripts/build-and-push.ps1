[CmdletBinding()]
param(
    [Parameter(Mandatory)] [string]$AwsAccountId,
    [Parameter(Mandatory)] [string]$Region,
    [ValidateSet('backend','usuario','empresa','all')]
    [string]$Service = 'all',
    [string]$Tag = 'latest',

    # Build-args para frontends. Defaults se cargan de build-args.env si existe.
    [string]$ApiUrl                = 'https://api.criptoself.com',
    [string]$OAuthClientId,
    [string]$OAuthClientSecret,
    [string]$GoogleClientId,
    [string]$GithubClientId,
    [string]$GithubClientSecret,

    [string]$BuildArgsFile = $(Join-Path (Split-Path $PSScriptRoot -Parent) '.secrets\build-args.env')
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path $PSScriptRoot -Parent | Split-Path -Parent  # ../..

# Cargar build-args.env si existe (solo VITE_*; el resto va al backend .env via SSM)
$BuildArgs = @{}
if (Test-Path $BuildArgsFile) {
    Write-Host "Cargando secretos desde: $BuildArgsFile" -ForegroundColor DarkGray
    Get-Content $BuildArgsFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith('#') -and $line.Contains('=')) {
            $k, $v = $line -split '=', 2
            $BuildArgs[$k.Trim()] = $v.Trim()
        }
    }
}

function Default-From-File($currentValue, $key) {
    if ([string]::IsNullOrEmpty($currentValue) -and $BuildArgs.ContainsKey($key)) {
        return $BuildArgs[$key]
    }
    return $currentValue
}

$OAuthClientId      = Default-From-File $OAuthClientId      'VITE_OAUTH_CLIENT_ID'
$OAuthClientSecret  = Default-From-File $OAuthClientSecret  'VITE_OAUTH_CLIENT_SECRET'
$GoogleClientId     = Default-From-File $GoogleClientId     'VITE_GOOGLE_CLIENT_ID'
$GithubClientId     = Default-From-File $GithubClientId     'VITE_GITHUB_CLIENT_ID'
$GithubClientSecret = Default-From-File $GithubClientSecret 'VITE_GITHUB_CLIENT_SECRET'

$Registry = "$AwsAccountId.dkr.ecr.$Region.amazonaws.com"

function Invoke-Cmd {
    param([string]$Description, [string]$Cmd)
    Write-Host ""
    Write-Host ">> $Description" -ForegroundColor Cyan
    Write-Host "   $Cmd" -ForegroundColor DarkGray
    Invoke-Expression $Cmd
    if ($LASTEXITCODE -ne 0) { throw "Comando fallo (exit $LASTEXITCODE): $Cmd" }
}

# 1. Login a ECR (una vez)
# Nota: en Windows PS, el pipe a --password-stdin falla con 400 Bad Request por encoding.
# Usamos --password directo. Token ECR expira en 12h asi que la exposicion temporal es aceptable.
Write-Host "ECR login -> $Registry" -ForegroundColor Magenta
$ecrPassword = aws ecr get-login-password --region $Region
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($ecrPassword)) {
    throw "aws ecr get-login-password fallo. Confirma credenciales y region."
}
docker login --username AWS --password $ecrPassword $Registry
$loginExit = $LASTEXITCODE
$ecrPassword = $null
if ($loginExit -ne 0) { throw "docker login fallo (exit $loginExit)." }

# 2. Definicion de servicios
$Services = @(
    [PSCustomObject]@{
        Name        = 'backend'
        ImageRepo   = "$Registry/criptoself-backend"
        Dockerfile  = Join-Path $Root 'deploy\backend\Dockerfile'
        Context     = Join-Path $Root 'Backend General'
        BuildArgs   = @()
    },
    [PSCustomObject]@{
        Name        = 'usuario'
        ImageRepo   = "$Registry/criptoself-usuario"
        Dockerfile  = Join-Path $Root 'deploy\usuario\Dockerfile'
        Context     = Join-Path $Root 'Perfil Usuario Web'
        BuildArgs   = @(
            "--build-arg", "VITE_PREFIX=$ApiUrl",
            "--build-arg", "VITE_OAUTH_CLIENT_ID=$OAuthClientId",
            "--build-arg", "VITE_OAUTH_CLIENT_SECRET=$OAuthClientSecret",
            "--build-arg", "VITE_GOOGLE_CLIENT_ID=$GoogleClientId",
            "--build-arg", "VITE_GITHUB_CLIENT_ID=$GithubClientId",
            "--build-arg", "VITE_GITHUB_CLIENT_SECRET=$GithubClientSecret"
        )
    },
    [PSCustomObject]@{
        Name        = 'empresa'
        ImageRepo   = "$Registry/criptoself-empresa"
        Dockerfile  = Join-Path $Root 'deploy\empresa\Dockerfile'
        Context     = Join-Path $Root 'Perfil Empresa Web'
        BuildArgs   = @(
            "--build-arg", "VITE_OAUTH_CLIENT_ID=$OAuthClientId",
            "--build-arg", "VITE_OAUTH_CLIENT_SECRET=$OAuthClientSecret"
        )
    }
)

if ($Service -ne 'all') {
    $Services = $Services | Where-Object { $_.Name -eq $Service }
}

# 3. Build + push de cada servicio
foreach ($s in $Services) {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Magenta
    Write-Host " BUILD: $($s.Name)  ->  $($s.ImageRepo):$Tag" -ForegroundColor Magenta
    Write-Host "============================================================" -ForegroundColor Magenta

    $dockerArgs = @(
        "build",
        "-f", $s.Dockerfile,
        "-t", "$($s.ImageRepo):$Tag"
    ) + $s.BuildArgs + @($s.Context)

    & docker @dockerArgs
    if ($LASTEXITCODE -ne 0) { throw "docker build fallo para $($s.Name)" }

    Write-Host ""
    Write-Host "PUSH: $($s.ImageRepo):$Tag" -ForegroundColor Magenta
    & docker push "$($s.ImageRepo):$Tag"
    if ($LASTEXITCODE -ne 0) { throw "docker push fallo para $($s.Name)" }
}

Write-Host ""
Write-Host "OK - imagenes publicadas en ECR." -ForegroundColor Green
foreach ($s in $Services) {
    Write-Host "   $($s.ImageRepo):$Tag" -ForegroundColor DarkGray
}
