import type { ContentPack } from "../contenido/ContentPack";
import { alarmaAgudaAplica } from "../scoring/condiciones";
import type { Respuestas } from "../scoring/tipos";

/**
 * Qué pantallas tiene el test según lo respondido. Puro y probado:
 * la interfaz solo dibuja el paso actual.
 */
export type Paso =
  | { tipo: "confianza" }
  | { tipo: "contexto"; ids: string[] } // una pantalla puede agrupar preguntas opcionales
  | { tipo: "municipio" }
  | { tipo: "exposicion"; grupoId: string }
  | { tipo: "alarmaAguda" }
  | { tipo: "sintoma"; grupoId: string }
  | { tipo: "resultado" };

/** Ids de contexto que se muestran juntos en una sola pantalla (opcionales). */
const AGRUPADOS = [["rangoEdad", "sexo"]];

export function pasosDelTest(pack: ContentPack, respuestas: Respuestas): Paso[] {
  const pasos: Paso[] = [{ tipo: "confianza" }];

  const usados = new Set<string>();
  for (const p of pack.contexto) {
    if (usados.has(p.id)) continue;
    if (p.fuente) {
      pasos.push({ tipo: "municipio" });
      usados.add(p.id);
      continue;
    }
    const grupo = AGRUPADOS.find((g) => g.includes(p.id)) ?? [p.id];
    grupo.forEach((id) => usados.add(id));
    pasos.push({ tipo: "contexto", ids: grupo });
  }

  for (const grupo of pack.exposicion.grupos) {
    pasos.push({ tipo: "exposicion", grupoId: grupo.id });
    if (grupo.id === pack.alarmaAguda.mostrarSi.grupo && alarmaAgudaAplica(respuestas, pack)) {
      pasos.push({ tipo: "alarmaAguda" });
      // Si la alarma es "sí", el test se corta y se muestra la urgencia.
      if (respuestas.alarmaAguda === "si") {
        pasos.push({ tipo: "resultado" });
        return pasos;
      }
    }
  }

  for (const grupo of pack.sintomas.grupos) pasos.push({ tipo: "sintoma", grupoId: grupo.id });
  pasos.push({ tipo: "resultado" });
  return pasos;
}

/**
 * Deja solo las respuestas que corresponden a los pasos visibles (por ejemplo,
 * borra la alarma aguda si después se cambió la quema a "no").
 */
export function limpiarRespuestas(pack: ContentPack, respuestas: Respuestas): Respuestas {
  const limpio: Respuestas = { ...respuestas };
  if (!alarmaAgudaAplica(respuestas, pack)) delete limpio.alarmaAguda;
  if (limpio.alarmaAguda === "si") {
    for (const g of pack.exposicion.grupos) {
      if (g.id !== pack.alarmaAguda.mostrarSi.grupo) delete (limpio as Record<string, unknown>)[g.id];
    }
    delete limpio.sintomas;
  }
  return limpio;
}
