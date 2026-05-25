# Despliegue CriptoSelf - Docker + AWS EC2

## Arquitectura

```
   Internet
      |
      v
  Route 53 / DNS
   /   |    \
  v    v     v
 api  usuario empresa  <- A-records apuntando a EIPs
  |    |       |
  v    v       v
 [EC2 backend ]   [EC2 usuario ]   [EC2 empresa ]
  - django+gunicorn  - nginx + SPA   - nginx + SPA
  - nginx HTTPS      - HTTPS LE      - HTTPS LE
  - certbot          - certbot       - certbot
  - SQLite (vol)     - proxy /api    - proxy /api
       |__________ECR pull________|
                    (3 repos)
```

3 EC2 separadas, una por servicio, cada una con su Let's Encrypt. Imagenes en ECR.

## Estructura del directorio

```
deploy/
  backend/         Dockerfile + compose + nginx + LE para Django
  usuario/         Dockerfile + compose + nginx + LE para Perfil Usuario Web
  empresa/         Dockerfile + compose + nginx + LE para Perfil Empresa Web
  cloudformation/
    criptoself.yml          stack completo (ECR + IAM + 3 EC2 + 3 EIP + SG)
    parameters.example.json valores a rellenar antes del deploy
  scripts/
    build-and-push.ps1      construye 3 imagenes y push a ECR
    deploy-stack.ps1        wrapper de aws cloudformation create/update/delete
```

## Prerequisitos

- **AWS CLI** configurado (`aws configure`) con permisos para EC2, ECR, IAM, CloudFormation.
- **Docker Desktop** en tu maquina.
- **KeyPair EC2** existente en la region (o crearlo con `aws ec2 create-key-pair`).
- **Dominio** registrado (criptoself.com) con acceso a su DNS.
- **VPC + Subnet publicos**. Si no tienes nada, usa la default VPC de la cuenta.

## Costo estimado (us-east-1, on-demand)

| Recurso             | $/mes aprox |
|---------------------|-------------|
| EC2 backend t3.small   | $15.18  |
| EC2 usuario t3.micro   | $7.59   |
| EC2 empresa t3.micro   | $7.59   |
| EBS gp3 (40GB total)   | $3.20   |
| EIP (3, todos asociados) | $0  |
| ECR storage (<500MB)   | $0      |
| Transferencia salida (~10GB) | $0.90 |
| **Total**              | **~$34/mes** |

Si bajas a `t4g.*` (ARM) ahorras ~20%. Cambia `LatestAmiId` a `/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-arm64`.

## Flujo de primer despliegue

### 1. Rellenar parametros

Edita `deploy/cloudformation/parameters.example.json`:
- `KeyPairName`: nombre de tu keypair
- `VpcId`, `SubnetId`: tu VPC/Subnet (lista con `aws ec2 describe-vpcs` / `describe-subnets`)
- `AllowedSSHCidr`: tu IP/32 (no dejar `0.0.0.0/0` en prod)

### 2. Crear infraestructura (CloudFormation)

```powershell
cd "deploy\scripts"
.\deploy-stack.ps1 -Action create -Region us-east-1
```

Esto crea ECR (vacios), IAM, SGs, 3 EC2 y 3 EIP. Las EC2 arrancan con docker + AWS CLI + compose + archivos de configuracion, pero **sin imagenes todavia**. Las imagenes vienen en el paso 4.

Al terminar imprime los outputs con las IPs publicas.

### 3. Apuntar DNS

Crear A-records en tu DNS:
- `api.criptoself.com`     -> `<BackendPublicIp>`
- `usuario.criptoself.com` -> `<UsuarioPublicIp>`
- `empresa.criptoself.com` -> `<EmpresaPublicIp>`

Espera a que propague (`dig +short api.criptoself.com`).

### 4. Build y push de imagenes a ECR

Desde la raiz del proyecto:

```powershell
.\deploy\scripts\build-and-push.ps1 `
  -AwsAccountId 123456789012 `
  -Region us-east-1 `
  -ApiUrl https://api.criptoself.com `
  -OAuthClientId    "xxx" `
  -OAuthClientSecret "yyy" `
  -GoogleClientId   "zzz" `
  -GithubClientId   "aaa" `
  -GithubClientSecret "bbb"
