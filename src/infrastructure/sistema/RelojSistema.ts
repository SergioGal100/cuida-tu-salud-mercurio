import type { Reloj } from "@/application/ports/Reloj";

export class RelojSistema implements Reloj {
  ahora(): Date {
    return new Date();
  }
}
