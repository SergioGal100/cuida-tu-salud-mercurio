import { z } from "zod";
import type { FiltroOrigen } from "@/domain/vigilancia";

/** Filtros GET del panel. Valores inválidos caen al periodo por defecto. */
export function leerFiltrosVigilancia(
  q: Record<string, string | undefined>,
  periodos: number[],
  porDefecto: number,
): { dias: number; origen: FiltroOrigen } {
  const r = z
    .object({
      dias: z.coerce.number().int().refine((n) => periodos.includes(n)).catch(porDefecto),
      origen: z.enum(["todos", "auto", "posta"]).catch("todos"),
    })
    .parse({ dias: q.dias ?? porDefecto, origen: q.origen ?? "todos" });
  return r;
}
