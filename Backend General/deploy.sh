
#!/bin/bash

# ===========================
# CONFIGURACIÓN
# ===========================
PEM_PATH="${PEM_PATH:-/path/to/your-key.pem}"
SERVER_USER="${SERVER_USER:-bitnami}"
SERVER_IP="${SERVER_IP:?Set SERVER_IP env var antes de ejecutar}"
REMOTE_PATH="${REMOTE_PATH:-/home/bitnami/CriptoSelf}"

# ===========================
# PROCESO
# ===========================
cd frontend_oficial
echo "⏳ Construyendo proyecto React..."
npm run build || { echo "❌ Error al construir React"; exit 1; }

echo "🧹 Eliminando build anterior en el servidor..."
ssh -i "$PEM_PATH" $SERVER_USER@$SERVER_IP "rm -rf $REMOTE_PATH/static_frontend"

echo "🚀 Copiando nueva carpeta build..."
scp -i "$PEM_PATH" -r ./static_frontend $SERVER_USER@$SERVER_IP:$REMOTE_PATH/

echo "✅ DEPLOY COMPLETADO: Nueva versión en producción."

