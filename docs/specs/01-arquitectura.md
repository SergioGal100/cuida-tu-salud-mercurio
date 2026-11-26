# Spec 01 · Arquitectura

## En una frase

Un solo proyecto Next.js 15 con TypeScript sirve tres cosas: la **app pública** (el test, funciona sin internet), la **app de posta** (en línea, con login) y la **API** que recibe los datos. La lógica de negocio vive separada del framework, en capas, y un lint impide mezclarlas.

```
Celular (sin señal)                         Servidor (Netlify)                 Base (Neon)
┌──────────────────────────┐   lote JSON   ┌───────────────────────────┐      ┌─────────────┐
│ /test  (página estática) │ ───────────▶  │ POST /api/v1/evaluaciones │ ───▶ │ PostgreSQL  │
│ motor evaluar()          │  sin nombre   │ recalcula con evaluar()   │      │ evaluacion  │
│ IndexedDB: bandeja +     │               │                           │      │ consulta    │
│            historial     │               │ /posta (login Auth.js)    │ ───▶ │ usuario ... │
└──────────────────────────┘               └───────────────────────────┘      └─────────────┘
```

El **mismo motor** `evaluar()` corre en el celular (para dar el resultado sin internet) y en el servidor (para no confiar en lo que llega).

## Las capas

```
src/
  domain/          Reglas puras. No importa nada del proyecto ni librerías.
  application/     Casos de uso + "puertos" (interfaces). Solo importa domain.
  infrastructure/  Implementaciones concretas: Prisma, Dexie, HTTP, Auth.js, lectura del pack.
  presentation/    Componentes React, hooks y esquemas Zod (DTO ↔ dominio).
  composition/     Arma los casos de uso con sus implementaciones (server.ts y client.ts).
  app/             Solo rutas de Next.js: páginas y route handlers delgados.
content/           content_pack.json, casos.json, municipios.json
tests/             Vitest
```

### Quién puede importar a quién

| Capa | Puede importar |
|---|---|
| `domain` | solo `domain` |
| `application` | `domain`, `application` |
| `infrastructure` | `domain`, `application`, `infrastructure`, `content/` |
| `presentation` | `domain`, `application`, `presentation` |
| `composition` | todo menos `app` |
| `app` | `composition`, `presentation`, `app` |

Esto lo verifica [eslint.config.mjs](../../eslint.config.mjs) con `eslint-plugin-boundaries`. Si alguien rompe una regla, `pnpm lint` falla con un mensaje como:

```
There is no policy allowing dependencies from elements of type "domain" to elements of type "presentation"
```

### Reglas extra para `domain` y `application`

Son **isomorfas**: corren igual en el navegador y en el servidor. Por eso el lint prohíbe ahí:

- `fetch`, `window`, `document`, `navigator`, `localStorage`, `indexedDB`, `process`, `crypto`
- `Date.now()`, `new Date()` sin argumentos, `Math.random()`
- importar cualquier librería externa (ni siquiera Zod)

La hora entra por el puerto [`Reloj`](../../src/application/ports/Reloj.ts) y los ids por [`GeneradorId`](../../src/application/ports/GeneradorId.ts). Así las pruebas controlan el tiempo y los ids sin trucos.

## Puertos y adaptadores (el patrón central)

Un **puerto** es una interfaz que el caso de uso necesita. Un **adaptador** es la implementación concreta.

| Puerto (`application/ports`) | Adaptador real | Adaptador de prueba |
|---|---|---|
| `BandejaSalida` | `infrastructure/dexie/BandejaDexie` | `infrastructure/memoria/EnMemoria` |
| `HistorialLocal` | `infrastructure/dexie/HistorialDexie` | `infrastructure/memoria/EnMemoria` |
| `ClienteEnvio` | `infrastructure/http/ClienteEnvioHttp` | objeto literal en la prueba |
| `EvaluacionRepository` | `infrastructure/prisma/EvaluacionRepositoryPrisma` | clase en memoria en la prueba |
| `ConsultaRepository` | `infrastructure/prisma/ConsultaRepositoryPrisma` | clase en memoria en la prueba |
| `Reloj` | `infrastructure/sistema/RelojSistema` | `{ ahora: () => new Date("...") }` |
| `GeneradorId` | `infrastructure/sistema/GeneradorUuid` | `{ nuevo: () => "id-1" }` |

Quien conecta puertos con adaptadores es la **composición**:

- [composition/client.ts](../../src/composition/client.ts): en el celular. Usa Dexie si hay IndexedDB; si no, memoria.
- [composition/server.ts](../../src/composition/server.ts): en el servidor. Usa Prisma. También reexporta la autenticación.
- [composition/contenido.ts](../../src/composition/contenido.ts): el pack y los municipios, para páginas que no necesitan nada más.

## Route handlers delgados

Todo handler sigue el mismo patrón. Ejemplo, [api/v1/evaluaciones/lote/route.ts](../../src/app/api/v1/evaluaciones/lote/route.ts):

1. Validar con Zod (esquema en `presentation/schemas`).
2. Convertir a tipos del dominio.
3. Llamar al caso de uso (de `composition/server`).
4. Devolver la respuesta.

Sin reglas de negocio en `app/`.

## Dónde va cada cosa nueva

| Quiero agregar… | Va en… |
|---|---|
| Una regla de cálculo o una validación de negocio | `domain/` + prueba en `tests/domain` |
| Una acción del usuario (guardar, enviar, listar) | caso de uso en `application/use-cases` + prueba con repositorio en memoria |
| Una tabla o consulta SQL | `prisma/schema.prisma` + adaptador en `infrastructure/prisma` |
| Un texto de la interfaz | `content/content_pack.json` (nunca en el código) |
| Una pantalla | componente en `presentation/components` + ruta en `app/` |
| Un endpoint | `app/api/v1/.../route.ts` + esquema Zod en `presentation/schemas` |

## Stack

| Pieza | Tecnología | Por qué |
|---|---|---|
| Framework | Next.js 15 (App Router, webpack) | App pública, posta y API en un solo proyecto |
| Estilos | Tailwind CSS 4 + tokens propios en `globals.css` | Rápido; semáforo y tema claro de alto contraste |
| Sin internet | Serwist (`@serwist/next`) | Service worker que guarda la app en caché |
| Datos en el celular | Dexie (IndexedDB) | Bandeja de salida e historial |
| Validación | Zod 4 | Mismos esquemas para el pack y la API |
| Login | Auth.js v5 (credenciales + bcryptjs) | Personal de salud |
| Base de datos | PostgreSQL (Neon) + Prisma 6 | Datos centrales y migraciones |
| Pruebas | Vitest + fake-indexeddb | Motor, casos de uso y adaptadores |
| Hosting | Netlify | Ver [tutorial de despliegue](../tutoriales/05-despliegue-desde-cero.md) |
