import type { HistorialLocal } from "@/application/ports/HistorialLocal";
import type { Evaluacion } from "@/domain/evaluacion/Evaluacion";
import type { BaseLocal } from "./db";

export class HistorialDexie implements HistorialLocal {
  constructor(private readonly db: BaseLocal) {}

  async guardar(evaluacion: Evaluacion) {
    await this.db.historial.put(evaluacion);
  }

  async listar() {
    return (await this.db.historial.orderBy("creadaEn").reverse().toArray());
  }
}
