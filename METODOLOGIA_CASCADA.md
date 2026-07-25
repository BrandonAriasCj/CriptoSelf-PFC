# Metodología en Cascada aplicada a CriptoSelf

Documento resumen de cómo se aplicaron las **5 fases del modelo en cascada** (análisis, diseño, implementación, pruebas y mantenimiento) durante la construcción del sistema **CriptoSelf**.

> **Sobre el sistema.** CriptoSelf es una plataforma de **aprendizaje y simulación de trading de criptoactivos** (lecciones, estrategias, *backtesting* y alertas de mercado) combinada con un módulo de **gestión gamificada de integrantes** para empresas/organizaciones (retos, metas, insignias y puntos). Se materializa en un **backend Django** y **tres clientes**: Perfil Usuario Web, Perfil Empresa Web y Perfil Usuario Móvil.

El modelo en cascada encaja con un Proyecto Fin de Carrera de alcance acotado: cada fase produce artefactos que alimentan la siguiente y se avanza de forma secuencial, con realimentación puntual cuando una fase posterior obliga a revisar decisiones previas.

---

## 1. Análisis

Objetivo de la fase: entender el problema y fijar **qué** debe hacer el sistema, sin decidir aún el *cómo*.

- **Definición del alcance y actores.** Se identificaron tres perfiles de usuario con necesidades distintas:
  - **Usuario Web** — aprende, diseña estrategias, ejecuta *backtesting* y opera de forma simulada.
  - **Usuario Móvil** — consume alertas de mercado y *backtesting* de demostración (incluso como invitado, sin registro completo).
  - **Empresa/Organización** — gestiona a sus integrantes de forma gamificada (retos, metas, récords) y consulta analíticas.
- **Requisitos funcionales** (resumen por perfil):
  - Autenticación multi-proveedor (usuario/contraseña, Google, GitHub).
  - Lecciones y *quizzes*; estrategias con indicadores y eventos; ejecución y persistencia de *backtests*; operaciones simuladas con comisiones.
  - Gamificación: insignias, retos por métrica (nº de *backtests*, rachas, *win rate*…), puntos y perfil de progreso por integrante.
  - Alertas: 4 tipos (bienvenida, por regla, sugerencia, periódica) y notificaciones en tiempo real, web y móvil (push).
- **Requisitos no funcionales:** multiplataforma (web + móvil), notificaciones en **tiempo real**, seguridad (OAuth2, HTTPS), y despliegue en la nube con dominio propio.
- **Artefacto principal:** modelo de dominio inicial que después se formaliza en el diagrama ER.

---

## 2. Diseño

Objetivo de la fase: decidir la **arquitectura** y las estructuras que satisfacen los requisitos.

- **Arquitectura general.** Backend **monolítico modular** (Django dividido en *apps* por dominio) que expone una **API REST**, consumida por tres clientes desacoplados. Separación por subdominios: `api.`, `usuario.`, `empresa.` de `criptoself.com`.
- **Modelo de datos.** Diseño entidad-relación documentado en [`diagrama_er_funcional.dbml`](diagrama_er_funcional.dbml), organizado en grupos de tablas coherentes con las *apps*:

  | Grupo | Entidades clave |
  |---|---|
  | `users` | `users_user` (hub central), `UserProfile`, `CompanyProfile` |
  | `organizations` | `Organization`, `OrganizationAdmin`, `OrganizationInvitation` |
  | `gamification` | `Badge`, `Challenge`, `ChallengeAssignment`, `MemberBadge`, `PointsTransaction`, `MemberGamificationProfile` |
  | `backtesting` | `Criptoactivo`, `Indicador`, `Evento`, `Estrategia`, `BacktestResult` y tablas de relación |
  | `operaciones` | `Operacion` |
  | `alerts` | `AlertRule`, `Notification`, `UserDevice`, `SuggestionSignalState` |
  | `mobile_alerts` | `MobileGuestDevice`, `MobileAlertSubscription`, `MobileNotificationLog` |

- **Decisiones de diseño destacadas:**
  - **Autenticación** con OAuth2 (*password grant* + Google/GitHub); el frontend habla siempre con el mismo cliente OAuth registrado en BD.
  - **Proxy `/api`** en nginx del frontend hacia el backend, evitando CORS y URLs cambiantes en el código cliente.
  - **Tiempo real** mediante WebSocket (Django Channels) para las notificaciones.
  - **Tareas asíncronas/periódicas** (digests de mercado, escaneo de cruces de medias) con Celery + Redis.
  - **Persistencia** en SQLite sobre volumen dedicado (simplicidad adecuada al alcance del proyecto).
- **Diseño del despliegue** (Infraestructura como Código): 3 instancias EC2 (una por servicio), imágenes en ECR, plantilla **CloudFormation** y certificados **Let's Encrypt**.

