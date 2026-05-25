# syntax=docker/dockerfile:1.7
# Build context esperado: "Perfil Empresa Web/"
# docker build -f deploy/empresa/Dockerfile \
#   --build-arg VITE_OAUTH_CLIENT_ID=xxx \
#   --build-arg VITE_OAUTH_CLIENT_SECRET=yyy \
#   -t criptoself-empresa:latest "Perfil Empresa Web"

# ---------- builder ----------
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund --prefer-offline

ARG VITE_OAUTH_CLIENT_ID=
ARG VITE_OAUTH_CLIENT_SECRET=
ENV VITE_OAUTH_CLIENT_ID=$VITE_OAUTH_CLIENT_ID \
    VITE_OAUTH_CLIENT_SECRET=$VITE_OAUTH_CLIENT_SECRET

COPY . .
# El package.json define "build": "tsc && vite build" pero el repo no tiene tsconfig.json.
# Saltamos tsc (no hace falta para build de produccion) y llamamos a vite directamente.
RUN npx vite build
# Salida por defecto Vite: dist/

# ---------- runtime ----------
FROM nginx:1.27-alpine AS runtime
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80 443
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q --spider http://127.0.0.1/ || exit 1
