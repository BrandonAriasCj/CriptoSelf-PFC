# 🚀 Activar Modo Demo - Guía Rápida

## Pasos para Activar

### 1. Editar archivo .env

Abre el archivo `frontent_oficial/.env` y asegúrate de que tenga esta línea:

```env
VITE_DEMO_MODE=true
```

### 2. Reiniciar el servidor de desarrollo

```bash
cd frontent_oficial
npm run dev
```

### 3. ¡Listo!

Ahora puedes:
- ✅ Ingresar con cualquier email y contraseña
- ✅ Registrar usuarios sin validación
- ✅ Usar la aplicación sin backend
- ✅ Ver un banner amarillo indicando modo demo

## Ejemplo de Login

```
Email: demo@test.com
Contraseña: 123456
```

O cualquier otro dato que quieras usar.

## Desactivar Modo Demo

Para volver al modo normal con backend:

```env
VITE_DEMO_MODE=false
```

O comenta la línea:

```env
# VITE_DEMO_MODE=true
```

Luego reinicia el servidor de desarrollo.

---

📖 Para más detalles, consulta [MODO-DEMO.md](./MODO-DEMO.md)