---

## 3. Implementación

Objetivo de la fase: **construir** el software según el diseño.

- **Backend** — Django 6 + Django REST Framework. Motor de *backtesting* con **backtrader**, datos de mercado con **ccxt**, cálculo con **pandas/numpy**. Tiempo real con **Channels + daphne/uvicorn**; asíncrono con **Celery + Redis**; auth con **django-oauth-toolkit**. Servido por **gunicorn** (workers uvicorn, ASGI).
  - *Apps* implementadas: `users`, `authentication`, `organizations`, `gamification`, `backtesting`, `operaciones`, `alerts`, `mobile_alerts`, `lessons`, `student_management`, `enterprise_courses`, `api`.
- **Frontends** — Perfil Usuario Web y Perfil Empresa Web en **React + Vite + TypeScript**; Perfil Usuario Móvil en **Flutter**.
- **Contenerización y despliegue** — `Dockerfile` multi-etapa por servicio, orquestación con `docker compose`, e infraestructura descrita en `deploy/cloudformation/criptoself.yml`. Scripts de despliegue **idempotentes** (`deploy/scripts/deploy.ps1`) que cubren las fases de aprovisionar, publicar imágenes y arrancar servicios.
- **Inicialización de datos** — comandos de gestión (*seeders*) para catálogos y datos demo, y sincronización automática del cliente OAuth (`ensure_oauth_app`) en cada arranque.

---

## 4. Pruebas

Objetivo de la fase: **verificar** que el sistema cumple lo especificado. Se siguió una estrategia **pragmática**, acorde al alcance:

- **Pruebas unitarias** del componente más crítico y con lógica de negocio propia: el motor de *backtesting* (`backtesting/tests.py`).
- **Panel de pruebas en vivo de alertas** integrado en Empresa Web (`/alerts-test`): permite disparar y validar los 4 tipos de alerta y el escaneo de cruce de medias sobre datos reales.
- **Smoke tests automatizados** en el propio *pipeline* de despliegue (fase `verify` de `deploy.ps1`): comprueban que los endpoints responden con los códigos esperados (p. ej. `admin/login/` → 200, `api/` → 401, portales → 200) sobre HTTPS.
- **Verificación de despliegue e integridad**: *healthchecks* de contenedores, validez de certificados TLS y comando `seed-status` para comprobar el estado de la base de datos (conteos de usuarios, lecciones, organizaciones, cliente OAuth).
- **Pruebas E2E manuales** cruzando los tres perfiles: flujo OAuth (incluido *popup* + Google), ejecución y persistencia de *backtests*, otorgamiento de puntos/insignias y recepción de notificaciones en web y móvil.

---

## 5. Mantenimiento

Objetivo de la fase: **mantener y evolucionar** el sistema en producción.

- **Despliegue incremental idempotente** según el tipo de cambio, sin recrear la infraestructura:
  - `redeploy` (cambios de código Django/React), `update-env` (rotar secretos/OAuth), `update-nginx` (config nginx, recarga *graceful*), `update-compose` (cambios de orquestación).
- **Operación sin SSH** mediante AWS SSM (`logs`, `shell`, `status`), reduciendo superficie de ataque.
- **Renovación automática de certificados** Let's Encrypt (contenedor certbot con ciclo de renovación) y recarga periódica de nginx para tomar los certificados nuevos.
- **Persistencia y *seeders* idempotentes**: marcador `/data/.seeded` en el volumen para no duplicar datos en re-despliegues.
- **Gestión de incidencias**: registro de *bugs* no evidentes y sus correcciones (p. ej. el desfase entre el `docker-compose` embebido en el arranque y el del repositorio, que rompía nginx y bloqueaba la emisión de certificados; colisión de repositorios ECR huérfanos; escapado de `envsubst`). Estas lecciones quedan documentadas para futuros despliegues.
- **Seguridad continua**: uso de un usuario IAM dedicado (no *root*), acceso SSH restringido por IP y rotación de credenciales.

---

## Resumen: fase → artefacto en el repositorio

| Fase | Artefactos representativos |
|---|---|
| Análisis | Requisitos por perfil; modelo de dominio inicial |
| Diseño | [`diagrama_er_funcional.dbml`](diagrama_er_funcional.dbml); arquitectura de 3 servicios; `deploy/cloudformation/criptoself.yml` |
| Implementación | `Backend General/` (apps Django), `Perfil Usuario Web/`, `Perfil Empresa Web/`, `Perfil Usuario Movil/`, `deploy/` |
| Pruebas | `backtesting/tests.py`; panel `/alerts-test`; fase `verify` de `deploy/scripts/deploy.ps1` |
| Mantenimiento | Fases incrementales de `deploy.ps1` (`redeploy`, `update-*`); renovación certbot; documentación de incidencias |
