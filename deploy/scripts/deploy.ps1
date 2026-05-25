#requires -Version 5.1
<#
.SYNOPSIS
  Orchestrator de despliegue CriptoSelf. Fases idempotentes.

.EXAMPLE
  .\deploy.ps1 up                # despliega todo desde cero (o reanuda donde quedo)
  .\deploy.ps1 prepare           # solo verifica tooling/credenciales
  .\deploy.ps1 stack             # solo crea/actualiza CloudFormation
  .\deploy.ps1 dns               # solo configura A-records en Lightsail
  .\deploy.ps1 build [-Service backend|usuario|empresa|all]
  .\deploy.ps1 services          # inyecta .env, init Let's Encrypt, arranca contenedores
  .\deploy.ps1 verify            # smoke tests HTTPS
  .\deploy.ps1 status            # estado actual de stack + DNS + endpoints
  .\deploy.ps1 down              # tear down COMPLETO (pide confirmacion)
#>

[CmdletBinding()]
param(
    [Parameter(Position=0)]
    [ValidateSet('up','prepare','stack','dns','build','services','verify','status','down','help',
                 'redeploy','update-env','update-nginx','update-compose','logs','shell','seed','seed-status')]
    [string]$Action = 'help',

    [ValidateSet('backend','usuario','empresa','all')]
    [string]$Service = 'all',

    [string]$Region    = 'us-east-1',
    [string]$StackName = 'criptoself',

    # Flag para 'seed': borrar marker y restart (re-corre todos los seeders desde entrypoint)
    [switch]$Reset
)

$ErrorActionPreference = 'Stop'
. "$PSScriptRoot\lib.ps1"
Refresh-Path

# ==================== fases ====================

function Phase-Prepare {
    Write-Phase "Phase 1: Prepare"

    Write-Step "AWS CLI"
    $ver = (aws --version) 2>$null
    if (-not $ver) { Write-Err "aws no en PATH. Instala AWS CLI v2."; throw "missing-aws" }
    Write-Ok $ver

    Write-Step "Identidad AWS"
    $id = Get-CallerIdentity
    if ($id.Arn -match ':root$') { Write-Warn "Usando ROOT - mala practica. Crea un IAM user." }
    Write-Ok "$($id.Arn)"
    $Script:AwsAccountId = $id.Account

    Write-Step "Docker daemon"
    docker info --format '{{.ServerVersion}}' 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) { Write-Err "Docker no responde. Arranca Docker Desktop."; throw "missing-docker" }
    Write-Ok "$(docker info --format '{{.ServerVersion}}' 2>$null)"

    Write-Step "Archivo de secretos"
    if (-not (Test-Path $Script:SecretsPath)) {
        Write-Err "Falta $Script:SecretsPath. Copia .example y rellena."
        throw "missing-secrets"
    }
    $s = Load-Secrets
    if (-not $s.SECRET_KEY)             { Write-Err "build-args.env: SECRET_KEY vacia"; throw "missing-secret" }
    if (-not $s.VITE_OAUTH_CLIENT_ID)   { Write-Warn "VITE_OAUTH_CLIENT_ID vacio (login no funcionara)" }
    Write-Ok "secretos cargados ($($s.Count) keys)"

    Write-Step "Parametros CloudFormation"
    if (-not (Test-Path $Script:CfnParams)) {
        Write-Err "Falta $Script:CfnParams. Crea desde parameters.example.json."
        throw "missing-params"
    }
    Write-Ok "parameters.deploy.json presente"

    Write-Step "CFN template validation"
    aws cloudformation validate-template --template-body "file://$Script:CfnTemplate" --region $Region --query "Description" --output text | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "CFN template invalido" }
    Write-Ok "template valido"
}

