import Dexie, { type EntityTable } from "dexie";
import type { Evaluacion } from "@/domain/evaluacion/Evaluacion";

export interface FilaBandeja {
  id: string;
  estado: "pendiente" | "enviada";
  creadaEn: string;
  evaluacion: Evaluacion;
}

export type FilaHistorial = Evaluacion;

/** Base local del celular. Nada de esto sale del dispositivo salvo la bandeja (sin nombre). */
export class BaseLocal extends Dexie {
  bandeja!: EntityTable<FilaBandeja, "id">;
  historial!: EntityTable<FilaHistorial, "id">;

  constructor(nombre = "tamizaje-mercurio") {
    super(nombre);
    this.version(1).stores({
      bandeja: "id, estado, creadaEn",
      historial: "id, creadaEn",
    });
  }
}
