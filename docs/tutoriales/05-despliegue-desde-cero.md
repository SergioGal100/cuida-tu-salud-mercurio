# Tutorial 05 · Despliegue explicado desde cero

Este tutorial explica qué significa "desplegar", qué piezas usamos, qué se hizo paso a paso para publicar esta app, qué falló en el camino y cómo repetirlo tú solo.

---

## Parte 1 · Los conceptos

### ¿Qué es desplegar?

En tu computadora la app corre en `http://localhost:3000`, que solo existe para ti. **Desplegar** es poner la app en una computadora que está siempre prendida en internet (un *servidor*), con una dirección pública como `https://cuida-tu-salud-mercurio.netlify.app`, para que cualquier celular la abra.

Esta app necesita dos cosas en internet:

| Pieza | Qué hace | Servicio usado |
|---|---|---|
| **Hosting** | Sirve las páginas, el JavaScript, el service worker y la API | **Netlify** |
| **Base de datos** | Guarda las evaluaciones, consultas y usuarios | **Neon** (PostgreSQL) |

```
   Celular ──HTTPS──▶  Netlify  ──conexión segura──▶  Neon
                      (la app)                    (PostgreSQL)
```

### ¿Por qué HTTPS es obligatorio?

El **service worker**, la pieza que hace que la app funcione sin internet, solo se activa en sitios HTTPS (o en `localhost`). Netlify da HTTPS gratis y automático. Por eso nunca hay que usar un certificado "autofirmado": el celular lo rechaza y la app no funcionaría sin internet.

### ¿Qué es "el build"?

El código que escribimos (TypeScript, React) no es lo que corre en producción. `next build` lo **compila**:

- **páginas estáticas** (HTML ya generado), como `/` y `/test`;
- **JavaScript** optimizado para el navegador;
- **funciones de servidor**, para lo dinámico: la API y la posta;
- el **service worker** (`public/sw.js`), que genera Serwist.

Netlify toma ese resultado y lo reparte: lo estático va a su red de distribución (CDN) y las funciones a sus servidores (AWS Lambda, Linux).

### ¿Qué son las variables de entorno y los "secretos"?

Son valores que la app lee al arrancar y que **no van en el código**, porque son privados o cambian según dónde corre:

| Variable | Para qué |
|---|---|
| `DATABASE_URL` | Dirección y contraseña de la base (conexión con *pool*) |
| `DATABASE_URL_DIRECTA` | Lo mismo, sin *pool* (la usan las migraciones) |
| `AUTH_SECRET` | Clave con la que se firman las sesiones de la posta |

- En tu PC viven en `.env`, que **Git ignora** para que nunca se suban.
- En Netlify se cargan en el panel del sitio o con la CLI. Las marcamos como **secretas**: nadie puede leerlas después, ni siquiera desde la CLI.

### ¿Qué son las migraciones?

La base necesita sus **tablas** antes de guardar datos. `prisma/schema.prisma` describe las tablas; `prisma migrate` genera el SQL (en `prisma/migrations/`) y lo aplica. Aplicar una migración que ya está aplicada no hace nada, así que repetirla es seguro.

### ¿Qué es el *seed*?

Datos iniciales: los municipios de prueba, la posta y los usuarios de prueba. Lo hace [prisma/seed.ts](../../prisma/seed.ts) y también se puede repetir sin duplicar nada.

### ¿Qué es una CLI?

Un programa de línea de comandos. Usamos la **CLI de Netlify** (`netlify-cli`) para crear el sitio, cargar las variables y publicar, sin entrar al panel web. Se ejecuta con `npx`, que la descarga la primera vez sin instalarla en el proyecto.

---

## Parte 2 · Lo que se hizo, paso a paso

### Paso 1 · Crear la base en Neon

1. En neon.tech, crear un proyecto (gratis), región **AWS São Paulo** (`sa-east-1`), la más cercana a Bolivia.
2. **Sin** activar *Neon Auth*: el login de la posta lo hace Auth.js.
3. En **Connect**, copiar dos cadenas de conexión:
   - la **pooled** (el host tiene `-pooler`) → `DATABASE_URL`;
   - la **directa** (la misma sin `-pooler`) → `DATABASE_URL_DIRECTA`.
4. Ponerlas en `.env`, **quitando** `&channel_binding=require` (Prisma 6 no lo maneja bien) y agregando `&connect_timeout=15` (Neon "duerme" la base y tarda en despertar).

> **¿Por qué dos cadenas?** Las funciones de servidor abren muchas conexiones cortas; el *pooler* las reparte para no agotar la base. Las migraciones necesitan una conexión directa y estable.