function Phase-Stack {
    Write-Phase "Phase 2: CloudFormation Stack"
    $status = Get-StackStatus -StackName $StackName -Region $Region

    if (-not $status) {
        Write-Step "Stack no existe. create-stack..."
        aws cloudformation create-stack `
            --stack-name $StackName --region $Region `
            --template-body "file://$Script:CfnTemplate" `
            --parameters "file://$Script:CfnParams" `
            --capabilities CAPABILITY_IAM `
            --tags Key=Project,Value=CriptoSelf Key=ManagedBy,Value=CloudFormation | Out-Null
        Write-Step "Esperando CREATE_COMPLETE (~6-8 min)..."
        aws cloudformation wait stack-create-complete --stack-name $StackName --region $Region
        if ($LASTEXITCODE -ne 0) { throw "create-stack no llego a COMPLETE. Ver consola." }
    }
    elseif ($status -match 'COMPLETE$') {
        Write-Step "Stack ya existe ($status). update-stack..."
        $upd = aws cloudformation update-stack `
            --stack-name $StackName --region $Region `
            --template-body "file://$Script:CfnTemplate" `
            --parameters "file://$Script:CfnParams" `
            --capabilities CAPABILITY_IAM 2>&1
        if ($LASTEXITCODE -ne 0) {
            if ($upd -match 'No updates') { Write-Ok "Sin cambios" }
            else { throw "update-stack fallo: $upd" }
        } else {
            Write-Step "Esperando UPDATE_COMPLETE..."
            aws cloudformation wait stack-update-complete --stack-name $StackName --region $Region
        }
    }
    else {
        throw "Stack en estado intermedio/error: $status. Revisa consola."
    }

    $outs = Get-StackOutputs -StackName $StackName -Region $Region
    Write-Ok "Backend  $($outs.BackendDomain)  -> $($outs.BackendPublicIp)"
    Write-Ok "Usuario  $($outs.UsuarioDomain)  -> $($outs.UsuarioPublicIp)"
    Write-Ok "Empresa  $($outs.EmpresaDomain)  -> $($outs.EmpresaPublicIp)"
    $Script:StackOutputs = $outs
}

function Phase-Dns {
    Write-Phase "Phase 3: DNS (Lightsail)"
    if (-not $Script:StackOutputs) { $Script:StackOutputs = Get-StackOutputs -StackName $StackName -Region $Region }
    $outs = $Script:StackOutputs

    # Detectar dominio raiz
    $rootDomain = ($outs.BackendDomain -split '\.', 2)[1]
    Write-Step "Dominio raiz detectado: $rootDomain"

    # Verificar que esta en Lightsail
    $domains = aws lightsail get-domains --region us-east-1 --query "domains[].name" --output json 2>$null | ConvertFrom-Json
    if (-not ($domains -contains $rootDomain)) {
        Write-Warn "$rootDomain NO esta en Lightsail. Configura DNS manualmente:"
        Write-Host "    A  $($outs.BackendDomain)  ->  $($outs.BackendPublicIp)"
        Write-Host "    A  $($outs.UsuarioDomain)  ->  $($outs.UsuarioPublicIp)"
        Write-Host "    A  $($outs.EmpresaDomain)  ->  $($outs.EmpresaPublicIp)"
        return
    }

    # Records existentes
    $existing = aws lightsail get-domain --domain-name $rootDomain --region us-east-1 --query "domain.domainEntries[?type=='A']" --output json | ConvertFrom-Json

    $records = @(
        @{ Name = $outs.BackendDomain; Target = $outs.BackendPublicIp },
        @{ Name = $outs.UsuarioDomain; Target = $outs.UsuarioPublicIp },
        @{ Name = $outs.EmpresaDomain; Target = $outs.EmpresaPublicIp }
    )

    foreach ($r in $records) {
        $cur = $existing | Where-Object { $_.name -eq $r.Name } | Select-Object -First 1
        if ($cur -and $cur.target -eq $r.Target) {
            Write-Ok "$($r.Name) ya apunta a $($r.Target)"
            continue
        }
        if ($cur) {
            # Actualizar (update-domain-entry necesita el id)
            Write-Step "Actualizando $($r.Name) -> $($r.Target)..."
            aws lightsail update-domain-entry --domain-name $rootDomain `
                --domain-entry "id=$($cur.id),name=$($r.Name),type=A,target=$($r.Target)" `
                --region us-east-1 | Out-Null
        } else {
            Write-Step "Creando $($r.Name) -> $($r.Target)..."
            aws lightsail create-domain-entry --domain-name $rootDomain `
                --domain-entry "name=$($r.Name),type=A,target=$($r.Target)" `
                --region us-east-1 | Out-Null
        }
        if ($LASTEXITCODE -eq 0) { Write-Ok $r.Name } else { Write-Err "fallo $($r.Name)" }
    }

    Write-Step "Verificando propagacion DNS (Google 8.8.8.8)..."
    foreach ($r in $records) {
        try {
            $a = Resolve-DnsName -Name $r.Name -Type A -Server 8.8.8.8 -ErrorAction Stop |
                 Where-Object Type -eq 'A' | Select-Object -First 1
            if ($a.IPAddress -eq $r.Target) { Write-Ok "$($r.Name) -> $($a.IPAddress)" }
            else { Write-Warn "$($r.Name) -> $($a.IPAddress) (esperado $($r.Target))" }
        } catch { Write-Warn "$($r.Name) no propaga aun" }
    }
}

function Phase-Build {
    Write-Phase "Phase 4: Build & Push"
    if (-not $Script:AwsAccountId) { $Script:AwsAccountId = (Get-CallerIdentity).Account }
    & "$PSScriptRoot\build-and-push.ps1" -AwsAccountId $Script:AwsAccountId -Region $Region -Service $Service -Tag latest
    if ($LASTEXITCODE -ne 0) { throw "build-and-push fallo" }
}

function Phase-Services {
    Write-Phase "Phase 5: Services (SSM)"
    if (-not $Script:StackOutputs) { $Script:StackOutputs = Get-StackOutputs -StackName $StackName -Region $Region }
    $secrets = Load-Secrets
    $outs    = $Script:StackOutputs

    # Buscar instance-ids del stack
    $instances = aws ec2 describe-instances `
        --filters "Name=tag:aws:cloudformation:stack-name,Values=$StackName" "Name=instance-state-name,Values=running" `
        --region $Region `
        --query "Reservations[].Instances[].{Id:InstanceId,Service:Tags[?Key=='Service']|[0].Value}" `
        --output json | ConvertFrom-Json

    $iBackend = ($instances | Where-Object Service -eq 'backend').Id
    $iUsuario = ($instances | Where-Object Service -eq 'usuario').Id
    $iEmpresa = ($instances | Where-Object Service -eq 'empresa').Id

    if (-not $iBackend) { throw "No encuentro EC2 backend en el stack" }

    # ---- BACKEND ----
    Write-Step "Backend: componiendo .env y desplegando..."
    # OAUTH_CLIENT_ID/SECRET del backend deben coincidir con VITE_OAUTH_* del frontend
    # (es el cliente OAuth que el entrypoint registra via ensure_oauth_app)
    $oauthId     = if ($secrets.OAUTH_CLIENT_ID)     { $secrets.OAUTH_CLIENT_ID }     else { $secrets.VITE_OAUTH_CLIENT_ID }
    $oauthSecret = if ($secrets.OAUTH_CLIENT_SECRET) { $secrets.OAUTH_CLIENT_SECRET } else { $secrets.VITE_OAUTH_CLIENT_SECRET }
    $runDemo     = if ($secrets.RUN_DEMO_SEEDS)      { $secrets.RUN_DEMO_SEEDS }      else { 'false' }
    $adminEmail  = if ($secrets.ADMIN_EMAIL)         { $secrets.ADMIN_EMAIL }         else { throw "ADMIN_EMAIL requerido en build-args.env" }
    $allowedHosts = "localhost,127.0.0.1,$($outs.BackendDomain),$($outs.BackendPublicIp)"

    $backendEnv = @"
ECR_BACKEND_IMAGE=$Script:AwsAccountId.dkr.ecr.$Region.amazonaws.com/criptoself-backend:latest
BACKEND_DOMAIN=$($outs.BackendDomain)
SECRET_KEY=$($secrets.SECRET_KEY)
DEBUG=False
ALLOWED_HOSTS=$allowedHosts
EMAIL_HOST=$($secrets.EMAIL_HOST)
EMAIL_PORT=$($secrets.EMAIL_PORT)
EMAIL_USE_TLS=$($secrets.EMAIL_USE_TLS)
EMAIL_HOST_USER=$($secrets.EMAIL_HOST_USER)
EMAIL_HOST_PASSWORD=$($secrets.EMAIL_HOST_PASSWORD)
DEFAULT_FROM_EMAIL=$($secrets.DEFAULT_FROM_EMAIL)
GOOGLE_CLIENT_ID=$($secrets.GOOGLE_CLIENT_ID)
GOOGLE_CLIENT_SECRET=$($secrets.GOOGLE_CLIENT_SECRET)
GOOGLE_REDIRECT_URI=$($secrets.GOOGLE_REDIRECT_URI)
GITHUB_CLIENT_ID=$($secrets.GITHUB_CLIENT_ID)
GITHUB_CLIENT_SECRET=$($secrets.GITHUB_CLIENT_SECRET)
GITHUB_REDIRECT_URI=$($secrets.GITHUB_REDIRECT_URI)
OAUTH_CLIENT_ID=$oauthId
OAUTH_CLIENT_SECRET=$oauthSecret
RUN_DEMO_SEEDS=$runDemo
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_EMAIL=$adminEmail
DJANGO_SUPERUSER_PASSWORD=$($secrets.DJANGO_SUPERUSER_PASSWORD)
"@

    # Bash script idempotente: dummy cert -> compose up -> delete dummy -> real cert -> reload
    $tplBackend = @'
set -euxo pipefail
cd /opt/criptoself

# Esperar docker compose disponible
for i in 1 2 3 4 5 6 7 8 9 10; do
    docker compose version >/dev/null 2>&1 && break
    sleep 5
done

cat > .env <<'ENV_EOF'
__ENV__
ENV_EOF
chown ec2-user:ec2-user .env
chmod 600 .env

aws ecr get-login-password --region __REGION__ | docker login --username AWS --password-stdin __ACCOUNT__.dkr.ecr.__REGION__.amazonaws.com
docker compose pull app

# Dummy cert (2048 - 1024 rechazado por OpenSSL moderno)
LIVE=/etc/letsencrypt/live/__DOMAIN__
docker compose run --rm --entrypoint "sh -c 'mkdir -p $LIVE && openssl req -x509 -nodes -newkey rsa:2048 -days 1 -keyout $LIVE/privkey.pem -out $LIVE/fullchain.pem -subj /CN=localhost'" certbot

# Levantar todo con el dummy en su sitio
docker compose up -d

# Esperar nginx healthy
sleep 5

# Borrar dummy ANTES del cert real (certbot rechaza si live/ existe)
docker compose run --rm --entrypoint "sh -c 'rm -rf /etc/letsencrypt/live/__DOMAIN__ /etc/letsencrypt/archive/__DOMAIN__ /etc/letsencrypt/renewal/__DOMAIN__.conf'" certbot

# Cert real
docker compose run --rm --entrypoint "certbot certonly --webroot -w /var/www/certbot --email __EMAIL__ --agree-tos --no-eff-email -d __DOMAIN__" certbot

# Reload para tomar cert real
docker exec __NGINX__ nginx -s reload

echo "DEPLOY_OK"
'@

    $bash = $tplBackend `
        -replace '__ENV__', $backendEnv `
        -replace '__REGION__', $Region `
        -replace '__ACCOUNT__', $Script:AwsAccountId `
        -replace '__DOMAIN__', $outs.BackendDomain `
        -replace '__EMAIL__', $adminEmail `
        -replace '__NGINX__', 'criptoself-nginx'

    Write-Step "  SSM -> $iBackend"
    $r = Invoke-SSMScript -InstanceId $iBackend -BashScript $bash -Region $Region -TimeoutSec 600
    if ($r.Status -eq 'Success') { Write-Ok "Backend deployed (cert $($outs.BackendDomain))" }
    else { Write-Err "Backend fallo: status=$($r.Status)"; Write-Host ($r.Stderr -split "`n" | Select-Object -Last 15) -Separator "`n"; throw "backend-deploy" }

    # ---- USUARIO / EMPRESA ----
    $frontendTpl = @'
set -euxo pipefail
cd /opt/criptoself

for i in 1 2 3 4 5 6 7 8 9 10; do
    docker compose version >/dev/null 2>&1 && break
    sleep 5
done

aws ecr get-login-password --region __REGION__ | docker login --username AWS --password-stdin __ACCOUNT__.dkr.ecr.__REGION__.amazonaws.com
docker compose pull app

LIVE=/etc/letsencrypt/live/__DOMAIN__
docker compose run --rm --entrypoint "sh -c 'mkdir -p $LIVE && openssl req -x509 -nodes -newkey rsa:2048 -days 1 -keyout $LIVE/privkey.pem -out $LIVE/fullchain.pem -subj /CN=localhost'" certbot

docker compose up -d
sleep 5

docker compose run --rm --entrypoint "sh -c 'rm -rf /etc/letsencrypt/live/__DOMAIN__ /etc/letsencrypt/archive/__DOMAIN__ /etc/letsencrypt/renewal/__DOMAIN__.conf'" certbot

docker compose run --rm --entrypoint "certbot certonly --webroot -w /var/www/certbot --email __EMAIL__ --agree-tos --no-eff-email -d __DOMAIN__" certbot

docker exec __NGINX__ nginx -s reload

echo "DEPLOY_OK"
'@

    foreach ($f in @(
        @{ Id=$iUsuario; Domain=$outs.UsuarioDomain; Nginx='criptoself-usuario'; Label='Usuario' },
        @{ Id=$iEmpresa; Domain=$outs.EmpresaDomain; Nginx='criptoself-empresa'; Label='Empresa' }
    )) {
        if (-not $f.Id) { Write-Warn "$($f.Label): EC2 no encontrada"; continue }
        $b = $frontendTpl `
            -replace '__REGION__', $Region `
            -replace '__ACCOUNT__', $Script:AwsAccountId `
            -replace '__DOMAIN__', $f.Domain `
            -replace '__EMAIL__', $adminEmail `
            -replace '__NGINX__', $f.Nginx

        Write-Step "$($f.Label): SSM -> $($f.Id)"
        $r = Invoke-SSMScript -InstanceId $f.Id -BashScript $b -Region $Region -TimeoutSec 600
        if ($r.Status -eq 'Success') { Write-Ok "$($f.Label) deployed" }
        else { Write-Err "$($f.Label) fallo: status=$($r.Status)"; Write-Host ($r.Stderr -split "`n" | Select-Object -Last 15) -Separator "`n" }
    }
}

