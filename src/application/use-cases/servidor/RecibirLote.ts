import type { ContentPack } from "@/domain/contenido/ContentPack";
import { MUNICIPIO_NO_DICE } from "@/domain/contenido/Municipio";
import { limpiarRespuestas } from "@/domain/evaluacion/flujo";
import {
  hayDiscrepancia,
  type EvaluacionEntrante,
  type EvaluacionRecibida,
} from "@/domain/evaluacion/EvaluacionRecibida";
import { evaluar } from "@/domain/scoring";
import type { EvaluacionRepository } from "../../ports/EvaluacionRepository";

export const MAXIMO_LOTE = 50;

export interface RespuestaRecibirLote {
  aceptados: string[];
  repetidos: string[];
}

/**
 * Recibe tests anónimos del celular. Idempotente por id. No confía en el
 * cálculo del celular: recalcula con el mismo motor y marca discrepancias.
 */
export class RecibirLote {
  constructor(
    private readonly deps: {
      pack: ContentPack;
      municipiosValidos: Set<string>;
      repo: EvaluacionRepository;
    },
  ) {}

  async ejecutar(lote: EvaluacionEntrante[]): Promise<RespuestaRecibirLote> {
    if (lote.length > MAXIMO_LOTE) throw new Error(`Lote de más de ${MAXIMO_LOTE}`);
    const { pack, municipiosValidos, repo } = this.deps;

    // Un mismo id repetido dentro del lote cuenta una sola vez.
    const unicos = [...new Map(lote.map((e) => [e.id, e])).values()];
    const existentes = await repo.idsExistentes(unicos.map((e) => e.id));
    const nuevos = unicos.filter((e) => !existentes.has(e.id));

    const aGuardar: EvaluacionRecibida[] = nuevos.map((e) => {
      const respuestas = limpiarRespuestas(pack, e.respuestas);
      const resultado = evaluar(respuestas, pack);
      const ctx = respuestas.contexto ?? {};
      const municipio = ctx.municipio;
      return {
        id: e.id,
        origen: e.origen,
        creadaEnDispositivo: e.creadaEn,
        municipioCodigo:
          municipio && municipio !== MUNICIPIO_NO_DICE && municipiosValidos.has(municipio) ? municipio : null,
        rangoEdad: ctx.rangoEdad ?? null,
        sexo: ctx.sexo ?? null,
        embarazoLactancia: ctx.embarazoLactancia ?? null,
        ninosEnCasa: ctx.ninosEnCasa ?? null,
        respuestas,
        resultado,
        versionPack: e.versionPack,
        discrepancia: hayDiscrepancia(e.resultadoCliente, resultado),
      };
    });

    const insertados = new Set(await repo.guardarVarias(aGuardar));
    const aceptados = nuevos.map((e) => e.id).filter((id) => insertados.has(id));
    const repetidos = unicos.map((e) => e.id).filter((id) => !insertados.has(id));
    return { aceptados, repetidos };
  }
}
