# Tutorial 03 · Cambiar contenido y reglas

Casi todo lo que el equipo clínico querrá ajustar vive en **[content/content_pack.json](../../content/content_pack.json)**, no en el código. Este tutorial muestra qué se puede tocar ahí y qué no.

## Regla de oro

Después de **cualquier** cambio en el pack:

```bash
pnpm test
```

- Las 17 pruebas de `casos.json` dicen si cambió el resultado de algún caso conocido.
- El esquema Zod ([packSchema.ts](../../src/infrastructure/content/packSchema.ts)) valida el pack al cargarlo. Si falta un campo o un tipo está mal, la app no arranca y el error dice qué campo falla.

Si un cambio es intencional y rompe un caso, actualiza la salida esperada en [content/casos.json](../../content/casos.json) **con el equipo clínico**.

## Cambiar un texto

Busca el texto en el pack y edítalo. Las secciones:

| Sección | Qué textos tiene |
|---|---|
| `app` | Nombre de la app, botones del inicio |
| `ui` | Botones y títulos del test y del resultado |
| `confianza` | Las 3 frases de la primera pantalla |
| `contexto`, `exposicion`, `alarmaAguda`, `sintomas` | Preguntas y opciones |
| `resultado` | Título, mensaje y acciones por nivel; alarmas; aviso |
| `postaUi` | Textos de la posta |
| `posta` | Diagnósticos diferenciales |

**Nunca** escribas "envenenamiento", "intoxicado" ni porcentajes. Hay una prueba que lo revisa en los motivos.

Algunos textos tienen marcadores que el código reemplaza: `"Paso {actual} de {total}"`, `"Por enviar cuando haya señal: {n}"`. Mantén las llaves.

## Cambiar puntos o cortes

- **Puntos de una opción**: `exposicion.grupos[].opciones[].puntos`.
- **Puntos de un síntoma**: `sintomas.grupos[].puntos`.
- **Topes**: `exposicion.tope` (50) y `sintomas.tope` (40).
- **Cortes de nivel**: `niveles` (VERDE 0–25, AMARILLO 26–55, ROJO 56–90). Deben cubrir del 0 a la suma de los topes, sin huecos.
- **Rangos de laboratorio**: `laboratorio.rangos` (por muestra y unidad).
- **Vigencia del laboratorio**: `laboratorio.vigenciaDias`.

Ejemplo: subir "manos descubiertas" de 10 a 12 puntos.

```json
{ "id": "piel_descubierta", "texto": "Sí, con las manos descubiertas", "puntos": 12, "motivo": "..." }
```

Luego `pnpm test`: fallan los casos 12 y 13, porque cambió su puntaje. Los casos 04 y 14 también usan esa opción, pero no cambian: ya llegan al tope de 50. Eso es lo esperado; decide con el equipo si se actualizan.

## Activar o desactivar una regla

En `reglas`, cambia `"activa": true` por `false`. No hace falta tocar código. Hay una prueba que verifica que una regla desactivada no se aplica.

## Cambiar el efecto, la prioridad o el motivo de una regla

También en el pack:

- `prioridad`: el orden en que se evalúan y se listan.
- `efecto.nivelMinimo`: `VERDE`, `AMARILLO` o `ROJO`.
- `efecto.urgente`: `true` para mostrar URGENTE.
- `motivo`: la frase que ve la persona.

## Cambiar **cuándo** se cumple una regla (requiere código)

La condición en texto del pack (`"condicion"`) es documentación. La lógica real está en **[src/domain/scoring/condiciones.ts](../../src/domain/scoring/condiciones.ts)**, una función por id:

```ts
quema_cerrada_min_amarillo: ({ respuestas }) =>
  respuestas.quema === "quema_cerrada_sin_retorta",
```

Para cambiarla:

1. Edita la función.
2. Actualiza el texto `condicion` del pack para que diga lo mismo.
3. Agrega un caso en `content/casos.json` que la pruebe.
4. `pnpm test`.

### Agregar una regla nueva

1. Agrégala al pack con un `id` nuevo, su prioridad, su efecto y su motivo.
2. Agrega su función en `condiciones.ts` con **el mismo id**. Si te olvidas, `evaluar()` lanza un error: *"la regla X del pack no tiene condición en el código"*.
3. Agrega al menos un caso en `casos.json`.
4. Si tiene un origen nuevo, agrega el texto `origen_<origen>` en `postaUi`.

## Cambiar los municipios

Reemplaza [content/municipios.json](../../content/municipios.json), conservando el formato. Después:

```bash
pnpm db:seed   # carga los municipios nuevos en la base
```

Los municipios viejos que ya tengan evaluaciones no se borran.

## Publicar el cambio

```bash
pnpm test && pnpm lint && pnpm deploy:netlify
```

Sube `version` en el pack (por ejemplo `1.0.1-demo`). Cada evaluación guarda con qué versión se calculó.
