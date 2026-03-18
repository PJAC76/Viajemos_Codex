# InsForge Connection Guide

Esta guia deja documentado el flujo recomendado para conectar y mantener `InsForge` activo en `Codex` sin guardar claves en el repositorio.

## Que usamos en este proyecto

- `InsForge MCP` para infraestructura y administracion del backend
- `SDK` de InsForge en la aplicacion cuando migremos el cliente desde Supabase
- `CLI` de conexion via `npx @insforge/install` para registrar o rotar la conexion de MCP

## Conexion inicial o reconexion

Desde la raiz del proyecto:

```bash
npm run insforge:connect -- -ApiKey <INSFORGE_API_KEY> -ApiBaseUrl <INSFORGE_BASE_URL>
```

Ejemplo:

```bash
npm run insforge:connect -- -ApiKey ik_xxxxx -ApiBaseUrl https://your-project.eu-central.insforge.app
```

El script ejecuta internamente:

```bash
npx @insforge/install --client codex --env API_KEY=<INSFORGE_API_KEY> --env API_BASE_URL=<INSFORGE_BASE_URL>
```

## Verificacion

1. Reinicia `Codex`.
2. Refresca el dashboard de `InsForge`.
3. Envia este prompt de verificacion:

```text
I'm using InsForge as my backend platform, call InsForge MCP's fetch-docs tool to learn about InsForge instructions.
```

Si `Codex` puede leer `fetch-docs` o `get-backend-metadata`, la conexion esta activa.

## Rotacion de API key

Cuando necesites cambiar la clave:

1. Crea una clave nueva en `InsForge`.
2. Ejecuta otra vez:

```bash
npm run insforge:connect -- -ApiKey <NEW_KEY> -ApiBaseUrl <INSFORGE_BASE_URL>
```

3. Reinicia `Codex`.
4. Verifica la conexion.
5. Revoca la clave antigua en `InsForge`.

## Estado local rapido

```bash
npm run insforge:status
```

## Reglas de seguridad

- No guardes `API_KEY` en `README.md`, `.env.example` o archivos versionados.
- No pegues claves activas en commits o issues.
- Si una clave aparece en capturas o chats, considerala comprometida y rotala.
