import type { Evaluacion } from "@/domain/evaluacion/Evaluacion";

/** Cola local de evaluaciones que esperan señal para enviarse sin nombre. */
export interface BandejaSalida {
  agregar(evaluacion: Evaluacion): Promise<void>;
  pendientes(limite: number): Promise<Evaluacion[]>;
  marcarEnviadas(ids: string[]): Promise<void>;
  contarPendientes(): Promise<number>;
}
