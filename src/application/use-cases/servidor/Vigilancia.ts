import type { ContentPack } from "@/domain/contenido/ContentPack";
import { calcularAlertas, resumirVigilancia, type FiltroOrigen, type MunicipioRef } from "@/domain/vigilancia";
import type { Reloj } from "../../ports/Reloj";
import type { VigilanciaRepository } from "../../ports/VigilanciaRepository";

const DIA_MS = 24 * 60 * 60 * 1000;

interface Deps {
  pack: ContentPack;
  municipios: MunicipioRef[];
  repo: VigilanciaRepository;
  reloj: Reloj;
}

/** Panel de vigilancia para un periodo (en días hasta hoy) y un origen. */
export class ResumenVigilancia {
  constructor(private readonly deps: Deps) {}

  async ejecutar(filtros: { dias: number; origen: FiltroOrigen }) {
    const { pack, municipios, repo, reloj } = this.deps;
    const hasta = reloj.ahora();
    const desde = new Date(hasta.getTime() - filtros.dias * DIA_MS);
    // La serie semanal puede mirar más atrás que el periodo elegido.
    const desdeSerie = new Date(hasta.getTime() - pack.vigilancia.semanasSerie * 7 * DIA_MS);
    const [filas, alertas] = await Promise.all([
      repo.filasEntre(desde < desdeSerie ? desde : desdeSerie, hasta),
      repo.alertasAbiertas(),
    ]);
    const resumen = resumirVigilancia(filas, pack, municipios, {
      desde,
      hasta,
      origen: filtros.origen,
      municipiosEnAlerta: new Set(alertas.map((a) => a.municipioCodigo)),
    });
    return { resumen, alertas };
  }
}

/** Botón "Recalcular alertas" (y, en producción, la tarea programada). */
export class CalcularAlertas {
  constructor(private readonly deps: Deps) {}

  async ejecutar() {
    const { pack, municipios, repo, reloj } = this.deps;
    const ahora = reloj.ahora();
    const desde = new Date(ahora.getTime() - pack.vigilancia.alerta.ventanaDias * DIA_MS);
    const filas = await repo.filasEntre(desde, ahora);
    const alertas = calcularAlertas(filas, pack, new Set(municipios.map((m) => m.codigo)), ahora);
    await repo.reemplazarAlertasAbiertas(alertas);
    return alertas;
  }
}