function Phase-Verify {
    Write-Phase "Phase 6: Verify (smoke tests)"
    if (-not $Script:StackOutputs) { $Script:StackOutputs = Get-StackOutputs -StackName $StackName -Region $Region }
    $outs = $Script:StackOutputs

    $tests = @(
        @{ Url = "https://$($outs.BackendDomain)/admin/login/"; ExpectedRange = @(200,302) },
        @{ Url = "https://$($outs.BackendDomain)/api/";          ExpectedRange = @(401,404) },
        @{ Url = "https://$($outs.UsuarioDomain)/";              ExpectedRange = @(200) },
        @{ Url = "https://$($outs.EmpresaDomain)/";              ExpectedRange = @(200) }
    )

    $allOk = $true
    foreach ($t in $tests) {
        try {
            $r = Invoke-WebRequest -Uri $t.Url -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 15 -ErrorAction Stop
            $code = $r.StatusCode
        } catch {
            if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode } else { $code = -1 }
        }
        if ($code -in $t.ExpectedRange) { Write-Ok "$($t.Url) -> $code" }
        else { Write-Err "$($t.Url) -> $code (esperado $($t.ExpectedRange -join '/'))"; $allOk = $false }
    }
    if (-not $allOk) { throw "verify-failed" }
}

function Phase-Status {
    Write-Phase "Estado del despliegue"

    Write-Step "Stack CloudFormation"
    $s = Get-StackStatus -StackName $StackName -Region $Region
    if ($s) { Write-Ok "${StackName}: $s" } else { Write-Warn "$StackName no existe"; return }

    $outs = Get-StackOutputs -StackName $StackName -Region $Region

    Write-Step "Endpoints"
    foreach ($d in @($outs.BackendDomain, $outs.UsuarioDomain, $outs.EmpresaDomain)) {
        try {
            $r = Invoke-WebRequest -Uri "https://$d/" -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 8 -ErrorAction Stop
            Write-Ok "https://$d/ -> $($r.StatusCode)"
        } catch {
            $code = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { "DOWN" }
            $col = if ($code -in 200,301,302,401,404) { 'Green' } else { 'Red' }
            Write-Host "  $col https://$d/ -> $code" -ForegroundColor $col
        }
    }

    Write-Step "ECR repositorios"
    foreach ($r in @("criptoself-backend","criptoself-usuario","criptoself-empresa")) {
        $count = aws ecr describe-images --repository-name $r --region $Region --query "length(imageDetails[])" --output text 2>$null
        Write-Ok "${r}: $count imagenes"
    }
}

