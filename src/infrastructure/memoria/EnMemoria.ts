import type { BandejaSalida } from "@/application/ports/BandejaSalida";
import type { HistorialLocal } from "@/application/ports/HistorialLocal";
import type { AlertaAbierta, VigilanciaRepository } from "@/application/ports/VigilanciaRepository";
import type { Evaluacion } from "@/domain/evaluacion/Evaluacion";
import type { AlertaNueva, FilaVigilancia } from "@/domain/vigilancia";

/** Implementaciones en memoria: para pruebas y como respaldo si no hay IndexedDB. */
export class BandejaEnMemoria implements BandejaSalida {
  private items = new Map<string, { evaluacion: Evaluacion; enviada: boolean }>();
  async agregar(evaluacion: Evaluacion) {
    this.items.set(evaluacion.id, { evaluacion, enviada: false });
  }
  async pendientes(limite: number) {
    return [...this.items.values()].filter((i) => !i.enviada).slice(0, limite).map((i) => i.evaluacion);
  }
  async marcarEnviadas(ids: string[]) {
    for (const id of ids) {
      const item = this.items.get(id);
      if (item) item.enviada = true;
    }
  }
  async contarPendientes() {
    return [...this.items.values()].filter((i) => !i.enviada).length;
  }
}

export class HistorialEnMemoria implements HistorialLocal {
  private items: Evaluacion[] = [];
  async guardar(evaluacion: Evaluacion) {
    this.items.push(evaluacion);
  }
  async listar() {
    return [...this.items].sort((a, b) => b.creadaEn.localeCompare(a.creadaEn));
  }
}

export class VigilanciaEnMemoria implements VigilanciaRepository {
  alertas: AlertaAbierta[] = [];
  constructor(public filas: FilaVigilancia[] = []) {}
  async filasEntre(desde: Date, hasta: Date) {
    return this.filas.filter((f) => {
      const t = new Date(f.creadaEn).getTime();
      return t >= desde.getTime() && t <= hasta.getTime();
    });
  }
  async reemplazarAlertasAbiertas(alertas: AlertaNueva[]) {
    this.alertas = alertas.map((a, i) => ({ ...a, id: `a-${i + 1}`, creadaEn: a.hasta }));
  }
  async alertasAbiertas() {
    return this.alertas;
  }
}
