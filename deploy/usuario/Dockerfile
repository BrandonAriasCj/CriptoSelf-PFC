# syntax=docker/dockerfile:1.7
# Build context esperado: "Perfil Usuario Web/"
# docker build -f deploy/usuario/Dockerfile \
#   --build-arg VITE_PREFIX=https://api.criptoself.com \
#   --build-arg VITE_OAUTH_CLIENT_ID=xxx \
#   --build-arg VITE_OAUTH_CLIENT_SECRET=yyy \
#   --build-arg VITE_GOOGLE_CLIENT_ID=zzz \
#   --build-arg VITE_GITHUB_CLIENT_ID=aaa \
#   --build-arg VITE_GITHUB_CLIENT_SECRET=bbb \
#   -t criptoself-usuario:latest "Perfil Usuario Web"

# ---------- builder ----------
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund --prefer-offline

# Vars de Vite (se inline-an al bundle, NO son runtime)
ARG VITE_PREFIX=https://api.criptoself.com
ARG VITE_OAUTH_CLIENT_ID=
ARG VITE_OAUTH_CLIENT_SECRET=
ARG VITE_GOOGLE_CLIENT_ID=
ARG VITE_GITHUB_CLIENT_ID=
ARG VITE_GITHUB_CLIENT_SECRET=
ENV VITE_PREFIX=$VITE_PREFIX \
    VITE_OAUTH_CLIENT_ID=$VITE_OAUTH_CLIENT_ID \
    VITE_OAUTH_CLIENT_SECRET=$VITE_OAUTH_CLIENT_SECRET \
    VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID \
    VITE_GITHUB_CLIENT_ID=$VITE_GITHUB_CLIENT_ID \
    VITE_GITHUB_CLIENT_SECRET=$VITE_GITHUB_CLIENT_SECRET

COPY . .
RUN npm run build
# Salida segun vite.config.ts: build/

# ---------- runtime ----------
FROM nginx:1.27-alpine AS runtime
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/build /usr/share/nginx/html
EXPOSE 80 443
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q --spider http://127.0.0.1/ || exit 1
