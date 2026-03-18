# Release Checklist

Esta checklist deja el proyecto listo para pasar de `MVP funcional` a `release candidata`.

## 1. Configuracion

- [ ] Crear `.env.production.local` a partir de [`.env.production.example`](/C:/GPT_CODEX/Viajemos/.env.production.example)
- [ ] Completar `VITE_INSFORGE_BASE_URL`
- [ ] Completar `VITE_INSFORGE_ANON_KEY`
- [ ] Completar `VITE_GOOGLE_MAPS_API_KEY`
- [ ] Verificar que `npm run build` sigue pasando con esas variables

## 2. InsForge Auth

- [ ] Confirmar en InsForge que `verifyEmailMethod = code`
- [ ] Confirmar en InsForge que `resetPasswordMethod = code`
- [ ] Validar `Google OAuth` con el dominio final de la app
- [ ] Revisar redirects autorizados para:
  - [ ] `http://localhost:5173`
  - [ ] dominio de preview
  - [ ] dominio final de produccion
- [ ] Probar registro con email
- [ ] Probar verificacion por codigo
- [ ] Probar login con email
- [ ] Probar login con Google
- [ ] Probar recuperacion por codigo

## 3. Seguridad y permisos

- [ ] Validar `RLS` con usuario anonimo
- [ ] Validar `RLS` con miembro normal
- [ ] Validar `RLS` con admin del viaje
- [ ] Validar `RLS` con creador global
- [ ] Confirmar que un miembro no puede editar contenido de otro
- [ ] Confirmar que solo admin puede editar reservas
- [ ] Confirmar que solo admin puede cerrar liquidacion
- [ ] Confirmar acceso privado a documentos y tickets

## 4. Flujos criticos

- [ ] Crear viaje
- [ ] Editar viaje
- [ ] Invitar por email
- [ ] Aceptar invitacion por enlace
- [ ] Cambiar rol de miembro a admin y viceversa
- [ ] Crear sitio
- [ ] Crear favorito
- [ ] Crear reserva
- [ ] Crear parada de itinerario
- [ ] Reordenar itinerario
- [ ] Calcular ruta en mapa
- [ ] Crear gasto con ticket
- [ ] Reparto personalizado
- [ ] Recalcular liquidacion
- [ ] Marcar deuda como saldada
- [ ] Cerrar liquidacion
- [ ] Subir documento
- [ ] Enviar mensaje
- [ ] Recibir notificacion

## 5. QA visual

- [ ] Revisar login, registro, verify y recovery
- [ ] Revisar dashboard de viajes
- [ ] Revisar miembros e invitaciones
- [ ] Revisar sitios, favoritos y reservas
- [ ] Revisar itinerario y mapa
- [ ] Revisar gastos y liquidacion
- [ ] Revisar documentos
- [ ] Revisar mensajes
- [ ] Revisar notificaciones
- [ ] Revisar explore y settings
- [ ] Validar consistencia contra Stitch en `mobile`
- [ ] Validar consistencia contra Stitch en `desktop`

## 6. PWA

- [ ] Confirmar instalacion desde Chrome/Edge
- [ ] Confirmar `standalone display mode`
- [ ] Confirmar iconos y manifest
- [ ] Confirmar recarga correcta tras instalar

## 7. CI y repo

- [ ] Confirmar que GitHub Actions pasa en `main`
- [ ] Confirmar que `npm test` pasa local
- [ ] Confirmar que `npm run build` pasa local
- [ ] Crear tag final de release o checkpoint

## 8. Despliegue

- [ ] Elegir destino final del frontend
- [ ] Configurar variables de entorno del hosting
- [ ] Desplegar preview
- [ ] Validar auth en preview
- [ ] Validar mapas en preview
- [ ] Desplegar produccion

## Orden recomendado

1. Configuracion
2. InsForge Auth
3. Seguridad y permisos
4. Flujos criticos
5. QA visual
6. PWA
7. CI y repo
8. Despliegue
