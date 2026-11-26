# Spec 04 · Servidor, base de datos y API

## Base de datos

PostgreSQL en **Neon** (demo) con **Prisma 6**. Esquema: [prisma/schema.prisma](../../prisma/schema.prisma). Migración inicial: [prisma/migrations/](../../prisma/migrations/).

Siete tablas. **Ninguna** guarda nombre, carnet, teléfono, fecha de nacimiento, coordenadas exactas ni IP.

| Tabla | Para qué | Columnas clave |
|---|---|---|
| `municipio` | Catálogo (el mismo de `content/municipios.json`) | `codigo` (PK), nombre, centro aproximado |
| `establecimiento` | Postas y centros de salud | `municipio_codigo`, `nivel_atencion` |
| `usuario` | Solo personal de salud | `email`, `password_hash` (bcrypt), `rol`, `establecimiento_id`, `activo` |
| `evaluacion` | Cada test (AUTO, PROMOTOR o POSTA) | `respuestas` y `resultado` (jsonb), `puntaje`, `nivel`, `urgente`, `reglas`, `version_pack`, `discrepancia` |
| `consulta` | Atención en la posta | `evaluacion_id` (la entrevista), `examen` (jsonb), `conducta`, `nivel_final`, `estado` |
| `resultado_laboratorio` | Análisis cargados | `muestra`, `valor`, `unidad`, `fecha_toma`, `nivel` |
| `alerta` | Alertas de vigilancia | `municipio_codigo`, `regla`, `conteo`, `estado` |

Las respuestas van en `jsonb` para que un cambio en el cuestionario no obligue a migrar. Lo que se filtra o agrupa (nivel, municipio, fechas, origen) va en columnas con índice.

**Conexiones** (ver [.env.example](../../.env.example)):

- `DATABASE_URL`: conexión con *pool* de Neon (host con `-pooler`). La usa la app.
- `DATABASE_URL_DIRECTA`: conexión directa. La usa Prisma para las migraciones.

**Motor de Prisma en Linux.** `binaryTargets = ["native", "rhel-openssl-3.0.x"]`: el primero sirve para tu PC, el segundo para los servidores de Netlify. [next.config.ts](../../next.config.ts) fuerza que ese archivo viaje dentro de las funciones (`outputFileTracingIncludes`).

## Endpoints

Todos bajo `/api/v1`, como route handlers de Next.js en `src/app/api/v1/`.

| Método | Ruta | Acceso | Qué hace |
|---|---|---|---|
| GET | `/catalogo/version` | Público | Versión del pack y cantidad de municipios |
| GET | `/catalogo/municipios` | Público | Lista de municipios |
| GET | `/catalogo/content-pack` | Público | El pack vigente |
| POST | `/evaluaciones/lote` | Público | Recibe hasta 50 tests anónimos |
| GET | `/consultas?estado=&nivel=` | Posta | Casos del establecimiento del usuario |
| POST | `/consultas` | Posta | Crea la consulta con su entrevista (origen POSTA) |
| PUT | `/consultas/{id}` | Posta | Guarda examen, conducta y estado |
| POST | `/consultas/{id}/laboratorio` | Posta | Agrega un análisis y devuelve el nivel recalculado |
| GET/POST | `/api/auth/...` | — | Rutas propias de Auth.js |

## Recepción de lotes: `POST /evaluaciones/lote`

Handler: [route.ts](../../src/app/api/v1/evaluaciones/lote/route.ts). Caso de uso: [RecibirLote.ts](../../src/application/use-cases/servidor/RecibirLote.ts).

1. Rechaza cuerpos de más de 256 KB (413).
2. Valida con [loteSchema.ts](../../src/presentation/schemas/loteSchema.ts) (400 si falla):
   - objetos **estrictos**: un campo extra como `nombre` o `carnet` se rechaza;
   - cada respuesta debe ser un **id del pack** (`^[A-Za-z0-9_-]{1,40}$`), así no entra texto libre;
   - `id` debe ser UUID; `origen` solo AUTO o PROMOTOR (POSTA entra únicamente por la posta, con sesión);
   - de 1 a 50 evaluaciones.
3. **Idempotente por id**: los ids ya guardados vuelven como `repetidos`. Un id repetido dentro del mismo lote cuenta una vez, y `skipDuplicates` cubre dos envíos simultáneos.
4. **No confía en el celular**: limpia las respuestas y **recalcula** con el mismo `evaluar()`. Si el cálculo del celular no coincide, marca `discrepancia = true`.
5. Un municipio desconocido o "prefiero no decir" se guarda como `null`.
6. Responde `{ aceptados: [...], repetidos: [...] }`.

El servidor **no guarda la IP** ni ningún identificador del dispositivo.

## Pruebas

- [RecibirLote.test.ts](../../tests/application/RecibirLote.test.ts): cálculo del servidor, idempotencia, discrepancia, municipio nulo y alarma sin quema.
- [loteSchema.test.ts](../../tests/presentation/loteSchema.test.ts): rechaza nombre, texto libre, campos extra, POSTA, ids que no son UUID y más de 50.

## Pendiente

- Límite de envíos por IP (sin guardarla) en el endpoint público.
- Vigilancia: resumen por municipio con supresión de celdas menores a 5, alertas y seed de unas 300 evaluaciones.
