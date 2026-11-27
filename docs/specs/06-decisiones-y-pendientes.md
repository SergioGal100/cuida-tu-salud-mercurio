# Spec 06 · Decisiones y pendientes

Registro de las decisiones tomadas al construir el prototipo, con su motivo. Si alguna se revierte, anótalo aquí.

## Decisiones de producto y contenido

| Decisión | Motivo |
|---|---|
| Identidad visual propia (no había prototipo previo) | La carpeta `prototipo/` no existía. Se creó un tema claro de alto contraste, la fuente Atkinson Hyperlegible y pictogramas SVG con los ids del pack |
| Solo tema claro | Se lee mejor al sol |
| Textos nuevos de la interfaz en el pack (`app`, `ui`, `postaUi`) | Regla del proyecto: ningún texto escrito en el código |
| `pescado` usa el ícono `work-art-fish` (antes `null`) | Para que todas las preguntas tengan pictograma |
| Edad y sexo en una sola pantalla con "Saltar" | Son opcionales; menos toques |
| No se pregunta la comunidad, solo el municipio | Menos toques y más anonimato (CLAUDE.md pide solo municipio) |
| Rediseño "menos plano" (26 nov): fondo crema, sombras, degradados e ilustraciones en dos tonos | La revisión pidió más volumen. Se siguió el anexo visual del PDF y las fotos del panel (en [referencias/](../referencias/)), pero se mantuvieron Atkinson Hyperlegible y el verde azulado |
| El PDF "Mercurio Health Check" se usa solo como referencia visual | Propone mapa corporal, pruebas motoras, QR, comunidad y edad exacta: varias cosas chocan con las reglas del CLAUDE.md y no entran en el tiempo |
| Vigilancia sin porcentajes: "41 de 118" con una barra | Regla del proyecto "nunca porcentajes" |
| Mapa de vigilancia esquemático en SVG (no Leaflet) | Funciona sin teselas ni internet, no sugiere ubicaciones exactas y los municipios son ficticios |
| Insignia Alto/Medio/Bajo por conteo de tests con visita recomendada | Cortes en `vigilancia.insignias` del pack; no hay tendencia en % |
| La muestra sugerida se calcula siempre | El caso 07 de `casos.json` lo exige; la pantalla decide si mostrarla |

## Decisiones técnicas

| Decisión | Motivo |
|---|---|
| Condiciones de reglas en código, una función por id | Un intérprete del texto de las condiciones era demasiado para el hackathon. Todo lo demás de la regla sigue en el pack |
| La alarma aguda solo cuenta si hubo quema | Evita urgencias falsas por envíos manipulados |
| Laboratorio con fecha futura se ignora (`laboratorio_fecha_futura`) | No lo cubría ningún caso de prueba; es la opción conservadora |
| `#historial` en vez de `?vista=historial` | Una URL con `?` no coincide con la página guardada en caché y fallaría sin internet |
| `reloadOnOnline: false` en Serwist | Recargar al volver la señal borraría un test a medio hacer |
| Respuestas del lote: solo ids (`^[A-Za-z0-9_-]+$`) | Impide que entre texto libre (un nombre, un carnet) |
| Examen de la posta solo con casillas | Mismo motivo: nada de texto libre que identifique |
| Prisma 6 (no 7) | La 7 cambia mucho la configuración; menos riesgo para la demo |
| Zod 4 | Venía con la instalación; se usa `z.email()`, `z.uuid()`, `z.iso.date()` |
| pnpm con `nodeLinker: hoisted` | El plugin de Next.js de Netlify falla en Windows con los enlaces simbólicos de pnpm |
| Desplegar compilando en una copia (`D:\cuida-tu-salud-deploy`) | VS Code bloquea la carpeta `.next` y Netlify no puede renombrarla |
| Botón de login siempre habilitado | Tras un error de Auth.js, `isPending` de React quedaba trabado y no se podía reintentar |
| Netlify en vez de Vercel | Vercel bloqueó la cuenta por verificación ([tutorial de despliegue](../tutoriales/05-despliegue-desde-cero.md)) |
| Base `neondb` (la que trae Neon por defecto) | Es la base de la cadena de conexión entregada |
| Llaves en `useEffect(() => { window.scrollTo(0, 0); })` | En Chrome reciente `scrollTo` devuelve una promesa; sin llaves React la tomaba como limpieza y el test se caía al pasar de paso (arreglado el 26 nov, también en producción) |
| Fecha de toma por defecto en hora local | `toISOString()` daba "mañana" después de las 20:00 en Bolivia |
| Vigilancia dentro de `/posta/vigilancia` | Reutiliza la sesión y la barra de la posta; solo roles EPIDEMIOLOGO y ADMIN |
| Evaluaciones simuladas con `version_pack = "simulacion-demo"` | El seed las borra y las rehace con fechas relativas a hoy; nunca toca las reales ni las que tienen consulta |

## Riesgos conocidos

- **La contraseña de Neon quedó escrita en el chat de desarrollo.** Después del hackathon, cámbiala en Neon (*Roles → neondb_owner → Reset password*) y actualiza el `.env` y las variables de Netlify.
- **Endpoint público sin límite de envíos todavía**: cualquiera podría mandar datos falsos (válidos en formato). Mitigación actual: validación estricta, recálculo en el servidor y marca de origen (AUTO separado de PROMOTOR y POSTA).
- **La primera visita necesita internet** (límite de toda PWA). En la demo, se instala la app con Wi-Fi antes de usarla.
- **Reglas con origen "propuesta"**: alerta aguda, grupo vulnerable, pescado con síntomas y quema cerrada. Tiene que aprobarlas el equipo clínico.
- **Rangos de laboratorio** (HBM-I / HBM-II): son valores guía y hay que validarlos con la normativa nacional.

## Pendiente (Bloque 2 y 3)

- [x] Vigilancia: tabla por municipio y nivel con supresión de celdas menores a 5, y autorreportados aparte de verificados.
- [x] Botón "Recalcular alertas" y lista de alertas.
- [x] Seed de unas 300 evaluaciones simuladas y una alerta lista para aparecer (Río Dorado).
- [ ] Límite de envíos por IP en `POST /evaluaciones/lote` (sin guardar la IP).
- [ ] Bloque 3: mapa Leaflet, tarea programada de alertas, probar `docker-compose`.
- [ ] Decidir "tú" o "vos".
- [ ] Handover completo (orden de lectura y preguntas) al terminar el desarrollo.