function Phase-Down {
    Write-Phase "Tear down"
    if (-not (Confirm-Action "Esto BORRA EC2, EIP, IAM, ECR del stack '$StackName'. Confirmar?")) {
        Write-Warn "Cancelado"; return
    }

    Write-Step "Vaciando ECR (sino delete-stack falla)..."
    foreach ($r in @("criptoself-backend","criptoself-usuario","criptoself-empresa")) {
        $imgs = aws ecr list-images --repository-name $r --region $Region --query "imageIds[].imageDigest" --output text 2>$null
        if ($imgs) {
            $imgs.Split() | ForEach-Object {
                if ($_) { aws ecr batch-delete-image --repository-name $r --region $Region --image-ids imageDigest=$_ 2>$null | Out-Null }
            }
            Write-Ok "Vaciado $r"
        }
    }

    Write-Step "delete-stack..."
    aws cloudformation delete-stack --stack-name $StackName --region $Region
    Write-Step "Esperando DELETE_COMPLETE..."
    aws cloudformation wait stack-delete-complete --stack-name $StackName --region $Region
    Write-Ok "Stack borrado"

    Write-Warn "DNS records en Lightsail NO se tocaron (apuntan a IPs muertas). Borralos manualmente si quieres limpieza total."
}

# ==================== fases incrementales (post-deploy inicial) ====================

