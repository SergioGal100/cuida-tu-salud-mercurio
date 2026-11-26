# Tamizaje de exposición al mercurio — hackathon (prototipo Gold4Good)

App de tamizaje (no de diagnóstico) para mineros cooperativistas, pobladores de zonas afectadas y personal de salud en Bolivia. **Se presenta el jueves 26 de noviembre de 2026**: priorizar que funcione la demo por encima de pulir. Todos los datos son de prueba.

Plan completo (fuente de verdad del diseño): https://claude.ai/artifact/FTU4tU7TvDBhqhzs4BPxSV

## Qué hace

1. **App pública (sin internet)**: la persona responde un test de 12 a 14 toques, ve su nivel (VERDE / AMARILLO / ROJO, o URGENTE) con motivos y qué hacer, y guarda su historial en el celular. El test se envía **solo y sin nombre** cuando vuelve la señal.
2. **App de posta (en línea, con login)**: el médico hace el mismo cuestionario en modo entrevista, registra examen y conducta, carga laboratorio y el nivel se recalcula.
3. **Vigilancia**: tabla por municipio con supresión de celdas pequeñas (< 5) y alertas, con un botón "recalcular alertas" para la demo.

## Reglas que no se negocian

- **No es diagnóstico.** Nunca decir "envenenamiento" ni "intoxicado", nunca porcentajes. Siempre mostrar: "Esta prueba no confirma ni descarta una intoxicación por mercurio."
- **Anonimato total.** Nunca pedir ni guardar nombre, carnet, teléfono, fecha de nacimiento, GPS ni IP. Edad en rangos. Ubicación solo por municipio, con "Prefiero no decir". Los envíos no llevan id de persona ni de dispositivo. El historial vive solo en IndexedDB del celular.
- **Nada que suene a fiscalización.** No preguntar cooperativa, mina, origen o cantidad de mercurio, ni permisos. Lenguaje de salud. Los textos salen de `content/content_pack.json`.
- **No hay código QR.** Se descartó.
- **Puntajes, cortes, reglas y textos viven en `content/content_pack.json`**, nunca escritos en el código.
- **Arquitectura limpia, obligatoria** (ver abajo).

## Stack

Next.js 15 (App Router) + TypeScript · Tailwind CSS + shadcn/ui · Serwist (`@serwist/next`) · Dexie · Zod · Auth.js v5 (credenciales + bcrypt) · Prisma + PostgreSQL · Vitest · Leaflet (solo si sobra tiempo).
Demo: **Vercel + Neon**. Producción: `docker-compose` (postgres, app standalone, cron, Caddy). No usar certificado autofirmado.

## Arquitectura limpia

```
src/
  domain/            # puro: scoring/ (evaluar), evaluacion/, consulta/, vigilancia/
  application/
    ports/           # EvaluacionRepository, BandejaSalida, HistorialLocal, ConsultaRepository, Reloj, GeneradorId
    use-cases/cliente/   # RealizarTest, SincronizarPendientes, VerHistorial
    use-cases/servidor/  # RecibirLote, RegistrarConsulta, CargarLaboratorio, ListarCasos, ResumenVigilancia, CalcularAlertas
  infrastructure/    # prisma/, dexie/, http/ (cliente de sync), auth/, content/
  presentation/      # components/ (ui, test, posta, vigilancia), hooks/, schemas/ (Zod DTO <-> dominio)
  composition/       # server.ts (Prisma) y client.ts (Dexie + HTTP)
  app/               # solo rutas Next.js: páginas, route handlers delgados, sw.ts
content/             # content_pack.json, casos.json, municipios.json
tests/
```