### Paso 2 · Crear las tablas y los datos iniciales

Desde la PC, contra Neon:

```bash
pnpm db:migrate   # = prisma migrate deploy
pnpm db:seed      # municipios, posta y usuarios
```

Comprobación: un pequeño script contó 5 municipios usando la conexión *pooled*.

### Paso 3 · Intento con Vercel (falló)

El plan original era Vercel. Se ejecutó `npx vercel login`, que da un enlace y un código para aprobar en el navegador (*device login*). El login funcionó, pero Vercel respondió:

> *Your account requires further verification. Complete the account recovery form for further assistance.*

Esa verificación la revisa una persona y puede tardar días. Como la demo era al día siguiente, se cambió a Netlify. **Lección:** crea y prueba las cuentas de hosting antes del día del despliegue.

### Paso 4 · Login en Netlify

```bash
npx netlify-cli login
```

Abre un enlace `https://app.netlify.com/authorize?...` que hay que aprobar con el botón **Authorize**. El primer intento no quedó registrado (no se llegó a presionar *Authorize* después de crear la cuenta) y hubo que generar otro enlace. El token queda guardado en `%APPDATA%\netlify\Config\config.json`.

Para comprobarlo:

```bash
npx netlify-cli status
```

### Paso 5 · Crear el sitio

```bash
npx netlify-cli sites:create --name cuida-tu-salud-mercurio --account-slug <tu-equipo>
```

Esto creó la dirección `https://cuida-tu-salud-mercurio.netlify.app` y **enlazó** la carpeta del proyecto con el sitio (`.netlify/state.json` guarda el id del sitio; Git lo ignora).

### Paso 6 · Cargar las variables secretas

```bash
npx netlify-cli env:set DATABASE_URL "postgresql://..." --secret --context production deploy-preview branch-deploy
npx netlify-cli env:set DATABASE_URL_DIRECTA "postgresql://..." --secret --context production deploy-preview branch-deploy
npx netlify-cli env:set AUTH_SECRET "..." --secret --context production deploy-preview branch-deploy
```

Un valor secreto no se puede guardar en el contexto `dev` (desarrollo local); por eso se listan los otros tres.

### Paso 7 · Configurar el build para Netlify

Archivos que se agregaron o cambiaron:

**[netlify.toml](../../netlify.toml)**: le dice a Netlify cómo compilar.

```toml
[build]
  command = "pnpm next build"
  publish = ".next"
[build.environment]
  NODE_VERSION = "22"
[[headers]]
  for = "/sw.js"     # el service worker nunca se guarda en la caché del navegador,
  [headers.values]   # así los celulares siempre ven si hay una versión nueva
    Cache-Control = "no-cache, no-store, must-revalidate"
```

Netlify detecta que es Next.js y usa su plugin `@netlify/plugin-nextjs`, que convierte el build de Next en lo que Netlify entiende.

**[prisma/schema.prisma](../../prisma/schema.prisma)**: agregar el motor de Prisma para Linux.

```prisma
binaryTargets = ["native", "rhel-openssl-3.0.x"]
```

Tu PC es Windows (`native`), pero las funciones de Netlify corren en Linux. Sin esto, la API fallaría con *"Query engine library for current platform could not be found"*.

**[next.config.ts](../../next.config.ts)**: asegurar que ese motor viaje dentro de las funciones (`outputFileTracingIncludes`).

### Paso 8 · Los problemas que aparecieron (y cómo se resolvieron)

Esto es lo que más enseña. Cada error, su causa y su arreglo:

| # | Error | Causa | Arreglo |
|---|---|---|---|
| 1 | `P1013: The provided database string is invalid` durante el build | Al compilar en tu PC, Netlify reemplaza las variables secretas por un valor oculto; Prisma intentó migrar con eso | Sacar las migraciones del build. Se hacen aparte con `pnpm db:migrate`. El build solo compila |
| 2 | `EEXIST: file already exists, symlink ... postcss` | En Windows, el plugin de Next.js de Netlify falla con los enlaces simbólicos que usa pnpm en `node_modules` | `nodeLinker: hoisted` en [pnpm-workspace.yaml](../../pnpm-workspace.yaml): `node_modules` plano, sin enlaces |
| 3 | `Failed publishing static content` | El plugin necesita **renombrar** la carpeta `.next`, y Windows no lo permite si otro programa la tiene abierta: **VS Code** (su servidor de TypeScript lee `.next/types`) | Compilar en una **copia** del proyecto fuera de la carpeta que abre VS Code: [scripts/deploy-netlify.sh](../../scripts/deploy-netlify.sh) |
| 4 | Todas las páginas daban **401** y pedían login de Netlify | El equipo de Netlify tenía activada por defecto la protección *Team login* para todos los sitios | Desactivarla para este sitio: `sso_login: false` (ver abajo) |
| 5 | El disco C: se llenó | La primera versión del script copiaba el proyecto a `AppData` en C:, que ya estaba casi lleno | La copia ahora va al lado del proyecto, en D: (`D:\cuida-tu-salud-deploy`) |

