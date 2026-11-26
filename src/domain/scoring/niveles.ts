import type { ContentPack, NivelId } from "../contenido/ContentPack";

/** Nivel base según los rangos del pack. Fuera de rango se acota al extremo. */
export function nivelPorPuntaje(puntaje: number, pack: ContentPack): NivelId {
  const rango = pack.niveles.find((n) => puntaje >= n.min && puntaje <= n.max);
  if (rango) return rango.id;
  const orden = [...pack.niveles].sort((a, b) => a.min - b.min);
  return puntaje < orden[0].min ? orden[0].id : orden[orden.length - 1].id;
}

/** Devuelve el nivel más alto de los dos según pack.ordenNiveles. Nunca baja. */
export function nivelMayor(a: NivelId, b: NivelId, pack: ContentPack): NivelId {
  return pack.ordenNiveles.indexOf(b) > pack.ordenNiveles.indexOf(a) ? b : a;
}
