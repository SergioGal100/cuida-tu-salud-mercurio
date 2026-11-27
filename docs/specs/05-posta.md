# Spec 05 · Posta (personal de salud)

Ruta: `/posta`. Funciona en línea y pide inicio de sesión. Ayuda al médico a decidir y registra el caso en la base central.

## Usuarios de prueba

Los crea [prisma/seed.ts](../../prisma/seed.ts). Todos tienen la contraseña `demo1234`.

| Correo | Rol | Establecimiento |
|---|---|---|
| `medico@demo.bo` | MEDICO | Posta de prueba Guanay |
| `epi@demo.bo` | EPIDEMIOLOGO | ninguno (para vigilancia) |
| `admin@demo.bo` | ADMIN | Posta de prueba Guanay |

## Pantallas

| Ruta | Qué hace | Archivo |
|---|---|---|
| `/posta/ingresar` | Login con correo y contraseña | [page.tsx](../../src/app/posta/ingresar/page.tsx), [FormIngreso.tsx](../../src/presentation/components/posta/FormIngreso.tsx) |
| `/posta` | "Mis casos" con filtros por nivel y estado | [page.tsx](../../src/app/posta/(privada)/page.tsx), [ListaCasos.tsx](../../src/presentation/components/posta/ListaCasos.tsx) |
| `/posta/nueva` | Entrevista: el mismo cuestionario del test | [EntrevistaCliente.tsx](../../src/app/posta/(privada)/nueva/EntrevistaCliente.tsx) |
| `/posta/casos/{id}` | Ficha clínica | [page.tsx](../../src/app/posta/(privada)/casos/[id]/page.tsx), [FichaConsulta.tsx](../../src/presentation/components/posta/FichaConsulta.tsx) |

El layout [(privada)/layout.tsx](../../src/app/posta/(privada)/layout.tsx) exige sesión para todo lo de `/posta` salvo el ingreso. Muestra "Datos de prueba", el correo del usuario y "Salir".

### Entrevista

Reutiliza `FlujoTest` en **modo entrevista**: sin la pantalla de confianza ni "¿Quién responde?". Al terminar no muestra el resultado al paciente: crea la consulta (`POST /api/v1/consultas`) y abre la ficha. Si falla la red, muestra el error y un botón "Reintentar" sin perder las respuestas.

### Ficha clínica

- **Nivel final** (sube si se carga laboratorio) y estado.
- **Resultado de la entrevista**: puntajes de exposición, síntomas y total; reglas aplicadas con su **origen** ("Propuesta: pendiente de aprobación clínica" o "Documento de criterios"); motivos; "No sé"; muestra sugerida con la guía para tomar orina.
- **Otras causas a considerar**: los diagnósticos diferenciales del pack para cada síntoma con "Sí".
- **Examen físico**: solo casillas (temblor observado, coordinación alterada, encías). Sin texto libre, para que no entre nada que identifique a la persona.
- **Conducta** (control, derivación, pedir laboratorio) y **estado** (abierto, en espera de laboratorio, cerrado).
- **Laboratorio**: muestra, unidad (según los rangos del pack), valor, fecha de toma y nombre del laboratorio (opcional). El servidor recalcula con `evaluar()` usando la fecha de hoy y muestra el nivel nuevo, el nivel del laboratorio y avisos (más de 90 días, fecha futura, sin rango).

## Casos de uso

[RegistrarConsulta.ts](../../src/application/use-cases/servidor/RegistrarConsulta.ts) y [Consultas.ts](../../src/application/use-cases/servidor/Consultas.ts):

| Caso de uso | Qué hace |
|---|---|
| `RegistrarConsulta` | Evalúa la entrevista y crea la evaluación (origen POSTA) más la consulta |
| `GuardarFicha` | Actualiza examen, conducta y estado |
| `CargarLaboratorio` | Guarda el análisis, recalcula y actualiza el nivel final |
| `ListarCasos` / `VerConsulta` | Lectura de casos |

## Seguridad y permisos

- **Contraseñas** con bcrypt. Si el correo no existe se compara igual contra un hash falso, así el tiempo de respuesta no revela qué correos existen.
- **Sesión** JWT de Auth.js de 8 horas (un turno). `AUTH_SECRET` va como variable de entorno secreta.
- **Cada médico solo ve su establecimiento.** El `establecimientoId` sale de la sesión, nunca del formulario, y **todas** las consultas del repositorio filtran por él. Si se pide la ficha de otra posta, el resultado es "no encontrada". Lo verifica una prueba.
- La atención clínica requiere rol MEDICO o ADMIN y tener establecimiento ([auth.ts](../../src/infrastructure/auth/auth.ts), `atencionActual`).
- Cada endpoint de posta vuelve a comprobar la sesión (401 sin ella) y valida con Zod estricto ([postaSchemas.ts](../../src/presentation/schemas/postaSchemas.ts)).
- El service worker nunca guarda `/posta` ni la API en caché.

## Pruebas

[Consultas.test.ts](../../tests/application/Consultas.test.ts) cubre cuatro cosas:

- la entrevista se registra con el nivel del motor;
- orina alta sube a ROJO;
- un laboratorio vencido no cambia el nivel y avisa;
- otra posta no puede ver, editar ni cargar laboratorio.

## Para la demo

Para mostrar que el laboratorio **sube** el nivel, la entrevista tiene que salir AMARILLO. Por ejemplo:

1. Responde: quema al aire libre sin respirador, guantes o barbijo común, más de 2 años, pescado casi nunca y todos los síntomas en "No".
2. Carga orina **25 µg/g de creatinina** con fecha de hoy.
3. El nivel final pasa a ROJO.

Si el paciente marca temblor con hormigueo y hubo quema sin protección, la entrevista ya da ROJO y no se ve el salto.
