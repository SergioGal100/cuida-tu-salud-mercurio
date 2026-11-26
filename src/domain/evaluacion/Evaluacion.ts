import type { Respuestas, ResultadoEvaluacion } from "../scoring/tipos";

export type OrigenEvaluacion = "AUTO" | "PROMOTOR" | "POSTA";

/**
 * Un test hecho. No lleva nombre, carnet, teléfono, GPS ni id de persona o
 * de dispositivo: cada evaluación es independiente.
 */
export interface Evaluacion {
  /** UUID creado en el celular; hace idempotente el envío. */
  id: string;
  origen: OrigenEvaluacion;
  /** ISO 8601. */
  creadaEn: string;
  versionPack: string;
  respuestas: Respuestas;
  resultado: ResultadoEvaluacion;
}

/** "promotor" en quienResponde ⇒ PROMOTOR; si no, AUTO. */
export function origenDesdeRespuestas(respuestas: Respuestas): OrigenEvaluacion {
  return respuestas.contexto?.quienResponde === "promotor" ? "PROMOTOR" : "AUTO";
}

/** Síntomas con "sí" en `actual` que no estaban con "sí" en `anterior`. */
export function sintomasNuevos(actual: Evaluacion, anterior: Evaluacion | undefined): string[] {
  const si = (e: Evaluacion | undefined) =>
    new Set(Object.entries(e?.respuestas.sintomas ?? {}).filter(([, v]) => v === "si").map(([k]) => k));
  const antes = si(anterior);
  return [...si(actual)].filter((id) => !antes.has(id));
}
