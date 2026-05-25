#!/bin/sh
# Uso (en la EC2 de Empresa):
#   sudo EMPRESA_DOMAIN=empresa.criptoself.com ADMIN_EMAIL=tu@correo.com \
#        sh init-letsencrypt.sh
set -e

: "${EMPRESA_DOMAIN:?Falta EMPRESA_DOMAIN}"
: "${ADMIN_EMAIL:?Falta ADMIN_EMAIL}"

STAGING="${STAGING:-0}"
DATA_PATH="./certbot"

if [ -d "$DATA_PATH/conf/live/$EMPRESA_DOMAIN" ]; then
    echo "Ya existe cert para $EMPRESA_DOMAIN."
    exit 0
fi

mkdir -p "$DATA_PATH/conf" "$DATA_PATH/www"

echo "[1/4] Cert dummy..."
LIVE_PATH="/etc/letsencrypt/live/$EMPRESA_DOMAIN"
docker compose run --rm --entrypoint "\
  sh -c 'mkdir -p $LIVE_PATH && \
  openssl req -x509 -nodes -newkey rsa:1024 -days 1 \
    -keyout $LIVE_PATH/privkey.pem \
    -out $LIVE_PATH/fullchain.pem \
    -subj /CN=localhost'" certbot

echo "[2/4] Levantando nginx..."
docker compose up -d app

echo "[3/4] Borrando dummy..."
docker compose run --rm --entrypoint "\
  sh -c 'rm -rf /etc/letsencrypt/live/$EMPRESA_DOMAIN \
         /etc/letsencrypt/archive/$EMPRESA_DOMAIN \
         /etc/letsencrypt/renewal/$EMPRESA_DOMAIN.conf'" certbot

echo "[4/4] Cert real..."
STAGING_FLAG=""
[ "$STAGING" = "1" ] && STAGING_FLAG="--staging"

docker compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $STAGING_FLAG \
    --email $ADMIN_EMAIL \
    --agree-tos --no-eff-email \
    --force-renewal \
    -d $EMPRESA_DOMAIN" certbot

docker compose exec app nginx -s reload

echo "Listo. curl -I https://$EMPRESA_DOMAIN/"