# Devuelve hashtable @{ backend=i-xx; usuario=i-xx; empresa=i-xx } con instance-ids del stack
function Get-StackInstances {
    $instances = aws ec2 describe-instances `
        --filters "Name=tag:aws:cloudformation:stack-name,Values=$StackName" "Name=instance-state-name,Values=running" `
        --region $Region `
        --query "Reservations[].Instances[].{Id:InstanceId,Service:Tags[?Key=='Service']|[0].Value}" `
        --output json | ConvertFrom-Json
    $h = @{}
    foreach ($i in $instances) { $h[$i.Service] = $i.Id }
    return $h
}

# Filtra quÃ© servicios procesar segÃºn el flag -Service
function Resolve-Services {
    if ($Service -eq 'all') { return @('backend','usuario','empresa') }
    return @($Service)
}

function Phase-Redeploy {
    Write-Phase "Redeploy: $Service (build + push + pull + recreate)"
    Phase-Prepare
    if (-not $Script:AwsAccountId) { $Script:AwsAccountId = (Get-CallerIdentity).Account }

    # 1. Build & push
    Phase-Build

    # 2. SSM en las EC2 afectadas para pull + recreate
    $stackInst = Get-StackInstances
    foreach ($svc in Resolve-Services) {
        $iid = $stackInst[$svc]
        if (-not $iid) { Write-Warn "${svc}: no encuentro instance-id"; continue }

        $bash = @"
set -euxo pipefail
cd /opt/criptoself
aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin $($Script:AwsAccountId).dkr.ecr.$Region.amazonaws.com
docker compose pull app
# --no-deps: no toca nginx (backend) o no afecta certbot (frontends). Solo recrea 'app'.
docker compose up -d --no-deps --force-recreate app
docker compose ps
echo "REDEPLOY_OK"
"@
        Write-Step "$svc ($iid): pull + recreate..."
        $r = Invoke-SSMScript -InstanceId $iid -BashScript $bash -Region $Region -TimeoutSec 300 -Comment "redeploy-$svc"
        if ($r.Status -eq 'Success') {
            Write-Ok "$svc redeployed"
        } else {
            Write-Err "$svc fallo (status=$($r.Status))"
            Write-Host ($r.Stderr -split "`n" | Select-Object -Last 15) -Separator "`n"
        }
    }
}

