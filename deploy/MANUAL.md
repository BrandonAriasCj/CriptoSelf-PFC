# CriptoSelf - Manual de Despliegue

Despliegue AWS de 3 EC2 (backend + usuario + empresa) con HTTPS Let's Encrypt, vía un único orchestrator `deploy.ps1` con fases idempotentes.

## TL;DR (despliegue desde cero)

```powershell
cd "deploy\scripts"

# 1. Rellenar secretos (una sola vez)
copy ..\.secrets\build-args.env.example ..\.secrets\build-args.env
notepad ..\.secrets\build-args.env

# 2. Rellenar parametros CFN (una sola vez)
copy ..\cloudformation\parameters.example.json ..\cloudformation\parameters.deploy.json
notepad ..\cloudformation\parameters.deploy.json   # KeyPair, VpcId, SubnetId, AllowedSSHCidr

# 3. Lanzar todo
.\deploy.ps1 up
```

Tarda ~15-20 min total (CFN ~7 min + build/push ~6 min + Let's Encrypt ~3 min). Coste arranca en ~$1/día.

## Pre-requisitos

| Pieza | Como verificar | Si falta |
|---|---|---|
| AWS CLI v2 | `aws --version` | [Descargar MSI](https://awscli.amazonaws.com/AWSCLIV2.msi) |
| Docker Desktop | `docker version` | [Descargar](https://docker.com/products/docker-desktop) |
| Credenciales AWS | `aws sts get-caller-identity` | `aws configure` con IAM user (NO root) |
| KeyPair EC2 | `aws ec2 describe-key-pairs` | `aws ec2 create-key-pair` y guardar .pem |
| Secretos | `deploy\.secrets\build-args.env` rellenado | Copiar .example y rellenar |

**Importante**: NO uses access keys del usuario root. Crea un IAM user dedicado:
```bash
aws iam create-user --user-name criptoself-deploy
aws iam attach-user-policy --user-name criptoself-deploy --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
aws iam create-access-key --user-name criptoself-deploy
# Configura LOCALMENTE con aws configure - NUNCA pegues el SecretAccessKey en chat
```

## Comandos del orchestrator

### Despliegue inicial / fases base
```powershell
.\deploy.ps1 up         # Despliegue completo desde cero (todas las fases)
.\deploy.ps1 prepare    # Solo verificar tooling, credenciales, secretos
.\deploy.ps1 stack      # Solo CloudFormation (3 EC2 + ECR + IAM + EIP)
.\deploy.ps1 dns        # Solo A-records Lightsail
.\deploy.ps1 build      # Solo build & push de imagenes a ECR
.\deploy.ps1 services   # Solo SSM: .env + Let's Encrypt + docker compose up
.\deploy.ps1 verify     # Solo smoke tests HTTPS
.\deploy.ps1 status     # Estado actual (stack + endpoints + ECR)
.\deploy.ps1 down       # Borrar TODO (pide confirmacion, vacia ECR, delete-stack)
```

### Actualizaciones incrementales (cambios pequenos sin re-crear)

```powershell
# Cambios en codigo (Django, React) - rebuild + push + pull + recreate container
.\deploy.ps1 redeploy -Service backend     # solo Django
.\deploy.ps1 redeploy -Service usuario     # solo SPA usuario
.\deploy.ps1 redeploy -Service empresa     # solo SPA empresa
.\deploy.ps1 redeploy -Service all         # las 3

# Cambios SOLO en build-args.env (rotar secrets, anadir OAuth) - sin rebuild
.\deploy.ps1 update-env                    # reinyecta .env del backend + restart app

# Cambios en nginx config (default.conf.template) - sin rebuild, sin restart, reload graceful
.\deploy.ps1 update-nginx -Service backend
.\deploy.ps1 update-nginx -Service usuario
.\deploy.ps1 update-nginx -Service all

# Cambios en docker-compose.yml (puerto, volumen, env var nuevo) - sin rebuild
.\deploy.ps1 update-compose -Service backend
.\deploy.ps1 update-compose -Service all

# Debug / inspeccion
.\deploy.ps1 logs -Service backend         # ultimas 80 lineas del container
.\deploy.ps1 shell -Service backend        # sesion SSM interactiva (sin SSH)
```

Cada fase es **idempotente**: puedes re-correrla si una falla y reintenta lo necesario sin romper lo ya hecho.

## Workflow segun tipo de cambio

| Que cambiaste | Comando | Que pasa | Downtime | Tiempo |
|---|---|---|---|---|
| `.py` (Django) en backend | `redeploy -Service backend` | Rebuild + push + `docker compose up -d --no-deps --force-recreate app` | ~5s gunicorn restart | ~3-5 min |
| `.tsx/.ts/.css` en Usuario Web | `redeploy -Service usuario` | Igual pero solo Usuario | ~5s nginx restart | ~3-5 min |
| `.tsx/.ts/.css` en Empresa Web | `redeploy -Service empresa` | Igual pero solo Empresa | ~5s nginx restart | ~3-5 min |
| Secretos (`SECRET_KEY`, OAuth) en build-args.env | `update-env` | Re-escribe `/opt/criptoself/.env` + restart Django | ~5s | ~30s |
| `default.conf.template` (nginx) | `update-nginx -Service <n>` | Sube template + envsubst + `nginx -s reload` | 0s (reload graceful) | ~10s |
| `docker-compose.yml` (servicio nuevo, puerto, env var) | `update-compose -Service <n>` | Sube compose + `up -d` | ~5s | ~15s |
| `requirements.txt` (deps Python) | `redeploy -Service backend` | Imagen se rebuild con nuevas deps | ~5s | ~3-5 min |
| `package.json` (deps Node) | `redeploy -Service usuario/empresa` | Build `npm ci` con nuevas deps | ~5s | ~5-7 min |
| Parametros CFN (`AllowedSSHCidr`, instance type) | `stack` | `update-stack` | varia (instance reemplazo posible) | ~3-10 min |
| **`UserData` (script de bootstrap EC2)** | Termina la EC2 → CFN reemplaza | UserData solo corre en boot inicial | ~7 min | ~10 min |
| `.dockerignore` o `Dockerfile` | `redeploy -Service <n>` | Build con nuevo Dockerfile | ~5s | ~3-5 min |

### Ejemplo: itero un endpoint Django

```powershell
# 1. Edito Backend General/users/views.py
# 2. Pruebo local con dev.bat (no obligatorio)
# 3. Subo a prod:
.\deploy.ps1 redeploy -Service backend
# 4. Verifico:
.\deploy.ps1 logs -Service backend
curl https://api.criptoself.com/api/users/me/
```

### Ejemplo: cambio un color en Usuario Web

```powershell
# 1. Edito Perfil Usuario Web/src/App.css
.\deploy.ps1 redeploy -Service usuario
# 2. Forzar refresh en el navegador (Vite cache-busting hace el resto)
```

### Ejemplo: roto las credenciales de Google OAuth

```powershell
# 1. Edito deploy/.secrets/build-args.env con los nuevos GOOGLE_CLIENT_ID/SECRET
.\deploy.ps1 update-env
# Backend recibe el .env nuevo + restarta. No hace falta rebuild.
```

### Ejemplo: cambio CORS o cache headers en nginx

```powershell
# 1. Edito deploy/backend/default.conf.template
.\deploy.ps1 update-nginx -Service backend
# nginx hace reload graceful sin cortar conexiones existentes
```

## Fases en detalle

### 1. `prepare` (segundos)
Solo lee, no cambia nada.
- `aws --version`, `aws sts get-caller-identity`
- `docker info` (daemon reachable)
- `build-args.env` existe con `SECRET_KEY`
- `parameters.deploy.json` existe
- CFN template valida sintacticamente

### 2. `stack` (~6-8 min)
- Detecta si existe: si no -> `create-stack`, si si -> `update-stack` (o "No updates")
- Espera `*_COMPLETE`
- Imprime outputs (BackendDomain, IPs, etc.)

### 3. `dns` (segundos)
- Si dominio en Lightsail: crea/actualiza A-records `api`, `usuario`, `empresa`
- Si no: imprime los registros a crear manualmente
- Verifica propagacion via `Resolve-DnsName 8.8.8.8`

### 4. `build` (~5-10 min)
- ECR login (`docker login --password` directo - el `--password-stdin` tiene bug en PS Windows)
- Build & push de las 3 imagenes (`docker build` + `docker push`)
- Auto-carga build-args (`VITE_*`) desde `build-args.env`

### 5. `services` (~3-5 min)
- Por SSM Run Command (sin SSH):
  1. Backend: inyecta `.env` con secretos
  2. ECR login en la EC2
  3. `docker compose pull`
  4. Dummy cert (RSA 2048) -> `docker compose up -d` -> borra dummy -> `certbot certonly --webroot` -> `nginx -s reload`
- Igual para usuario y empresa (en paralelo)

### 6. `verify` (segundos)
Smoke tests desde tu maquina:
- `https://api.<dom>/admin/login/` -> 200
- `https://api.<dom>/api/` -> 401 (espera token)
- `https://usuario.<dom>/` -> 200
- `https://empresa.<dom>/` -> 200

## Costes y pausado

**Operativo**: ~$30-35/mes (3 EC2 + EBS + transferencia salida).

Si necesitas pausar:
```powershell
.\deploy.ps1 down       # Cero coste, pierde IPs y SQLite. Re-deploy en ~15 min.
```

Alternativa: detener instancias manualmente (`aws ec2 stop-instances`) — pero los EIPs detenidos cuestan $3.60/mes cada uno asociados a instancia parada. Total parado ~$14/mes.

## Estructura del proyecto

```
deploy/
├── MANUAL.md                          este archivo
├── README.md                          arquitectura + costos
├── .secrets/
│   ├── build-args.env.example         plantilla (commiteable)
│   ├── build-args.env                 secretos reales (gitignored)
│   └── criptoself-deploy.pem          KeyPair EC2 (gitignored)
├── backend/  usuario/  empresa/       Dockerfiles + compose + nginx
├── cloudformation/
│   ├── criptoself.yml                 IaC: ECR + IAM + EC2 + EIP + SG
│   ├── parameters.example.json
│   └── parameters.deploy.json         tus valores (gitignored)
└── scripts/
    ├── deploy.ps1                     orchestrator (fases)
    ├── deploy.bat                     wrapper
    ├── lib.ps1                        utilidades compartidas
    └── build-and-push.ps1             builds Docker + ECR push
```

## Troubleshooting

| Sintoma | Causa | Fix |
|---|---|---|
| `aws: command not found` tras instalar MSI | PATH no refrescado | Cierra+abre PowerShell o `Refresh-Path` en lib.ps1 |
| `docker login` -> 400 Bad Request | PS `--password-stdin` encoding bug | El script ya usa `--password` directo |
| CFN: "variable names must contain only..." | `${VAR:?msg}` en Sub | Reescribe a `if [ -z "$VAR" ]` |
| nginx -t fail: "unknown 'backend_domain' variable" | envsubst no proceso template | El CFN ya pone envsubst en el command. Si no: docker exec nginx `envsubst '$VAR' < template > conf.d/default.conf` |
| `SSL: ee key too small` | dummy cert RSA 1024 | CFN ya genera 2048 |
| certbot: "live directory exists" | live/ del intento anterior | El script borra antes del cert real. Para re-emitir manual: `rm -rf /etc/letsencrypt/live/<domain>` |
| LE: 404 en ACME challenge | nginx no sirve `/.well-known/acme-challenge/` | Verifica que `conf.d/default.conf` tiene el location block. Si no, envsubst no corrio (ver arriba) |
| `update-stack` falla con "No updates" | Sin cambios reales | Normal, el script lo tolera |

## Seeders (datos iniciales en BD)

El backend tiene 3 management commands relevantes:

| Comando | Que hace | Idempotente |
|---|---|---|
| `ensure_oauth_app` | Crea/actualiza OAuth Application en BD con `OAUTH_CLIENT_ID/SECRET` del .env. SIN esto el login no funciona porque el client_id del frontend no matchea nada. | Sí (update_or_create) |
| `populate_lessons` | Crea categorias de lecciones + lecciones + quizzes + preguntas | **NO** - duplica quizzes si re-run |
| `seed_empresa_test_data` | Crea 3 empresas demo + estudiantes + cursos | Sí (segun docstring) |

### Mecanica del primer deploy

El entrypoint del container backend (`deploy/backend/Dockerfile`) hace:

1. `migrate` (siempre)
2. `collectstatic` (siempre)
3. `ensure_oauth_app` (siempre - sincroniza credenciales OAuth desde .env)
4. `createsuperuser` (siempre, idempotente)
5. **SI `/data/.seeded` NO existe**:
   - `populate_lessons` (categorias + lecciones + quizzes)
   - `seed_empresa_test_data` (solo si `RUN_DEMO_SEEDS=true`)
   - `touch /data/.seeded`
6. Arranca gunicorn

El marker `/data/.seeded` vive en el volumen persistente SQLite. Asi:
- **Primer deploy** (volumen nuevo) -> seeders corren -> marker creado
- **Redeploy** (volumen existente, `redeploy -Service backend`) -> seeders se saltan
- **Tear down + redeploy** (`down` + `up`) -> volumen nuevo -> seeders corren de nuevo

### Configurar seeders antes del primer deploy

En `deploy/.secrets/build-args.env`:

```bash
# Para PFC con datos demo visibles (recomendado primera vez):
RUN_DEMO_SEEDS=true

# Para arrancar limpio sin datos demo:
RUN_DEMO_SEEDS=false
```

Despues del primer arranque, cambiar `RUN_DEMO_SEEDS` no tiene efecto (el marker existe).

### Ver estado de los seeders

```powershell
.\deploy.ps1 seed-status

# Output:
# === Marker /data/.seeded ===
# -rw-r--r-- 1 app app 0 May 22 03:14 /data/.seeded
#
# === OAuth Applications en BD ===
#   CriptoSelf Frontend: 8kK2bvjAml... (Resource owner password-based)
#
# === Conteo de datos clave ===
#   Users:             8
#   LessonCategories:  4
#   Lessons:           24
#   Organizations:     3
```

### Re-correr seeders manualmente

**Opcion A: solo correr los seeders (sin tocar marker)** - util si quieres mas datos demo:

```powershell
.\deploy.ps1 seed
# Corre populate_lessons + (si RUN_DEMO_SEEDS=true) seed_empresa
# CUIDADO: populate_lessons crea DUPLICADOS de quizzes
```

**Opcion B: full reset** - borra marker + restart container:

```powershell
.\deploy.ps1 seed -Reset
# Confirma antes de tocar nada
# Borra /data/.seeded -> restart container -> entrypoint detecta y re-corre todo
# Si datos previos existian, populate_lessons creara DUPLICADOS
```

**Opcion C: data wipe completo** - si quieres BD totalmente limpia:

```powershell
.\deploy.ps1 shell -Service backend
# Dentro de la sesion SSM:
docker exec criptoself-backend rm /data/db.sqlite3 /data/.seeded
docker compose restart app
# El entrypoint correra migrate (crea BD nueva) + seeders
exit
```

### Solo re-sincronizar OAuth (sin tocar otros datos)

Si rotaste credenciales OAuth y el frontend ya tiene el nuevo `VITE_OAUTH_CLIENT_ID`:

```powershell
# 1. Actualiza build-args.env con las nuevas credenciales
# 2. Inyecta .env nuevo (update-env hace que ensure_oauth_app corra al restart)
.\deploy.ps1 update-env
```

`ensure_oauth_app` usa `update_or_create` por client_id, asi que actualiza el secret si el client_id ya existia.

## Comandos utiles post-deploy

```powershell
# Crear superuser Django manualmente
aws ssm send-command --instance-ids <backend-i-id> --document-name AWS-RunShellScript `
  --parameters 'commands=["docker exec criptoself-backend python manage.py createsuperuser --noinput --username admin --email tu@mail.com"]' `
  --region us-east-1

# Ver logs de un contenedor
aws ssm send-command --instance-ids <i-id> --document-name AWS-RunShellScript `
  --parameters 'commands=["docker logs --tail 50 criptoself-backend"]' --region us-east-1

# Reiniciar todo en una EC2
aws ssm send-command --instance-ids <i-id> --document-name AWS-RunShellScript `
  --parameters 'commands=["cd /opt/criptoself && docker compose restart"]' --region us-east-1

# Re-emitir cert manual (si renovacion automatica falla)
aws ssm send-command --instance-ids <i-id> --document-name AWS-RunShellScript `
  --parameters 'commands=["cd /opt/criptoself && docker compose run --rm certbot renew --force-renewal"]' --region us-east-1

# Rotar el access key del usuario de deploy
aws iam create-access-key --user-name criptoself-deploy   # nueva
aws configure   # configura la nueva
aws iam delete-access-key --user-name criptoself-deploy --access-key-id <vieja>
```

## Seguridad

- **Nunca** committear `.secrets/build-args.env` ni `*.pem` (el `.gitignore` ya los excluye).
- **Nunca** pegar `SecretAccessKey` en chat/Slack/etc. Si pasa: rotar inmediatamente.
- `AllowedSSHCidr` por defecto en CFN es `0.0.0.0/0` (cualquier IP). En `parameters.deploy.json` cambialo a `<tu-ip>/32`.
- El IAM role del EC2 tiene solo `AmazonEC2ContainerRegistryReadOnly` + `AmazonSSMManagedInstanceCore`. No tiene acceso a otros recursos AWS.
- Las credenciales AWS reales (`SECRET_KEY`, OAuth secrets) viven en `/opt/criptoself/.env` en cada EC2 (permisos 600, owner ec2-user). Mejora futura: SSM Parameter Store / Secrets Manager.
