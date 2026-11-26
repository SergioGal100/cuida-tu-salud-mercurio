# Spec 02 · Motor de puntaje

Código: [src/domain/scoring/](../../src/domain/scoring/). Pruebas: [tests/domain/scoring/](../../tests/domain/scoring/).

## Firma

```ts
evaluar(respuestas, pack, opciones?) → ResultadoEvaluacion
```

- `respuestas`: lo que contestó la persona ([tipos.ts](../../src/domain/scoring/tipos.ts)).
- `pack`: el contenido de `content/content_pack.json`, ya validado.
- `opciones.laboratorio` y `opciones.fechaReferencia`: solo en la posta.

Devuelve:

| Campo | Qué es |
|---|---|
| `puntajeExposicion` | Suma de quema + manipulación + tiempo + pescado, con tope 50 |
| `puntajeSintomas` | Suma de los síntomas con "Sí", con tope 40 |
| `puntaje` | Exposición + síntomas (0 a 90) |
| `nivel` | `VERDE`, `AMARILLO` o `ROJO` |
| `urgente` | `true` si hubo alarma aguda (se muestra URGENTE) |
| `reglas` | Ids de **todas** las reglas que se cumplen, en orden de prioridad |
| `motivos` | Frases para mostrar: una por cada opción que sumó, síntoma y regla |
| `muestraSugerida` | `ORINA`, `CABELLO_O_SANGRE`, `ORINA_Y_SANGRE` o `null` |
| `dudas` | Síntomas respondidos con "No sé" |
| `nivelLaboratorio` | Nivel del análisis si está vigente; si no, `null` |
| `advertencias` | `laboratorio_vencido`, `laboratorio_fecha_futura`, `laboratorio_sin_rango` |
| `versionPack` | Versión del pack con que se calculó |

## Orden de cálculo ([evaluar.ts](../../src/domain/scoring/evaluar.ts))

1. **Exposición.** Por cada grupo del pack, busca la opción elegida y suma sus `puntos`. Respuesta ausente = 0. Tope `exposicion.tope` (50).
2. **Síntomas.** Cada grupo con "si" suma una vez sus `puntos`. "duda" suma 0 y va a `dudas`. Tope `sintomas.tope` (40).
3. **Nivel base** por los rangos de `pack.niveles`: VERDE 0–25, AMARILLO 26–55, ROJO 56–90.
4. **Laboratorio** (si viene): se calcula su nivel y su vigencia.
5. **Reglas**, solo las `activa: true`, ordenadas por `prioridad`. Cada regla que se cumple:
   - se agrega a `reglas` y a `motivos`;
   - aplica su `efecto`, que **solo puede subir** el nivel (nunca bajarlo).

## Las reglas

Están en el pack ([content_pack.json](../../content/content_pack.json), sección `reglas`). La condición viene escrita en texto, y su traducción a código está en [condiciones.ts](../../src/domain/scoring/condiciones.ts), una función por id:

| Prioridad | Id | Condición | Efecto | Origen |
|---|---|---|---|---|
| 1 | `alerta_aguda` | alarma aguda = sí (y hubo quema) | mínimo ROJO + urgente | propuesta |
| 2 | `rojo_neuro_y_quema` | temblor + (hormigueo o coordinación) **y** quema sin protección | mínimo ROJO | documento |
| 3 | `laboratorio` | hay resultado vigente | sube si el laboratorio es mayor; si es normal y hay síntomas marcados, mínimo AMARILLO | documento modificado |
| 4 | `grupo_vulnerable` | (embarazo/lactancia o niños) **y** alguna exposición | mínimo AMARILLO | propuesta |
| 5 | `pescado_y_neuro` | pescado > 3 veces/semana **y** algún síntoma neurológico | mínimo ROJO | propuesta |
| 6 | `quema_cerrada_min_amarillo` | quema en lugar cerrado o sin retorta | mínimo AMARILLO | propuesta |

**Decisión importante.** Escribir un intérprete para el texto de las condiciones era demasiado para el hackathon. Por eso:

- en el **código** está *cuándo* se cumple cada regla (una función por id);
- en el **pack** está todo lo demás: si está activa, su prioridad, su efecto, su motivo y los conjuntos de opciones (`definiciones`).

Si el pack trae una regla cuyo id no existe en `condiciones.ts`, el motor **lanza un error** en vez de ignorarla en silencio.

## Laboratorio ([laboratorio.ts](../../src/domain/scoring/laboratorio.ts))

- Vigente si la toma tiene entre 0 y `laboratorio.vigenciaDias` (90) días respecto de `fechaReferencia`.
- Rango por muestra **y** unidad (`pack.laboratorio.rangos`): hasta `verdeHasta` = VERDE; hasta `amarilloHasta` = AMARILLO; más = ROJO.
- Vencido, con fecha futura o sin rango conocido: `nivelLaboratorio = null`, la regla `laboratorio` no se cumple y se agrega la advertencia.
- `fechaReferencia` es obligatoria si hay laboratorio: el motor no lee el reloj.

## Muestra sugerida

Se calcula **siempre**, también en VERDE. La pantalla decide si mostrarla según `muestraSugerida.mostrarDesdeNivel`.

- Exposición a vapor = quema ≠ "no" **o** manipulación ≠ "no_manipula" (una respuesta ausente no cuenta).
- Pescado frecuente = pescado en `definiciones.pescadoFrecuente`.
- Vapor y pescado → `ambas`; solo vapor → `soloExposicionVapor`; solo pescado → `soloPescadoFrecuente`; ninguno → `ninguna`.

## Detalles de seguridad

- La alarma aguda **solo cuenta si la pregunta correspondía** (`alarmaAguda.mostrarSi`: hubo quema). Un envío manipulado con `{ quema: "no", alarmaAguda: "si" }` no genera una urgencia falsa.
- Los textos de los motivos salen del pack. Una prueba verifica que nunca digan "envenenamiento", "intoxicado" ni porcentajes.

## Cómo se prueba

- [casos.test.ts](../../tests/domain/scoring/casos.test.ts): los 17 casos de `content/casos.json` (entrada → salida esperada).
- [propiedades.test.ts](../../tests/domain/scoring/propiedades.test.ts): más de 1.000 combinaciones. Verifica que:
  - se respeten los topes;
  - las reglas nunca bajen el nivel;
  - una regla desactivada no se aplique;
  - una regla sin condición dé error;
  - con laboratorio sea obligatoria la fecha.

```bash
pnpm test tests/domain
```
