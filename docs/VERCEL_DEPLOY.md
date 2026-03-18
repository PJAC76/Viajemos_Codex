# Vercel Deploy

Guia de despliegue de `Viajemos` en `Vercel` como SPA de `Vite + React Router`.

## 1. Importar el proyecto

- Entra en `Vercel`
- Importa el repositorio `PJAC76/Viajemos_Codex`
- Framework preset: `Vite`

## 2. Variables de entorno

Configura en `Project Settings > Environment Variables`:

- `VITE_INSFORGE_BASE_URL`
- `VITE_INSFORGE_ANON_KEY`
- `VITE_GOOGLE_MAPS_API_KEY`

Usa como referencia [`.env.production.example`](/C:/GPT_CODEX/Viajemos/.env.production.example).

## 3. Routing SPA

El proyecto incluye [vercel.json](/C:/GPT_CODEX/Viajemos/vercel.json) con rewrites para que:

- `/auth/*`
- `/invite/*`
- `/trips/*`
- `/explore`
- `/favorites`
- `/notifications`
- `/profile`
- `/settings`

resuelvan contra el `index.html` del SPA al refrescar o abrir una URL directa.

## 4. OAuth con InsForge

El login con Google ya usa un redirect fijo a:

- `/auth/login`

Eso simplifica la configuracion en InsForge. Cuando tengas la URL de Vercel, anade como redirects permitidos:

- `http://localhost:5173/auth/login`
- `http://127.0.0.1:5173/auth/login`
- `https://TU-PROYECTO.vercel.app/auth/login`

Si usas previews y tu configuracion de InsForge lo permite, anade tambien el dominio de preview correspondiente.

## 5. Comprobaciones despues del despliegue

- abrir `/auth/login`
- abrir `/auth/register`
- abrir `/auth/recover`
- abrir una ruta directa como `/trips`
- abrir una ruta directa como `/trips/<tripId>/summary`
- comprobar que Google Maps carga
- comprobar que Google OAuth vuelve a `/auth/login` y entra correctamente

## 6. Comandos locales utiles

```bash
npm run build
npm test
```
