import type { Evaluacion } from "@/domain/evaluacion/Evaluacion";

/** Historial de la persona; vive solo en su celular. */
export interface HistorialLocal {
  guardar(evaluacion: Evaluacion): Promise<void>;
  /** Más reciente primero. */
  listar(): Promise<Evaluacion[]>;
}
