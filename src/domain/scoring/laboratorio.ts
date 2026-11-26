import type { ContentPack, NivelId } from "../contenido/ContentPack";
import type { Advertencia, ResultadoLaboratorio } from "./tipos";

const MS_POR_DIA = 86_400_000;

/** Convierte "AAAA-MM-DD" o Date a medianoche UTC, para contar días enteros. */
function aDiaUtc(fecha: string | Date): number {
  const d = typeof fecha === "string" ? new Date(`${fecha.slice(0, 10)}T00:00:00Z`) : fecha;
  if (Number.isNaN(d.getTime())) throw new Error(`Fecha inválida: ${String(fecha)}`);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export interface EvaluacionLaboratorio {
  /** Nivel del resultado si está vigente y tiene rango; si no, null. */
  nivel: NivelId | null;
  advertencias: Advertencia[];
}

export function evaluarLaboratorio(
  lab: ResultadoLaboratorio,
  fechaReferencia: string | Date,
  pack: ContentPack,
): EvaluacionLaboratorio {
  const dias = (aDiaUtc(fechaReferencia) - aDiaUtc(lab.fechaToma)) / MS_POR_DIA;
  if (dias < 0) return { nivel: null, advertencias: ["laboratorio_fecha_futura"] };
  if (dias > pack.laboratorio.vigenciaDias) return { nivel: null, advertencias: ["laboratorio_vencido"] };

  const rango = pack.laboratorio.rangos.find(
    (r) => r.muestra === lab.muestra && r.unidad === lab.unidad,
  );
  if (!rango) return { nivel: null, advertencias: ["laboratorio_sin_rango"] };

  const nivel: NivelId =
    lab.valor <= rango.verdeHasta ? "VERDE" : lab.valor <= rango.amarilloHasta ? "AMARILLO" : "ROJO";
  return { nivel, advertencias: [] };
}
