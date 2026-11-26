import type { BandejaSalida } from "../../ports/BandejaSalida";
import type { ClienteEnvio } from "../../ports/ClienteEnvio";

export const TAMANO_LOTE = 50;

export interface ResultadoSincronizacion {
  enviadas: number;
  pendientes: number;
  /** true si un envío falló (sin red, servidor caído); se reintenta después. */
  fallo: boolean;
}

/**
 * Patrón bandeja de salida: manda los pendientes en lotes; lo aceptado o
 * repetido queda como enviado. Si falla, todo sigue pendiente.
 */
export class SincronizarPendientes {
  private enCurso: Promise<ResultadoSincronizacion> | null = null;

  constructor(
    private readonly bandeja: BandejaSalida,
    private readonly cliente: ClienteEnvio,
  ) {}

  /** Si ya hay una sincronización corriendo, devuelve esa (no duplica envíos). */
  ejecutar(): Promise<ResultadoSincronizacion> {
    this.enCurso ??= this.sincronizar().finally(() => (this.enCurso = null));
    return this.enCurso;
  }

  private async sincronizar(): Promise<ResultadoSincronizacion> {
    let enviadas = 0;
    let fallo = false;
    for (;;) {
      const lote = await this.bandeja.pendientes(TAMANO_LOTE);
      if (lote.length === 0) break;
      try {
        const r = await this.cliente.enviarLote(lote);
        const listos = [...r.aceptados, ...r.repetidos];
        await this.bandeja.marcarEnviadas(listos);
        enviadas += listos.length;
        if (listos.length < lote.length) break; // el servidor no tomó todo: reintentar más tarde
      } catch {
        fallo = true;
        break;
      }
    }
    return { enviadas, pendientes: await this.bandeja.contarPendientes(), fallo };
  }
}
