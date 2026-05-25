#!/bin/sh
# Emite el certificado por primera vez. Ejecutar UNA VEZ tras apuntar DNS al EIP.
# Uso (en la EC2 del backend):
#   sudo BACKEND_DOMAIN=api.criptoself.com ADMIN_EMAIL=tu@correo.com \
#        sh init-letsencrypt.sh
set -e

: "${BACKEND_DOMAIN:?Falta BACKEND_DOMAIN}"
: "${ADMIN_EMAIL:?Falta ADMIN_EMAIL}"

STAGING="${STAGING:-0}"  # poner a 1 para certificados de prueba
DATA_PATH="./certbot"

if [ -d "$DATA_PATH/conf/live/$BACKEND_DOMAIN" ]; then
    echo "Ya existe un certificado para $BACKEND_DOMAIN. Aborto."
    exit 0
fi

mkdir -p "$DATA_PATH/conf" "$DATA_PATH/www"

# 1. Bootstrap nginx con cert dummy para que pueda arrancar HTTPS
echo "[1/4] Creando cert dummy para arrancar nginx..."
LIVE_PATH="/etc/letsencrypt/live/$BACKEND_DOMAIN"
docker compose run --rm --entrypoint "\
  sh -c 'mkdir -p $LIVE_PATH && \
  openssl req -x509 -nodes -newkey rsa:1024 -days 1 \
    -keyout $LIVE_PATH/privkey.pem \
    -out $LIVE_PATH/fullchain.pem \
    -subj /CN=localhost'" certbot

# 2. Arrancar nginx
echo "[2/4] Levantando nginx..."
docker compose up -d nginx

# 3. Borrar cert dummy
echo "[3/4] Borrando cert dummy..."
docker compose run --rm --entrypoint "\
  sh -c 'rm -rf /etc/letsencrypt/live/$BACKEND_DOMAIN \
         /etc/letsencrypt/archive/$BACKEND_DOMAIN \
         /etc/letsencrypt/renewal/$BACKEND_DOMAIN.conf'" certbot

# 4. Emitir certificado real via webroot challenge
echo "[4/4] Solicitando certificado a Let's Encrypt..."
STAGING_FLAG=""
[ "$STAGING" = "1" ] && STAGING_FLAG="--staging"

docker compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $STAGING_FLAG \
    --email $ADMIN_EMAIL \
    --agree-tos --no-eff-email \
    --force-renewal \
    -d $BACKEND_DOMAIN" certbot

# Recargar nginx
docker compose exec nginx nginx -s reload

echo "Listo. Verifica con: curl -I https://$BACKEND_DOMAIN/"
