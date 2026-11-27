# Spec 07 · Vigilancia y diseño visual

## Panel de vigilancia

Ruta: `/posta/vigilancia`. Solo para los roles **EPIDEMIOLOGO** y **ADMIN** (usuario de prueba `epi@demo.bo`, contraseña `demo1234`). Un médico que entra ve "Solo el personal de epidemiología puede ver este panel".

### Qué muestra

| Bloque | Contenido |
|---|---|
| Filtros (GET) | Periodo (7, 30 o 90 días; `vigilancia.periodosDias`) y origen: todos, autorreportado (celular o promotor) o verificado en la posta |
| KPIs | Tests recibidos, con visita recomendada (Amarillo, Rojo o Urgente), municipios en alerta, verificados en la posta |
| Mapa de calor | SVG esquemático: cada municipio es un punto en su `latCentro/lonCentro`, con un halo según los tests con visita recomendada. Los suprimidos se ven como un círculo punteado con "menos de 5" |
| Municipios por nivel | Conteo con visita recomendada e insignia Alto / Medio / Bajo (cortes en `vigilancia.insignias`) |
| Alertas abiertas | Lista y botón **Recalcular alertas** |
| Tests por semana | Últimas 12 semanas (no depende del periodo elegido) |
| Cambios y exposiciones más contados | "n de total", con una barra. **Sin porcentajes** |
| Tabla por municipio y nivel | Verde, Amarillo, Rojo, Urgente y Total, más una fila "Prefiero no decir" |
| Cómo se protege a las personas | Textos de `vigilancia.privacidad` |

### Supresión de celdas chicas

`vigilancia.supresionMinima = 5`. Un conteo entre 1 y 4 se publica como `null`, y la pantalla muestra "<5". El 0 sí se muestra.
- Si un municipio tiene menos de 5 tests en el periodo, se ocultan todos sus números y no tiene insignia ni halo en el mapa.
- Dentro de un municipio publicable, cada celda de nivel se suprime por separado.
- Los conteos de síntomas y exposiciones se suprimen si la base (tests que llegaron a los síntomas) es menor que 5.

### Alertas

Regla en `vigilancia.alerta`: un municipio entra en alerta si junta **`minimoRojos` (5) tests en ROJO o URGENTE en los últimos `ventanaDias` (7) días**. El botón hace `POST /api/v1/vigilancia/alertas`, que cierra las alertas abiertas y crea las nuevas (tabla `alerta`). En producción, la misma acción la correría una tarea programada (bloque 3).

### Código

| Capa | Archivo |
|---|---|
| Dominio (puro) | `src/domain/vigilancia/vigilancia.ts`: `resumirVigilancia`, `calcularAlertas`, `suprimir` |
| Puerto | `src/application/ports/VigilanciaRepository.ts` |
| Casos de uso | `src/application/use-cases/servidor/Vigilancia.ts`: `ResumenVigilancia`, `CalcularAlertas` |
| Infraestructura | `src/infrastructure/prisma/VigilanciaRepositoryPrisma.ts`, `VigilanciaEnMemoria` en `infrastructure/memoria/EnMemoria.ts` |
| Rutas | `src/app/posta/(privada)/vigilancia/page.tsx`, `src/app/api/v1/vigilancia/alertas/route.ts` |
| Pantalla | `src/presentation/components/vigilancia/` (`PanelVigilancia`, `graficos`, `BotonRecalcular`) |
| Pruebas | `tests/domain/vigilancia/vigilancia.test.ts`, `tests/application/Vigilancia.test.ts` |

### Datos simulados

`pnpm db:seed` genera unas 300 evaluaciones con `prisma/simulacion.ts`. Usa un PRNG con semilla fija y calcula el resultado con el mismo `evaluar()`.
- Las fechas se cuentan hacia atrás desde el día del seed, con más tests en las semanas recientes. **Volver a correr el seed el día de la demo** para que el periodo de 7 días tenga datos.
- Llevan `version_pack = "simulacion-demo"`: el seed solo borra y rehace esas filas.
- El reparto está pensado para la demo: Río Dorado dispara la alerta y Bajío del Sol queda con 3 tests, así se ve la supresión.

## Diseño visual

Tokens y clases en `src/app/globals.css`:
- Colores: fondo crema `#f6f1e7`, tarjetas `#fffdf9` y títulos en verde oscuro (`--titulo`).
- Sombras: `shadow-suave` y `shadow-elevada`.
- Clases: `.tarjeta`, `.hero` (degradado), `.circulo-icono`, `.insignia`, `.kpi-numero`, `.boton-principal` y `.boton-secundario`.

Ilustraciones propias en `src/presentation/components/ui/Ilustracion.tsx`:
- `hero`, `escudo`, `sin-documento` y `senal`.
- `nivel-VERDE`, `nivel-AMARILLO`, `nivel-ROJO` y `nivel-URGENTE`.
- `historial-vacio`, `sin-conexion` y `posta`.

Los pictogramas del pack (`Simbolo.tsx`) se dibujan en dos tonos: una copia rellena, corrida 2 px, detrás del trazo.

Referencias recibidas: [PDF del spec y fotos del panel](../referencias/).

## Actividades del chequeo

Después de los síntomas, y antes del resultado, se ofrecen 4 actividades opcionales. Se pueden saltar todas o cada una por separado:

| Actividad | Qué registra | Texto que ve la persona |
|---|---|---|
| Memoria visual (3 × 3) | Rondas de 3, 4 y 5 números (`actividades.memoria.longitudes`) | "Repetiste 2 de 3 secuencias. La más larga: 4 números." |
| Tiempo de reacción | 5 intentos con espera al azar de 1,2 a 3,5 s; los toques antes de la señal cuentan como anticipaciones | Mediana en ms |
| Desafío A/B | Toques alternados en 10 s y repetidos | "24 toques alternados en 10 segundos (1 con la misma letra seguida)." |
| Espiral | Trazo con el dedo sobre una espiral de Arquímedes de 3 vueltas | Duración y distancia media a la línea (px del dibujo de 300 × 300) |

**Reglas que se cumplen:**
- No cambian el nivel. Hay una prueba que lo verifica: `tests/application/RealizarTest.test.ts`.
- No dicen "normal" ni "anormal".
- No se envían al servidor. Prueba: `tests/infrastructure/envioHttp.test.ts`.
- Se guardan en `Evaluacion.actividades`, solo dentro de IndexedDB.

**Código:**
- Métricas puras: `src/domain/actividades/`.
- Pantallas: `src/presentation/components/actividades/Actividades.tsx`.
- Textos y parámetros: `actividades` en el pack.
