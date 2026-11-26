# Documentación — Cuida tu salud: mercurio

Prototipo de tamizaje (no de diagnóstico) de exposición al mercurio para el hackathon Gold4Good.
Todos los datos son de prueba.

- App pública: https://cuida-tu-salud-mercurio.netlify.app
- Posta: https://cuida-tu-salud-mercurio.netlify.app/posta (usuario `medico@demo.bo`, contraseña `demo1234`)

## Por dónde empezar

Si nunca abriste este código, lee en este orden:

1. [Tutorial: correr el proyecto en tu computadora](tutoriales/01-correr-en-local.md)
2. [Spec: arquitectura y carpetas](specs/01-arquitectura.md)
3. [Tutorial: seguir un test de punta a punta](tutoriales/02-un-test-de-punta-a-punta.md)
4. [Spec: motor de puntaje](specs/02-motor-de-puntaje.md)

Después, según lo que necesites tocar.

## Especificaciones (qué hace el sistema y por qué)

| Documento | Contenido |
|---|---|
| [01 · Arquitectura](specs/01-arquitectura.md) | Capas, reglas de dependencia, lint, dónde va cada cosa |
| [02 · Motor de puntaje](specs/02-motor-de-puntaje.md) | `evaluar()`, reglas, laboratorio, cómo se prueba |
| [03 · App pública sin internet](specs/03-app-publica-offline.md) | Flujo del test, service worker, IndexedDB, bandeja de salida, historial |
| [04 · Servidor, base de datos y API](specs/04-servidor-y-api.md) | Prisma, tablas, endpoints, recepción de lotes, anonimato |
| [05 · Posta](specs/05-posta.md) | Login, entrevista, ficha clínica, laboratorio, permisos |
| [06 · Decisiones y pendientes](specs/06-decisiones-y-pendientes.md) | Registro de decisiones, riesgos conocidos y lo que falta |

## Tutoriales (cómo hacer cosas)

| Tutorial | Para qué |
|---|---|
| [01 · Correr en local](tutoriales/01-correr-en-local.md) | Instalar, configurar `.env`, levantar la app, correr pruebas |
| [02 · Un test de punta a punta](tutoriales/02-un-test-de-punta-a-punta.md) | Seguir el código desde el toque en el celular hasta la fila en la base |
| [03 · Cambiar contenido y reglas](tutoriales/03-cambiar-contenido-y-reglas.md) | Editar textos, puntajes, cortes y reglas sin romper nada |
| [04 · Probar sin internet](tutoriales/04-probar-sin-internet.md) | Verificar el modo offline en la PC y en el celular |
| [05 · Despliegue explicado desde cero](tutoriales/05-despliegue-desde-cero.md) | Qué es desplegar, cómo se hizo con Neon y Netlify, y cómo repetirlo |

## Comandos más usados

```bash
pnpm install          # instalar dependencias
pnpm test             # 57 pruebas (motor, casos de uso, base local, DTO)
pnpm lint             # incluye el lint de capas: falla si una capa importa a otra prohibida
pnpm typecheck        # tipos de TypeScript
pnpm build            # build de producción
pnpm start            # sirve el build (para probar offline: nunca con pnpm dev)
pnpm db:migrate       # aplica migraciones a la base del .env
pnpm db:seed          # municipios, posta y usuarios de prueba
pnpm deploy:netlify   # publica en Netlify
```
