import type { EvaluacionRecibida } from "@/domain/evaluacion/EvaluacionRecibida";

export interface EvaluacionRepository {
  /** De los ids dados, cuáles ya están guardados. */
  idsExistentes(ids: string[]): Promise<Set<string>>;
  /** Guarda; si un id ya existe (carrera entre dos envíos) se ignora. Devuelve los ids insertados. */
  guardarVarias(evaluaciones: EvaluacionRecibida[]): Promise<string[]>;
}
