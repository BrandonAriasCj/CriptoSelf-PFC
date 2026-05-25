#!/bin/bash

# Script para iniciar el desarrollo completo (Frontend + Backend)
# Ejecutar con: ./start-dev.sh

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Iniciando CriptoSelf - Desarrollo Completo${NC}"
echo -e "${CYAN}=======================================${NC}"

# Función para verificar si un puerto está en uso
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Función de limpieza
cleanup() {
    echo -e "\n${RED}🛑 Deteniendo servidores...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    echo -e "${GREEN}✅ Servidores detenidos correctamente${NC}"
    exit 0
}

# Registrar manejador de señales
trap cleanup SIGINT SIGTERM

# Verificar puertos
echo -e "${YELLOW}🔍 Verificando puertos...${NC}"

if check_port 8000; then
    echo -e "${RED}⚠️  Puerto 8000 (Backend) ya está en uso${NC}"
    read -p "¿Continuar de todos modos? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

if check_port 3000; then
    echo -e "${RED}⚠️  Puerto 3000 (Frontend) ya está en uso${NC}"
    read -p "¿Continuar de todos modos? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Verificar dependencias
echo -e "${YELLOW}📦 Verificando dependencias...${NC}"

# Verificar Python
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo -e "${RED}❌ Python no encontrado. Por favor instala Python${NC}"
    exit 1
fi

# Usar python3 si está disponible, sino python
PYTHON_CMD="python3"
if ! command -v python3 &> /dev/null; then
    PYTHON_CMD="python"
fi

# Verificar entorno virtual
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}📦 Creando entorno virtual...${NC}"
    $PYTHON_CMD -m venv venv
fi

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no encontrado. Por favor instala Node.js${NC}"
    exit 1
else
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js encontrado: $NODE_VERSION${NC}"
fi

# Verificar dependencias del frontend
if [ ! -d "frontent_oficial/node_modules" ]; then
    echo -e "${YELLOW}📦 Instalando dependencias del frontend...${NC}"
    cd frontent_oficial
    npm install
    cd ..
fi

echo -e "${GREEN}🎯 Iniciando servidores...${NC}"

# Iniciar Backend (Django)
echo -e "${BLUE}🐍 Iniciando Backend Django en puerto 8000...${NC}"
source venv/bin/activate
$PYTHON_CMD manage.py runserver 8000 > backend.log 2>&1 &
BACKEND_PID=$!

# Esperar un poco para que el backend se inicie
sleep 3

# Iniciar Frontend (Vite)
echo -e "${CYAN}⚛️ Iniciando Frontend React en puerto 3000...${NC}"
cd frontent_oficial
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo -e "\n${GREEN}🎉 ¡Servidores iniciados correctamente!${NC}"
echo -e "${CYAN}📱 Frontend: http://localhost:3000${NC}"
echo -e "${BLUE}🔧 Backend:  http://localhost:8000${NC}"
echo -e "${MAGENTA}🔑 Admin:    http://localhost:8000/admin${NC}"
echo -e "\n${YELLOW}💡 Presiona Ctrl+C para detener ambos servidores${NC}"

# Mostrar logs en tiempo real
echo -e "\n${YELLOW}📋 Logs en tiempo real:${NC}"
tail -f backend.log frontend.log &
TAIL_PID=$!

# Esperar indefinidamente
wait