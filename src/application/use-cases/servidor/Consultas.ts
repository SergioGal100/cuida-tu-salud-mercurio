import type { Atencion } from "@/domain/consulta/Consulta";
import type { ContentPack } from "@/domain/contenido/ContentPack";
import { evaluar } from "@/domain/scoring";
import type { ResultadoEvaluacion, ResultadoLaboratorio } from "@/domain/scoring";
import type { CambiosFicha, ConsultaRepository, FiltrosCasos } from "../../ports/ConsultaRepository";
import type { Reloj } from "../../ports/Reloj";

/** Guarda examen, conducta y estado. false si la consulta no es del establecimiento. */
export class GuardarFicha {
  constructor(private readonly repo: ConsultaRepository) {}

  ejecutar(consultaId: string, cambios: CambiosFicha, atencion: Atencion): Promise<boolean> {
    return this.repo.actualizarFicha(consultaId, atencion.establecimientoId, cambios);
  }
}

export type ResultadoCargaLaboratorio =
  | { ok: true; resultado: ResultadoEvaluacion }
  | { ok: false; motivo: "no_encontrada" };

/**
 * Agrega un resultado de laboratorio y recalcula con el mismo motor
 * (regla "laboratorio": vigente 90 días, solo sube el nivel).
 */
export class CargarLaboratorio {
  constructor(private readonly deps: { pack: ContentPack; repo: ConsultaRepository; reloj: Reloj }) {}

  async ejecutar(
    consultaId: string,
    lab: ResultadoLaboratorio & { laboratorio: string | null },
    atencion: Atencion,
  ): Promise<ResultadoCargaLaboratorio> {
    const { pack, repo, reloj } = this.deps;
    const consulta = await repo.obtener(consultaId, atencion.establecimientoId);
    if (!consulta) return { ok: false, motivo: "no_encontrada" };

    const resultado = evaluar(consulta.respuestas, pack, {
      fechaReferencia: reloj.ahora(),
      laboratorio: { muestra: lab.muestra, unidad: lab.unidad, valor: lab.valor, fechaToma: lab.fechaToma },
    });
    await repo.agregarLaboratorio(consultaId, { ...lab, nivel: resultado.nivelLaboratorio }, resultado.nivel);
    return { ok: true, resultado };
  }
}

/** "Mis casos": consultas del establecimiento del usuario. */
export class ListarCasos {
  constructor(private readonly repo: ConsultaRepository) {}

  ejecutar(atencion: Atencion, filtros: FiltrosCasos = {}) {
    return this.repo.listar(atencion.establecimientoId, filtros);
  }
}

export class VerConsulta {
  constructor(private readonly repo: ConsultaRepository) {}

  ejecutar(id: string, atencion: Atencion) {
    return this.repo.obtener(id, atencion.establecimientoId);
  }
}
