import type { BandejaSalida } from "@/application/ports/BandejaSalida";
import type { Evaluacion } from "@/domain/evaluacion/Evaluacion";
import type { BaseLocal } from "./db";

export class BandejaDexie implements BandejaSalida {
  constructor(private readonly db: BaseLocal) {}

  async agregar(evaluacion: Evaluacion) {
    await this.db.bandeja.put({ id: evaluacion.id, estado: "pendiente", creadaEn: evaluacion.creadaEn, evaluacion });
  }

  async pendientes(limite: number) {
    const filas = await this.db.bandeja.where("estado").equals("pendiente").sortBy("creadaEn");
    return filas.slice(0, limite).map((f) => f.evaluacion);
  }

  async marcarEnviadas(ids: string[]) {
    // Se borra la copia enviada: el historial vive en su propia tabla.
    await this.db.bandeja.bulkDelete(ids);
  }

  async contarPendientes() {
    return this.db.bandeja.where("estado").equals("pendiente").count();
  }
}