function Phase-UpdateEnv {
    Write-Phase "Update .env del backend (sin rebuild)"
    Phase-Prepare
    $stackInst = Get-StackInstances
    $iid = $stackInst['backend']
    if (-not $iid) { throw "backend EC2 no encontrada" }

    if (-not $Script:StackOutputs) { $Script:StackOutputs = Get-StackOutputs -StackName $StackName -Region $Region }
    $outs = $Script:StackOutputs
    $s = Load-Secrets

    $oauthId     = if ($s.OAUTH_CLIENT_ID)     { $s.OAUTH_CLIENT_ID }     else { $s.VITE_OAUTH_CLIENT_ID }
    $oauthSecret = if ($s.OAUTH_CLIENT_SECRET) { $s.OAUTH_CLIENT_SECRET } else { $s.VITE_OAUTH_CLIENT_SECRET }
    $runDemo     = if ($s.RUN_DEMO_SEEDS)      { $s.RUN_DEMO_SEEDS }      else { 'false' }
    $adminEmail  = if ($s.ADMIN_EMAIL)         { $s.ADMIN_EMAIL }         else { throw "ADMIN_EMAIL requerido en build-args.env" }
    $allowedHosts = "localhost,127.0.0.1,$($outs.BackendDomain),$($outs.BackendPublicIp)"

    $env = @"
ECR_BACKEND_IMAGE=$($Script:AwsAccountId).dkr.ecr.$Region.amazonaws.com/criptoself-backend:latest
BACKEND_DOMAIN=$($outs.BackendDomain)
SECRET_KEY=$($s.SECRET_KEY)
DEBUG=False
ALLOWED_HOSTS=$allowedHosts
EMAIL_HOST=$($s.EMAIL_HOST)
EMAIL_PORT=$($s.EMAIL_PORT)
EMAIL_USE_TLS=$($s.EMAIL_USE_TLS)
EMAIL_HOST_USER=$($s.EMAIL_HOST_USER)
EMAIL_HOST_PASSWORD=$($s.EMAIL_HOST_PASSWORD)
DEFAULT_FROM_EMAIL=$($s.DEFAULT_FROM_EMAIL)
GOOGLE_CLIENT_ID=$($s.GOOGLE_CLIENT_ID)
GOOGLE_CLIENT_SECRET=$($s.GOOGLE_CLIENT_SECRET)
GOOGLE_REDIRECT_URI=$($s.GOOGLE_REDIRECT_URI)
GITHUB_CLIENT_ID=$($s.GITHUB_CLIENT_ID)
GITHUB_CLIENT_SECRET=$($s.GITHUB_CLIENT_SECRET)
GITHUB_REDIRECT_URI=$($s.GITHUB_REDIRECT_URI)
OAUTH_CLIENT_ID=$oauthId
OAUTH_CLIENT_SECRET=$oauthSecret
RUN_DEMO_SEEDS=$runDemo
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_EMAIL=$adminEmail
DJANGO_SUPERUSER_PASSWORD=$($s.DJANGO_SUPERUSER_PASSWORD)
"@

    $bash = @"
set -euxo pipefail
cd /opt/criptoself
cat > .env <<'ENV_EOF'
$env
ENV_EOF
chown ec2-user:ec2-user .env
chmod 600 .env
docker compose up -d --no-deps app   # recrea solo 'app' para que tome el .env nuevo
echo "UPDATE_ENV_OK"
"@

    Write-Step "Inyectando .env nuevo en backend ($iid)..."
    $r = Invoke-SSMScript -InstanceId $iid -BashScript $bash -Region $Region -TimeoutSec 120 -Comment "update-env"
    if ($r.Status -eq 'Success') { Write-Ok ".env actualizado, backend reiniciado" }
    else { Write-Err "Fallo: $($r.Status)"; Write-Host ($r.Stderr -split "`n" | Select-Object -Last 10) -Separator "`n" }
}

