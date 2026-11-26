import type { Evaluacion } from "@/domain/evaluacion/Evaluacion";

export interface RespuestaLote {
  aceptados: string[];
  /** Ya estaban en el servidor (el envío es idempotente por id). */
  repetidos: string[];
}

/** Envía un lote de evaluaciones al servidor. Lanza error si no hay red. */
export interface ClienteEnvio {
  enviarLote(evaluaciones: Evaluacion[]): Promise<RespuestaLote>;
}
