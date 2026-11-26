import { sintomasNuevos, type Evaluacion } from "@/domain/evaluacion/Evaluacion";
import type { HistorialLocal } from "../../ports/HistorialLocal";

export interface EntradaHistorial {
  evaluacion: Evaluacion;
  /** Ids de síntomas con "sí" que no estaban en el test anterior. */
  sintomasNuevos: string[];
}

export class VerHistorial {
  constructor(private readonly historial: HistorialLocal) {}

  async ejecutar(): Promise<EntradaHistorial[]> {
    const lista = await this.historial.listar(); // más reciente primero
    return lista.map((evaluacion, i) => ({
      evaluacion,
      sintomasNuevos: sintomasNuevos(evaluacion, lista[i + 1]),
    }));
  }
}