1. Dependencias hacia adentro: `domain` no importa nada del proyecto; `application` solo `domain`; `infrastructure` y `presentation` importan `application` y `domain`; `app/` solo usa `composition` y `presentation`.
2. `domain` y `application` son isomorfos: prohibido `fetch`, `window`, `process.env`, Prisma, Dexie, `Date.now()`, `crypto.randomUUID()`. Hora e ids entran por `Reloj` y `GeneradorId`.
3. Route handlers delgados: Zod → dominio → caso de uso → respuesta. Sin reglas de negocio en `app/`.
4. Verificar con `eslint-plugin-boundaries` (el lint debe fallar si se rompe una capa).
5. Probar dominio y casos de uso con repositorios en memoria.

## Motor de puntaje

`evaluar(respuestas, pack, opciones?) → { puntajeExposicion, puntajeSintomas, puntaje, nivel, urgente, reglas, motivos, muestraSugerida, dudas, nivelLaboratorio?, advertencias? }`

- Exposición (tope 50) + síntomas (tope 40, cada grupo suma una vez). Respuesta ausente = 0. "duda" = 0 y va a `dudas`.
- Nivel base por rangos; luego reglas en orden de prioridad. **Las reglas solo suben el nivel.** `reglas` lista todas las que se cumplen, en orden de prioridad.
- `opciones.fechaReferencia` reemplaza al reloj (laboratorio vigente 90 días).
- **Debe pasar los 17 casos de `content/casos.json`** (verificados con una implementación de referencia).

## Flujo de la app pública

Confianza (3 frases) → quién responde → municipio → embarazo o lactancia / niños en casa → rango de edad y sexo (opcionales) → quema → alarma aguda (solo si quema ≠ "no"; si es "sí", se corta y se muestra URGENTE) → manipulación → tiempo → pescado → 6 síntomas → resultado → "Mis resultados" (historial: fecha, nivel, puntaje, síntomas nuevos).

Offline en Next.js: todo el test vive en **una sola ruta `/test`** con `export const dynamic = "force-static"` y un componente de cliente. Los pasos son estado de React, no rutas. Sin Server Components con datos ni Server Actions en el test. JSON importados directo. `/test` y `/sin-conexion` van en `additionalPrecacheEntries` de Serwist. Probar con `next build && next start`, nunca con `next dev`. Modo promotor: no guarda historial.

No existe prototipo previo: la identidad visual se crea en el proyecto (tokens y clases en `src/app/globals.css`, fuente Atkinson Hyperlegible vía `next/font`, solo tema claro). Los símbolos SVG se crean con los ids que usa el pack (`sym-*`, `work-art-*`).

## Orden de trabajo

**Bloque 1, imprescindible** (no empezar el bloque 2 hasta que esto funcione desplegado en Vercel y probado desde un celular real):
1. Esqueleto: create-next-app, shadcn/ui, capas, lint de dependencias, manifest, estilos del prototipo.
2. Dominio `scoring` + Vitest contra `casos.json`.
3. Test y resultado.
4. Offline: Serwist + Dexie + bandeja de salida + historial.
5. Prisma + Neon, `RecibirLote`, `POST /api/v1/evaluaciones/lote` (idempotente por id, recalcula con el mismo motor, marca `discrepancia`), catálogo. Desplegar en Vercel.

**Bloque 2, demo completa**: posta (login con usuario de prueba, entrevista reutilizando componentes del test, ficha, laboratorio con recálculo) · vigilancia (tabla por municipio, supresión < 5, botón recalcular alertas, aviso "Datos de prueba") · `prisma db seed` con ~300 evaluaciones simuladas.

**Bloque 3, solo si sobra tiempo**: mapa Leaflet, filtros en "Mis casos", Vercel Cron, probar `docker-compose`.

## Forma de trabajar

- Antes de cada bloque, mostrar un plan corto (archivos a crear o tocar) y esperar el visto bueno.
- Commits pequeños por paso, solo en Git local.
- **Regla de entrega**: al terminar cada módulo o feature, dar un orden de lectura priorizado de los archivos y 5 preguntas críticas de comprensión; esperar respuestas y aprobación antes de pasar a cambios de diseño o nuevas modificaciones.
- Textos de la interfaz en español de Bolivia, tratando de "tú" (pendiente decidir "vos").
