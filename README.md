# Viajemos Codex

`Viajemos` es una web app `mobile-first` para organizar viajes privados entre amigos, parejas y familias. El proyecto esta planteado como `PWA` y se construye con una arquitectura modular para poder avanzar por dominios sin bloquear entregas ya terminadas.

## Estado actual

La base del proyecto ya incluye:

- `Vite + React + TypeScript + Tailwind CSS`
- estructura modular por dominios
- `App Shell` responsive para desktop y mobile
- rutas principales del MVP
- mocks de dominio para avanzar UI sin depender del backend
- adaptadores base para `Supabase`, `Google Maps`, storage y notificaciones
- `PWA` inicial con `manifest` y `service worker`
- primeras vistas inspiradas en los disenos Stitch para:
  - resumen del viaje
  - sitios y favoritos
  - reservas
  - itinerario
  - mapa
  - gastos
  - liquidacion
  - documentos
  - mensajes
  - notificaciones

## Stack

- `React 18`
- `TypeScript`
- `Vite`
- `Tailwind CSS`
- `Vitest`
- `Supabase JS`

## Estructura

```text
src/
  app/                  # router, layouts, providers, guards
  components/           # UI compartida y bloques reutilizables
  lib/                  # utilidades, env, feature flags, supabase, pwa
  mocks/                # datos mock por dominio
  modules/              # dominios funcionales
  services/             # adaptadores desacoplados
  test/                 # setup de testing
public/                 # manifest, icons, service worker
Diseño Pantallas/       # referencias Stitch validadas
```

## Scripts

```bash
npm install
npm run dev
npm run build
npm test
```

## Variables de entorno

Usa `.env.example` como referencia:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GOOGLE_MAPS_API_KEY=
```

## Roadmap modular

1. `M0 Plataforma`
2. `M1 Auth y Perfil`
3. `M2 Trips Core`
4. `M3 Miembros e Invitaciones`
5. `M4 Sitios y Favoritos`
6. `M5 Reservas`
7. `M6 Itinerario`
8. `M7 Mapas y Rutas`
9. `M8 Gastos`
10. `M9 Liquidacion`
11. `M10 Documentos`
12. `M11 Mensajes`
13. `M12 Notificaciones`
14. `M13 Explore, busqueda y ajustes`

## Verificacion actual

- `npm run build` OK
- `npm test` OK

