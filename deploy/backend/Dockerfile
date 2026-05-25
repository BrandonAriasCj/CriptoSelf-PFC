# syntax=docker/dockerfile:1.7
# Build context esperado: "Backend General/"
# Build:
#   docker build -f deploy/backend/Dockerfile -t criptoself-backend:latest "Backend General"

# ---------- builder ----------
FROM python:3.12-slim AS builder

ENV PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PYTHONDONTWRITEBYTECODE=1

RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libffi-dev \
        libssl-dev \
        libjpeg-dev \
        zlib1g-dev \
        curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build
COPY requirements.txt .
RUN pip install --prefix=/install --no-cache-dir -r requirements.txt

# ---------- runtime ----------
FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=backend.settings \
    DATABASE_PATH=/data/db.sqlite3 \
    PORT=8000

RUN apt-get update && apt-get install -y --no-install-recommends \
        libjpeg62-turbo \
        zlib1g \
        libffi8 \
        libssl3 \
        curl \
        tini \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd -r app && useradd -r -g app -d /app -s /sbin/nologin app

WORKDIR /app
COPY --from=builder /install /usr/local
COPY --chown=app:app . .

# Entrypoint embebido para no depender de archivos fuera del build context.
# Orden:
#   1. migrate (siempre - idempotente por diseño Django)
#   2. collectstatic (siempre)
#   3. ensure_oauth_app (siempre - update_or_create, idempotente; sincroniza credenciales del frontend)
#   4. superuser bootstrap (si env vars presentes; createsuperuser --noinput ya es idempotente)
#   5. Seeders no-idempotentes (populate_lessons, seed_empresa_test_data) - SOLO si marker /data/.seeded no existe
#
# El marker vive en /data (volumen SQLite persistente). Asi:
#   - Volumen nuevo (primer deploy)  -> seeders corren -> marker creado
#   - Volumen existente (redeploy)   -> seeders saltados
#   - Para forzar re-seed manual: borrar /data/.seeded y restart del container
RUN cat > /app/entrypoint.sh <<'EOF' && chmod +x /app/entrypoint.sh
#!/bin/sh
set -e

echo "[entrypoint] aplicando migraciones..."
python manage.py migrate --noinput

echo "[entrypoint] recolectando staticfiles..."
python manage.py collectstatic --noinput || true

echo "[entrypoint] sincronizando OAuth Application..."
python manage.py ensure_oauth_app || echo "[entrypoint] ensure_oauth_app no fatal, continuando"

if [ -n "$DJANGO_SUPERUSER_USERNAME" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ]; then
    echo "[entrypoint] creando superusuario si no existe..."
    python manage.py createsuperuser --noinput || true
fi

# Seeders de primer arranque (marker en volumen persistente)
SEED_MARKER=/data/.seeded
if [ ! -f "$SEED_MARKER" ]; then
    echo "[entrypoint] primer arranque - corriendo seeders no-idempotentes..."

    python manage.py populate_lessons || echo "[entrypoint] populate_lessons fallo (no fatal)"

    if [ "$RUN_DEMO_SEEDS" = "true" ]; then
        python manage.py seed_empresa_test_data || echo "[entrypoint] seed_empresa_test_data fallo (no fatal)"
    else
        echo "[entrypoint] RUN_DEMO_SEEDS != true, saltando seed_empresa_test_data"
    fi

    touch "$SEED_MARKER"
    echo "[entrypoint] seeders terminados. Marker: $SEED_MARKER"
else
    echo "[entrypoint] $SEED_MARKER existe - seeders ya corrieron antes"
fi

echo "[entrypoint] arrancando: $@"
exec "$@"
EOF

RUN mkdir -p /data /app/staticfiles /app/media \
    && chown -R app:app /data /app/staticfiles /app/media

USER app
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -fsS http://127.0.0.1:8000/admin/login/ || exit 1

ENTRYPOINT ["/usr/bin/tini", "--", "/app/entrypoint.sh"]
# ASGI: gunicorn delega cada worker a uvicorn para soportar HTTP + WebSocket
# (Django Channels en alerts/). El resto de la app sigue funcionando idéntico.
CMD ["gunicorn", "backend.asgi:application", \
     "-k", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "3", \
     "--timeout", "60", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
