# Tutorial 01 · Correr el proyecto en tu computadora

Al terminar vas a tener la app corriendo en `http://localhost:3000`, conectada a la base de Neon, y las pruebas pasando.

## 1. Lo que necesitas instalado

| Herramienta | Versión usada | Cómo comprobar |
|---|---|---|
| Node.js | 24 (sirve 20 o más) | `node -v` |
| pnpm | 11.5 | `pnpm -v` |
| Git | cualquiera reciente | `git --version` |

Si no tienes pnpm, instálalo con `npm install -g pnpm`.

## 2. Instalar dependencias

```bash
cd D:\Good_for_gold
pnpm install
```

Esto también corre `prisma generate` (el script `postinstall`), que crea el cliente de base de datos a partir de `prisma/schema.prisma`.

> **Nota:** el proyecto usa `nodeLinker: hoisted` en [pnpm-workspace.yaml](../../pnpm-workspace.yaml): `node_modules` es una carpeta plana, sin enlaces simbólicos. Es a propósito (ver el tutorial de despliegue).

## 3. Configurar las variables de entorno

Las variables de entorno son valores que el programa lee al arrancar y que **no** van en el código: contraseñas, direcciones de la base, claves. Viven en un archivo `.env` que **Git ignora**, así nunca se suben al repositorio.

Copia la plantilla:

```bash
cp .env.example .env
```

y completa:

```bash
# Base de datos (Neon). La "pooled" tiene -pooler en el host.
DATABASE_URL="postgresql://USUARIO:CLAVE@ep-xxxx-pooler.c-2.sa-east-1.aws.neon.tech/neondb?sslmode=require&connect_timeout=15"
# La directa es la misma sin -pooler. Prisma la usa para migrar.
DATABASE_URL_DIRECTA="postgresql://USUARIO:CLAVE@ep-xxxx.c-2.sa-east-1.aws.neon.tech/neondb?sslmode=require&connect_timeout=15"
# Clave para firmar las sesiones de la posta. Genera una con: npx auth secret
AUTH_SECRET="una-cadena-larga-y-aleatoria"
```

Las cadenas reales están en el panel de Neon (*Connect*). Tu `.env` actual ya tiene las de la demo.

> **Ojo con `channel_binding=require`:** Neon lo agrega al copiar la cadena, pero el motor de Prisma 6 no lo maneja bien. Quítalo.

## 4. Preparar la base (solo la primera vez, o si cambias el esquema)

```bash
pnpm db:migrate   # crea o actualiza las tablas (prisma migrate deploy)
pnpm db:seed      # municipios de prueba, una posta y 3 usuarios
```

Los dos comandos se pueden repetir sin problema: si ya está hecho, no duplican nada.

## 5. Correr la app

Para desarrollar, con recarga automática al guardar:

```bash
pnpm dev
```

Abre `http://localhost:3000`. Con `pnpm dev` **el service worker está apagado**, así que el modo sin internet no funciona. Para probarlo:

```bash
pnpm build
pnpm start
```

## 6. Verificar que todo está bien

```bash
pnpm test        # 57 pruebas
pnpm lint        # estilo + reglas de capas
pnpm typecheck   # tipos
```

Si los tres pasan, el proyecto está sano.

## Problemas frecuentes

| Síntoma | Causa | Solución |
|---|---|---|
| `P1013: The provided database string is invalid` | `DATABASE_URL` vacía o mal copiada | Revisa el `.env`: comillas, sin espacios, empieza con `postgresql://` |
| La primera consulta tarda 5 a 10 segundos | Neon "duerme" la base si no se usa | Normal en el plan gratis; las siguientes son rápidas |
| `pnpm lint` revisa miles de archivos | Carpetas generadas | `.next` y `.netlify` ya están ignoradas en [eslint.config.mjs](../../eslint.config.mjs) |
| El test no funciona sin internet | Estás en `pnpm dev` | Usa `pnpm build && pnpm start` |
