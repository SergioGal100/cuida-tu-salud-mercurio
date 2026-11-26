# Spec 03 · App pública sin internet

## Qué ve la persona

1. **Inicio** (`/`): nombre de la app, "Hacer el test", "Mis resultados" y el aviso de que no es diagnóstico.
2. **Test** (`/test`), un toque por respuesta:
   - Confianza: 3 frases y "Empezar".
   - ¿Quién responde? (yo / promotor).
   - Municipio, o "Prefiero no decir".
   - Embarazo o lactancia → niños en casa.
   - Edad y sexo en una sola pantalla, opcionales ("Saltar").
   - Quema → **alarma aguda** (solo si hubo quema; si responde "Sí", el test se corta y sale URGENTE).
   - Manipulación → tiempo → pescado.
   - 6 síntomas (Sí / No / No sé).
   - **Resultado.**
3. **Resultado**: semáforo y título, mensaje, *Por qué* (motivos), *Qué hacer*, muestra sugerida (desde AMARILLO), *Para conversar en la posta* (incluye los "No sé"), alarmas inmediatas (desplegable) y el aviso fijo.
4. **Mis resultados** (`/test#historial`): fecha, nivel, puntaje y síntomas nuevos frente al test anterior. Dice cuántos tests esperan señal o "Todo enviado, sin nombre".

**Modo promotor**: si en "¿Quién responde?" se elige promotor, el test se envía pero **no se guarda en el historial** del celular, y aparece "Nueva persona" para empezar de cero.

## Cómo está hecho

| Pieza | Archivo |
|---|---|
| Qué pantallas hay según lo respondido (puro, probado) | [domain/evaluacion/flujo.ts](../../src/domain/evaluacion/flujo.ts) |
| El flujo en React (estado, no rutas) | [presentation/components/test/FlujoTest.tsx](../../src/presentation/components/test/FlujoTest.tsx) |
| Pantalla de resultado | [Resultado.tsx](../../src/presentation/components/test/Resultado.tsx) |
| Historial | [MisResultados.tsx](../../src/presentation/components/test/MisResultados.tsx) |
| Pictogramas SVG propios | [Simbolo.tsx](../../src/presentation/components/test/Simbolo.tsx) |
| Ruta y conexión con los casos de uso | [app/test/page.tsx](../../src/app/test/page.tsx), [TestCliente.tsx](../../src/app/test/TestCliente.tsx) |

### Por qué funciona sin internet

1. **Una sola ruta estática.** `/test` tiene `export const dynamic = "force-static"`. Los pasos son estado de React: cambiar de pregunta no pide ninguna página al servidor.
2. **Nada del servidor al renderizar.** `content_pack.json` y `municipios.json` se importan directo y quedan dentro del JavaScript.
3. **Service worker** ([app/sw.ts](../../src/app/sw.ts), configurado en [next.config.ts](../../next.config.ts)):
   - En la primera visita guarda en caché todo el build más `/`, `/test` y `/sin-conexion` (`additionalPrecacheEntries`).
   - `revision` cambia en cada despliegue, así el celular baja la versión nueva.
   - `reloadOnOnline: false`: al volver la señal **no** recarga la página, para no borrar un test a medio hacer.
   - `/posta`, `/vigilancia` y `/api/*` van siempre por red (`NetworkOnly`): datos clínicos que no deben quedar en un celular compartido.
   - Cualquier página no guardada, sin red → `/sin-conexion`.
4. El historial usa `#historial` (no `?vista=`) porque la URL con `#` coincide con la página guardada en caché.

**Límite real:** la primera visita necesita internet, como cualquier PWA.

## Datos en el celular (IndexedDB con Dexie)

Base `tamizaje-mercurio` ([infrastructure/dexie/db.ts](../../src/infrastructure/dexie/db.ts)) con dos tablas:

| Tabla | Qué guarda | Sale del celular |
|---|---|---|
| `bandeja` | Tests pendientes de envío | Sí, sin nombre, y se borra al confirmarse |
| `historial` | Los tests de esta persona | **Nunca** |

## Envío automático: patrón "bandeja de salida"

Caso de uso [SincronizarPendientes](../../src/application/use-cases/cliente/SincronizarPendientes.ts) y hook [useSincronizacion](../../src/presentation/hooks/useSincronizacion.ts):

- Se ejecuta al abrir `/test`, al volver la señal (evento `online`), cada 2 minutos y justo después de terminar un test.
- Envía en lotes de 50 a `POST /api/v1/evaluaciones/lote`.
- Lo que el servidor responde como `aceptados` o `repetidos` sale de la bandeja; si falla la red, todo sigue pendiente.
- Si se llama dos veces a la vez, la segunda espera a la primera (no duplica envíos).
- No usa Background Sync porque iPhone no lo soporta.

## Qué se envía (y qué no)

Cada evaluación lleva: `id` (UUID creado en el celular), `origen` (AUTO o PROMOTOR), `creadaEn`, `versionPack`, `respuestas` y un resumen del cálculo del celular (`puntaje`, `nivel`, `urgente`).

**No lleva** nombre, carnet, teléfono, fecha de nacimiento, GPS, id de persona ni id de dispositivo. La edad va en rangos y la ubicación es solo el municipio (o "Prefiero no decir"). La petición se hace con `credentials: "omit"`: sin cookies.

## Pruebas

- [flujo.test.ts](../../tests/domain/evaluacion/flujo.test.ts): pantallas según respuestas y corte por alarma.
- [RealizarTest.test.ts](../../tests/application/RealizarTest.test.ts): guarda en bandeja e historial; modo promotor; síntomas nuevos.
- [SincronizarPendientes.test.ts](../../tests/application/SincronizarPendientes.test.ts): lotes, idempotencia, sin red, sin duplicados.
- [dexie.test.ts](../../tests/infrastructure/dexie.test.ts): adaptadores Dexie con `fake-indexeddb`.
- Prueba manual offline: [tutorial 04](../tutoriales/04-probar-sin-internet.md).