function Phase-UpdateNginx {
    Write-Phase "Update nginx config: $Service (sin rebuild, reload graceful)"
    Phase-Prepare
    $stackInst = Get-StackInstances

    # Mapeo de service -> archivo local + container nginx + nombres de vars a sustituir.
    # Vars en formato '\$VAR1 \$VAR2': el backslash es escape literal que sobrevive a las
    # comillas dobles del sub-sh dentro del container (donde sí están definidas las vars).
    $serviceMap = @{
        backend = @{ Cfg = "$Script:DeployRoot\backend\default.conf.template";  Container = "criptoself-nginx";   Vars = '\$BACKEND_DOMAIN' }
        usuario = @{ Cfg = "$Script:DeployRoot\usuario\default.conf.template";  Container = "criptoself-usuario"; Vars = '\$USUARIO_DOMAIN \$BACKEND_DOMAIN' }
        empresa = @{ Cfg = "$Script:DeployRoot\empresa\default.conf.template";  Container = "criptoself-empresa"; Vars = '\$EMPRESA_DOMAIN \$BACKEND_DOMAIN' }
    }

    foreach ($svc in Resolve-Services) {
        $iid = $stackInst[$svc]
        if (-not $iid) { Write-Warn "${svc}: instance no encontrada"; continue }
        $cfgFile = $serviceMap[$svc].Cfg
        $container = $serviceMap[$svc].Container
        $vars = $serviceMap[$svc].Vars
        if (-not (Test-Path $cfgFile)) { Write-Warn "${svc}: no existe $cfgFile"; continue }

        # Subir el archivo via SSM. Aspectos delicados:
        #   1. Here-string @'...'@ (sin interpolar PS) + placeholders + .Replace() literal,
        #      para que el ${VAR} del template no lo evalúe PowerShell.
        #   2. El sh -c usa comillas SIMPLES outer (asi el shell del HOST no expande $VAR
        #      a vacio) y comillas DOBLES inner con \$VAR (asi el sub-sh DEL CONTAINER, que
        #      si tiene las vars, las pasa como nombres literales a envsubst).
        $content = Get-Content $cfgFile -Raw
        $tpl = @'
set -euxo pipefail
cd /opt/criptoself
cat > default.conf.template <<'NGINX_EOF'
__CONTENT__
NGINX_EOF
# Re-renderizar conf.d/default.conf y reload graceful
docker exec __CONTAINER__ sh -c 'envsubst "__VARS__" < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf'
docker exec __CONTAINER__ nginx -t
docker exec __CONTAINER__ nginx -s reload
echo "UPDATE_NGINX_OK"
'@
        $bash = $tpl.Replace('__CONTENT__', $content).Replace('__CONTAINER__', $container).Replace('__VARS__', $vars)

        Write-Step "$svc ($iid): subiendo template + reload..."
        $r = Invoke-SSMScript -InstanceId $iid -BashScript $bash -Region $Region -TimeoutSec 60 -Comment "update-nginx-$svc"
        if ($r.Status -eq 'Success') { Write-Ok "$svc nginx reloaded" }
        else { Write-Err "$svc fallo"; Write-Host ($r.Stderr -split "`n" | Select-Object -Last 10) -Separator "`n" }
    }
}

function Phase-UpdateCompose {
    Write-Phase "Update docker-compose.yml: $Service"
    Phase-Prepare
    $stackInst = Get-StackInstances

    $serviceMap = @{
        backend = "$Script:DeployRoot\backend\docker-compose.yml"
        usuario = "$Script:DeployRoot\usuario\docker-compose.yml"
        empresa = "$Script:DeployRoot\empresa\docker-compose.yml"
    }

    foreach ($svc in Resolve-Services) {
        $iid = $stackInst[$svc]
        if (-not $iid) { Write-Warn "${svc}: no instance"; continue }
        $cfg = $serviceMap[$svc]
        if (-not (Test-Path $cfg)) { Write-Warn "${svc}: no existe $cfg"; continue }

        $content = (Get-Content $cfg -Raw)
        $bash = @"
set -euxo pipefail
cd /opt/criptoself
cat > docker-compose.yml <<'COMPOSE_EOF'
$content
COMPOSE_EOF
docker compose up -d
echo "UPDATE_COMPOSE_OK"
"@

        Write-Step "$svc ($iid): subiendo compose + up..."
        $r = Invoke-SSMScript -InstanceId $iid -BashScript $bash -Region $Region -TimeoutSec 120 -Comment "update-compose-$svc"
        if ($r.Status -eq 'Success') { Write-Ok "$svc compose aplicado" }
        else { Write-Err "$svc fallo"; Write-Host ($r.Stderr -split "`n" | Select-Object -Last 10) -Separator "`n" }
    }
}

function Phase-Logs {
    if ($Service -eq 'all') { Write-Err "Especifica -Service backend|usuario|empresa"; return }
    $stackInst = Get-StackInstances
    $iid = $stackInst[$Service]
    if (-not $iid) { throw "$Service no encontrado" }
    $container = switch ($Service) { 'backend' { 'criptoself-backend' } 'usuario' { 'criptoself-usuario' } 'empresa' { 'criptoself-empresa' } }

    Write-Phase "Logs $Service (ultimas 80 lineas)"
    $bash = "docker logs --tail 80 $container 2>&1"
    $r = Invoke-SSMScript -InstanceId $iid -BashScript $bash -Region $Region -TimeoutSec 30 -Comment "logs"
    Write-Host $r.Stdout
    if ($r.Stderr) { Write-Host "--- stderr ---" -ForegroundColor DarkGray; Write-Host $r.Stderr }
}

function Phase-Shell {
    if ($Service -eq 'all') { Write-Err "Especifica -Service backend|usuario|empresa"; return }
    $stackInst = Get-StackInstances
    $iid = $stackInst[$Service]
    if (-not $iid) { throw "$Service no encontrado" }
    Write-Phase "Sesion SSM interactiva en $Service ($iid)"
    Write-Step "Lanzando aws ssm start-session..."
    aws ssm start-session --target $iid --region $Region
}

