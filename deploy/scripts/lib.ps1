## Utilidades compartidas para el orchestrator de despliegue.
## Cargado con: . "$PSScriptRoot\lib.ps1"

# ------------- Constantes -------------
$Script:DeployRoot   = Split-Path $PSScriptRoot -Parent
$Script:ProjectRoot  = Split-Path $Script:DeployRoot -Parent
$Script:SecretsPath  = Join-Path $Script:DeployRoot ".secrets\build-args.env"
$Script:CfnTemplate  = Join-Path $Script:DeployRoot "cloudformation\criptoself.yml"
$Script:CfnParams    = Join-Path $Script:DeployRoot "cloudformation\parameters.deploy.json"
$Script:DefaultStack = "criptoself"

# ------------- Logging -------------
function Write-Phase  { param($Msg) Write-Host ""; Write-Host "=== $Msg ===" -ForegroundColor Magenta }
function Write-Step   { param($Msg) Write-Host "  > $Msg" -ForegroundColor Cyan }
function Write-Ok     { param($Msg) Write-Host "  OK $Msg" -ForegroundColor Green }
function Write-Warn   { param($Msg) Write-Host "  ! $Msg"  -ForegroundColor Yellow }
function Write-Err    { param($Msg) Write-Host "  X $Msg"  -ForegroundColor Red }

# ------------- PATH refresh (post-instalación de AWS CLI etc.) -------------
function Refresh-Path {
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
}

# ------------- Secret loader -------------
function Load-Secrets {
    param([string]$Path = $Script:SecretsPath)
    if (-not (Test-Path $Path)) { throw "No existe $Path. Copia .example y rellena." }
    $hash = @{}
    Get-Content $Path | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith('#') -and $line.Contains('=')) {
            $k, $v = $line -split '=', 2
            $hash[$k.Trim()] = $v.Trim()
        }
    }
    return $hash
}

# ------------- AWS helpers -------------
function Get-CallerIdentity {
    $j = aws sts get-caller-identity 2>$null | ConvertFrom-Json
    if (-not $j) { throw "aws sts get-caller-identity fallo. Configura credenciales." }
    return $j
}

function Get-StackStatus {
    param([string]$StackName, [string]$Region)
    $s = aws cloudformation describe-stacks --stack-name $StackName --region $Region --query "Stacks[0].StackStatus" --output text 2>$null
    if ($LASTEXITCODE -ne 0) { return $null }
    return $s
}

function Get-StackOutputs {
    param([string]$StackName, [string]$Region)
    $j = aws cloudformation describe-stacks --stack-name $StackName --region $Region --output json | ConvertFrom-Json
    $outputs = @{}
    foreach ($o in $j.Stacks[0].Outputs) { $outputs[$o.OutputKey] = $o.OutputValue }
    return $outputs
}

# ------------- SSM helper -------------
# Ejecuta un script bash en una EC2 via SSM Run Command, espera, devuelve output.
function Invoke-SSMScript {
    param(
        [Parameter(Mandatory)] [string]$InstanceId,
        [Parameter(Mandatory)] [string]$BashScript,
        [string]$Region  = "us-east-1",
        [string]$Comment = "criptoself-deploy",
        [int]$TimeoutSec = 600
    )
    $params = @{ commands = @($BashScript) } | ConvertTo-Json -Depth 5 -Compress
    $tmp = Join-Path $env:TEMP "ssm-$([guid]::NewGuid().ToString('N')).json"
    # Sin BOM - critico para AWS CLI parsing
    [System.IO.File]::WriteAllText($tmp, $params, [System.Text.UTF8Encoding]::new($false))

    try {
        $cmdId = aws ssm send-command `
            --instance-ids $InstanceId `
            --document-name AWS-RunShellScript `
            --parameters "file://$tmp" `
            --region $Region `
            --comment $Comment `
            --timeout-seconds $TimeoutSec `
            --output text --query "Command.CommandId"
        if (-not $cmdId) { throw "send-command no devolvio CommandId" }

        # 2>$null en vez de 2>&1: en PS 5.1, redirigir stderr de un nativo a stdout
        # lo convierte en ErrorRecord (NativeCommandError) y, con $ErrorActionPreference='Stop',
        # aborta el script aunque el exit code sea 0. 2>$null silencia stderr literal.
        aws ssm wait command-executed --command-id $cmdId --instance-id $InstanceId --region $Region 2>$null | Out-Null
        # Ignoramos exit code: si el wait tira timeout (>~8 min de poll), el get-command-invocation
        # siguiente reportara el Status real (InProgress/TimedOut/...) y el caller decide.

        $inv = aws ssm get-command-invocation --command-id $cmdId --instance-id $InstanceId --region $Region --output json | ConvertFrom-Json
        return [PSCustomObject]@{
            CommandId  = $cmdId
            Status     = $inv.Status
            ExitCode   = $inv.ResponseCode
            Stdout     = $inv.StandardOutputContent
            Stderr     = $inv.StandardErrorContent
        }
    }
    finally {
        Remove-Item $tmp -ErrorAction SilentlyContinue
    }
}

# Substitye placeholders __NAME__ en una plantilla bash (single-quoted en PS)
function Expand-Placeholders {
    param([string]$Template, [hashtable]$Replacements)
    $r = $Template
    foreach ($k in $Replacements.Keys) {
        $r = $r -replace "__${k}__", [regex]::Escape($Replacements[$k]).Replace('\','\\').Replace('$','$$')
        # ^^ regex escape no es ideal aqui, mejor literal replace
    }
    # Replace literal (mas seguro)
    $r = $Template
    foreach ($k in $Replacements.Keys) {
        $r = $r.Replace("__${k}__", $Replacements[$k])
    }
    return $r
}

# ------------- Docker / ECR helper (Windows PS quirks aplicados) -------------
function Invoke-ECRLogin {
    param([string]$AwsAccountId, [string]$Region)
    $registry = "$AwsAccountId.dkr.ecr.$Region.amazonaws.com"
    Write-Step "ECR login -> $registry"
    $token = aws ecr get-login-password --region $Region
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($token)) {
        throw "aws ecr get-login-password fallo"
    }
    # --password (no --password-stdin) por bug de encoding en PS pipe
    docker login --username AWS --password $token $registry
    if ($LASTEXITCODE -ne 0) { throw "docker login fallo" }
    Write-Ok "ECR login"
}

# ------------- Confirmacion para acciones destructivas / costosas -------------
function Confirm-Action {
    param([string]$Message, [string]$Default = "n")
    Write-Host ""
    $r = Read-Host "$Message [y/N]"
    if ([string]::IsNullOrWhiteSpace($r)) { $r = $Default }
    return $r -ieq "y"
}