```

Construye y publica las 3 imagenes (`criptoself-backend`, `criptoself-usuario`, `criptoself-empresa`) con tag `latest`.

### 5. Completar `.env` del backend y arrancar HTTPS

Conectarse a la EC2 del backend:

```bash
ssh -i tu-key.pem ec2-user@<BackendPublicIp>
cd /opt/criptoself
sudo nano .env   # rellenar SECRET_KEY, OAuth, etc.
```

Emitir certificado Let's Encrypt:

```bash
sudo BACKEND_DOMAIN=api.criptoself.com ADMIN_EMAIL=tu@correo.com sh init-letsencrypt.sh
sudo docker compose up -d
```

Verificar: `curl -I https://api.criptoself.com/admin/login/`

### 6. Lo mismo para usuario y empresa

```bash
ssh -i tu-key.pem ec2-user@<UsuarioPublicIp>
cd /opt/criptoself
sudo USUARIO_DOMAIN=usuario.criptoself.com ADMIN_EMAIL=tu@correo.com sh init-letsencrypt.sh
sudo docker compose up -d
```

```bash
ssh -i tu-key.pem ec2-user@<EmpresaPublicIp>
cd /opt/criptoself
sudo EMPRESA_DOMAIN=empresa.criptoself.com ADMIN_EMAIL=tu@correo.com sh init-letsencrypt.sh
sudo docker compose up -d
```

## Re-deploy (actualizar codigo)

1. Build + push nueva imagen:
   ```powershell
   .\deploy\scripts\build-and-push.ps1 -AwsAccountId ... -Region ... -Service backend -Tag latest
   ```
2. SSH a la EC2 afectada:
   ```bash
   cd /opt/criptoself
   sudo docker compose pull app
   sudo docker compose up -d
   ```

Para refrescar a la vez los 3: `-Service all`.

## Destruir todo

```powershell
.\deploy\scripts\deploy-stack.ps1 -Action delete -Region us-east-1
```

Borra EC2, EIP, IAM, ECR (CloudFormation borra los repos si estan vacios; si tienen imagenes hay que vaciarlos antes con `aws ecr batch-delete-image`).

## Troubleshooting

| Sintoma | Causa probable | Fix |
|--|--|--|
| `docker compose up` falla con `pull access denied` en EC2 | Sesion ECR vencida | `aws ecr get-login-password ... \| docker login ...` (instance profile lo permite) |
| `init-letsencrypt.sh` falla con "Connection refused" | DNS aun no propaga al EIP | Esperar y reintentar |
| Backend 502 desde nginx | Container `app` no arranco (revisar `docker logs criptoself-backend`) | Tipicamente migraciones fallidas; ver `entrypoint` |
| Frontend "Mixed Content" | nginx proxy resuelve a HTTP en vez de HTTPS | Revisar `default.conf.template`: `proxy_pass https://...` |
| 403/CSRF en POST a backend | `DJANGO_ALLOWED_HOSTS` o CSRF_TRUSTED_ORIGINS faltan | Editar `.env` y reiniciar |
| `userdata.log` muestra error de docker compose plugin | `uname -m` devuelve algo raro | Probar manualmente `curl -L .../docker-compose-linux-x86_64` |

Logs de bootstrap en cada EC2: `/var/log/userdata.log`.

## Notas de seguridad

- `SECRET_KEY`, OAuth secrets, `DJANGO_SUPERUSER_PASSWORD` viven en `/opt/criptoself/.env` en la EC2. No estan en CloudFormation. Mejora futura: SSM Parameter Store o Secrets Manager.
- Restringe `AllowedSSHCidr` a tu IP.
- Plantea rotar `SECRET_KEY` y emitir un superuser distinto al de bootstrap.
- El backend escucha publicamente en `api.criptoself.com`. CORS en Django: anade `usuario.criptoself.com` y `empresa.criptoself.com` a `CORS_ALLOWED_ORIGINS` y `CSRF_TRUSTED_ORIGINS` si llamas directamente; con el proxy `/api` actual no hace falta porque el origen visto por Django es la propia frontend.