Cómo se desactivó la protección (error 4):

```bash
npx netlify-cli api updateSite --data '{"site_id":"<ID del sitio>","body":{"sso_login":false}}'
```

También se puede en el panel: *Site configuration → Access & security → Visitor access*.

### Paso 9 · Publicar

```bash
pnpm deploy:netlify
```

Esto corre [scripts/deploy-netlify.sh](../../scripts/deploy-netlify.sh), que hace tres cosas:

1. Copia el proyecto (sin `node_modules`, `.next`, `.git` ni `.env`) a `D:\cuida-tu-salud-deploy`.
2. Instala dependencias allí (`pnpm install --frozen-lockfile`, que usa exactamente las versiones de `pnpm-lock.yaml`).
3. Ejecuta `netlify deploy --prod`, que compila y sube.

Al final aparece:

```
✔ Deploy is live!
Production URL: https://cuida-tu-salud-mercurio.netlify.app
```

### Paso 10 · Verificar en producción

1. Que las rutas respondan 200:
   ```bash
   curl -I https://cuida-tu-salud-mercurio.netlify.app/test
   curl https://cuida-tu-salud-mercurio.netlify.app/api/v1/catalogo/version
   ```
2. El recorrido sin internet del [tutorial 04](04-probar-sin-internet.md), en producción y en un celular real.
3. La posta: entrar con `medico@demo.bo`, hacer una entrevista y cargar laboratorio.

---

## Parte 3 · Cómo repetirlo tú

### Publicar un cambio (lo más común)

```bash
pnpm test && pnpm lint      # que nada esté roto
git add -A && git commit -m "..."
pnpm deploy:netlify
```

### Si cambiaste el esquema de la base (`schema.prisma`)

```bash
npx prisma migrate dev --name describe-el-cambio   # crea la migración (en una base de desarrollo)
pnpm db:migrate                                    # la aplica en Neon (usa el .env)
pnpm deploy:netlify
```

> `migrate dev` puede **borrar datos** si detecta cambios incompatibles. Contra Neon usa siempre `pnpm db:migrate` (`migrate deploy`), que solo aplica migraciones ya creadas.

### Si cambiaste una contraseña o clave

```bash
npx netlify-cli env:set DATABASE_URL "nuevo valor" --secret --context production deploy-preview branch-deploy
pnpm deploy:netlify   # las variables nuevas se aplican en el próximo despliegue
```

### Volver a una versión anterior

En el panel de Netlify → *Deploys*: cada despliegue queda guardado. Elige uno anterior y usa **Publish deploy**. Es instantáneo y no requiere compilar.

### Ver errores del servidor en producción

Panel de Netlify → *Logs → Functions*. Ahí aparecen los errores de la API y de la posta (por ejemplo, de conexión a la base).

---

## Parte 4 · Lista de verificación antes de la demo

- [ ] `pnpm test` y `pnpm lint` pasan.
- [ ] `pnpm deploy:netlify` terminó con *Deploy is live!*
- [ ] La app abre en el celular de la demo y está **instalada** (agregada a la pantalla de inicio).
- [ ] Modo avión → test → quitar modo avión → *Todo enviado* (probado en ese celular).
- [ ] La posta abre con sesión iniciada en la laptop.
- [ ] Neon "despierto": abre la posta unos minutos antes para que la primera consulta no tarde.
- [ ] Datos móviles o hotspot propio: no depender del Wi-Fi del evento.

## Glosario rápido

| Término | Significado |
|---|---|
| Hosting | Servicio que sirve tu app en internet |
| CDN | Red de servidores que entrega archivos estáticos rápido desde cerca del usuario |
| Función de servidor (*serverless*) | Código que corre solo cuando llega una petición (la API, la posta) |
| Variable de entorno | Valor de configuración fuera del código |
| Secreto | Variable que, una vez guardada, nadie puede volver a leer |
| Migración | Cambio versionado en la estructura de la base |
| Seed | Datos iniciales de la base |
| *Pooler* | Intermediario que reparte las conexiones a la base |
| Service worker | Script del navegador que guarda la app y la sirve sin internet |
| CLI | Programa de línea de comandos |
