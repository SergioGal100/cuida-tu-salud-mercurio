# Tutorial 02 · Un test de punta a punta

La mejor forma de entender el código es seguir un dato. Aquí seguimos un test desde el primer toque hasta la fila en la base, archivo por archivo. Ten VS Code abierto al lado.

## Paso 1 · La persona abre `/test`

**[src/app/test/page.tsx](../../src/app/test/page.tsx)** es una página estática (`force-static`) que solo dibuja `<TestCliente />`.

**[src/app/test/TestCliente.tsx](../../src/app/test/TestCliente.tsx)** es el punto de unión:

- trae el pack y los municipios desde `composition/contenido`;
- trae los casos de uso desde `composition/client` (`casosDeUsoCliente()`);
- arranca la sincronización (`useSincronizacion`);
- muestra `FlujoTest` o, si la URL tiene `#historial`, `MisResultados`.

## Paso 2 · Las preguntas

**[src/presentation/components/test/FlujoTest.tsx](../../src/presentation/components/test/FlujoTest.tsx)** guarda en estado de React el índice del paso y las respuestas.

¿Qué pantallas hay? Las decide una función pura del dominio:

**[src/domain/evaluacion/flujo.ts](../../src/domain/evaluacion/flujo.ts)** → `pasosDelTest(pack, respuestas)`. Si la quema no es "no", agrega la alarma aguda; si la alarma es "si", corta y va al resultado.

Cada toque llama a `responder(nuevas)`, que guarda la respuesta y avanza. Cuando el siguiente paso es `resultado`, llama a `terminar()`.

> 🔍 **Breakpoint sugerido:** dentro de `responder` en `FlujoTest.tsx`. Abre las DevTools del navegador (F12) → *Sources*.

## Paso 3 · Evaluar y guardar en el celular

`terminar()` llama a `realizarTest(respuestas)`, que es el caso de uso:

**[src/application/use-cases/cliente/RealizarTest.ts](../../src/application/use-cases/cliente/RealizarTest.ts)**

1. `limpiarRespuestas()`: borra lo que no corresponde (por ejemplo, una alarma sin quema).
2. `evaluar(respuestas, pack)`: el motor ([evaluar.ts](../../src/domain/scoring/evaluar.ts)).
3. Arma la `Evaluacion` con un id nuevo (`GeneradorId`) y la hora (`Reloj`).
4. `bandeja.agregar(...)`: queda pendiente de envío.
5. Si no es promotor, `historial.guardar(...)`.

¿Qué es `bandeja` en realidad? Lo decide **[composition/client.ts](../../src/composition/client.ts)**: `BandejaDexie`, que escribe en IndexedDB.

> 🔍 Para verlo: F12 → *Application* → *IndexedDB* → `tamizaje-mercurio` → `bandeja`.

## Paso 4 · Mostrar el resultado

`FlujoTest` recibe la evaluación y dibuja **[Resultado.tsx](../../src/presentation/components/test/Resultado.tsx)**: semáforo, título y mensaje del pack según el nivel (o URGENTE), motivos, acciones, muestra sugerida, dudas, alarmas y aviso.

## Paso 5 · Enviar cuando hay señal

**[src/presentation/hooks/useSincronizacion.ts](../../src/presentation/hooks/useSincronizacion.ts)** llama a `sincronizar()` al abrir, en el evento `online`, cada 2 minutos y justo después del test.

**[src/application/use-cases/cliente/SincronizarPendientes.ts](../../src/application/use-cases/cliente/SincronizarPendientes.ts)** toma hasta 50 pendientes y los manda con el puerto `ClienteEnvio`.

**[src/infrastructure/http/ClienteEnvioHttp.ts](../../src/infrastructure/http/ClienteEnvioHttp.ts)** hace el `fetch` a `POST /api/v1/evaluaciones/lote`, sin cookies.

> 🔍 F12 → *Network* → filtra por `lote`. Mira el cuerpo: no hay nombre ni nada que identifique.

## Paso 6 · El servidor recibe

**[src/app/api/v1/evaluaciones/lote/route.ts](../../src/app/api/v1/evaluaciones/lote/route.ts)**: tamaño máximo → Zod ([loteSchema.ts](../../src/presentation/schemas/loteSchema.ts)) → caso de uso.

**[src/application/use-cases/servidor/RecibirLote.ts](../../src/application/use-cases/servidor/RecibirLote.ts)**:

1. Descarta ids repetidos.
2. Recalcula cada test con el **mismo** `evaluar()`.
3. Compara con lo que calculó el celular (`discrepancia`).

**[src/infrastructure/prisma/EvaluacionRepositoryPrisma.ts](../../src/infrastructure/prisma/EvaluacionRepositoryPrisma.ts)** inserta con `createManyAndReturn` + `skipDuplicates`.

## Paso 7 · Confirmación

El servidor responde `{ aceptados, repetidos }`. `SincronizarPendientes` los saca de la bandeja (`marcarEnviadas`) y "Mis resultados" pasa a "Todo enviado, sin nombre".

## Verlo en la base

```bash
npx prisma studio
```

Abre un panel web con las tablas. En `evaluacion` vas a ver tu test con `origen = AUTO`, el `nivel` que calculó el servidor y `discrepancia = false`.

## Resumen visual

```
toque → FlujoTest.responder → pasosDelTest (domain)
      → terminar → RealizarTest.ejecutar (application)
                     ├ evaluar (domain)
                     ├ BandejaDexie.agregar  (IndexedDB)
                     └ HistorialDexie.guardar (IndexedDB)
      → Resultado

señal → useSincronizacion → SincronizarPendientes → ClienteEnvioHttp
      → POST /api/v1/evaluaciones/lote → loteSchema (Zod)
      → RecibirLote → evaluar (otra vez, en el servidor)
      → EvaluacionRepositoryPrisma → PostgreSQL (Neon)
      → { aceptados } → bandeja.marcarEnviadas
```