function Phase-SeedStatus {
    Write-Phase "Estado de seeders en backend"
    $stackInst = Get-StackInstances
    $iid = $stackInst['backend']
    if (-not $iid) { throw "backend EC2 no encontrada" }

    $bash = @'
set -e
echo "=== Marker /data/.seeded ==="
docker exec criptoself-backend ls -la /data/.seeded 2>&1 || echo "  NO existe (proximos seeders correran al restart)"
echo ""
echo "=== OAuth Applications en BD ==="
docker exec criptoself-backend python manage.py shell -c "from oauth2_provider.models import Application; [print(f'  {a.name}: {a.client_id[:12]}... ({a.get_authorization_grant_type_display()})') for a in Application.objects.all()]"
echo ""
echo "=== Conteo de datos clave ==="
docker exec criptoself-backend python manage.py shell -c "
from django.contrib.auth import get_user_model
from lessons.models import Lesson, LessonCategory
U = get_user_model()
print(f'  Users:             {U.objects.count()}')
print(f'  LessonCategories:  {LessonCategory.objects.count()}')
print(f'  Lessons:           {Lesson.objects.count()}')
try:
    from organizations.models import Organization
    print(f'  Organizations:     {Organization.objects.count()}')
except Exception as e:
    print(f'  Organizations:     (error: {e})')
"
'@

    $r = Invoke-SSMScript -InstanceId $iid -BashScript $bash -Region $Region -TimeoutSec 60 -Comment "seed-status"
    Write-Host $r.Stdout
    if ($r.Stderr -and $r.Status -ne 'Success') {
        Write-Host "--- stderr ---" -ForegroundColor DarkGray
        Write-Host $r.Stderr
    }
}

function Phase-Seed {
    Write-Phase "Re-seed manual del backend"
    $stackInst = Get-StackInstances
    $iid = $stackInst['backend']
    if (-not $iid) { throw "backend EC2 no encontrada" }

    if ($Reset) {
        if (-not (Confirm-Action "Esto BORRA el marker /data/.seeded y reinicia el container. Los seeders no-idempotentes (populate_lessons) crearan DUPLICADOS si los datos ya existen. Confirmar?")) {
            Write-Warn "Cancelado"; return
        }
        $bash = @'
set -euxo pipefail
echo "Borrando marker..."
docker exec criptoself-backend rm -f /data/.seeded
echo "Reiniciando container (entrypoint correra seeders de nuevo)..."
cd /opt/criptoself
docker compose up -d --no-deps --force-recreate app
sleep 8
docker logs --tail 30 criptoself-backend
'@
    } else {
        # Solo ejecutar populate_lessons + (si RUN_DEMO_SEEDS) seed_empresa, sin tocar marker
        $bash = @'
set -euxo pipefail
echo "Corriendo populate_lessons (cuidado: crea duplicados si ya existen quizzes)..."
docker exec criptoself-backend python manage.py populate_lessons

# RUN_DEMO_SEEDS se lee del .env del container
if docker exec criptoself-backend printenv RUN_DEMO_SEEDS | grep -qi true; then
    echo "Corriendo seed_empresa_test_data (idempotente)..."
    docker exec criptoself-backend python manage.py seed_empresa_test_data
else
    echo "RUN_DEMO_SEEDS != true en .env, saltando seed_empresa_test_data"
fi

echo "Forzando ensure_oauth_app por si las credenciales cambiaron..."
docker exec criptoself-backend python manage.py ensure_oauth_app

echo "SEED_OK"
'@
    }

    Write-Step "Enviando comando SSM al backend ($iid)..."
    $r = Invoke-SSMScript -InstanceId $iid -BashScript $bash -Region $Region -TimeoutSec 300 -Comment "seed"
    Write-Host $r.Stdout
    if ($r.Status -eq 'Success') { Write-Ok "Seed completado" }
    else { Write-Err "Fallo: $($r.Status)"; Write-Host ($r.Stderr -split "`n" | Select-Object -Last 15) -Separator "`n" }
}

# ==================== dispatch ====================

switch ($Action) {
    'help'           { Get-Help $PSCommandPath -Detailed; break }
    'prepare'        { Phase-Prepare; break }
    'stack'          { Phase-Prepare; Phase-Stack; break }
    'dns'            { Phase-Prepare; Phase-Dns; break }
    'build'          { Phase-Prepare; Phase-Build; break }
    'services'       { Phase-Prepare; Phase-Services; break }
    'redeploy'       { Phase-Redeploy; break }
    'update-env'     { Phase-UpdateEnv; break }
    'update-nginx'   { Phase-UpdateNginx; break }
    'update-compose' { Phase-UpdateCompose; break }
    'logs'           { Phase-Logs; break }
    'shell'          { Phase-Shell; break }
    'seed'           { Phase-Seed; break }
    'seed-status'    { Phase-SeedStatus; break }
    'verify'   { Phase-Verify; break }
    'status'   { Phase-Status; break }
    'down'     { Phase-Down; break }
    'up' {
        Phase-Prepare
        Phase-Stack
        Phase-Dns
        Phase-Build
        Phase-Services
        Phase-Verify
        Write-Host ""
        Write-Host "=== DEPLOY COMPLETO ===" -ForegroundColor Green
        Phase-Status
    }
}
