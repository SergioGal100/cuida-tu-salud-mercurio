import { z } from "zod";
import type { CambiosFicha, FiltrosCasos } from "@/application/ports/ConsultaRepository";
import type { CAMPOS_EXAMEN } from "@/domain/consulta/Consulta";
import { respuestasSchema } from "./loteSchema";

/** POST /api/v1/consultas: la entrevista hecha en la posta. */
export const nuevaConsultaSchema = z.object({ respuestas: respuestasSchema }).strict();

/** PUT /api/v1/consultas/{id}: examen con casillas, conducta y estado. Sin texto libre. */
export const fichaSchema = z
  .object({
    examen: z
      .object({
        temblorObservado: z.boolean().optional(),
        coordinacionAlterada: z.boolean().optional(),
        enciasInflamadas: z.boolean().optional(),
      } satisfies Record<(typeof CAMPOS_EXAMEN)[number], z.ZodType>)
      .strict()
      .optional(),
    conducta: z.enum(["CONTROL", "DERIVACION", "LABORATORIO"]).nullable().optional(),
    estado: z.enum(["ABIERTA", "ESPERA_LABORATORIO", "CERRADA"]).optional(),
  })
  .strict();

/** POST /api/v1/consultas/{id}/laboratorio */
export const laboratorioSchema = z
  .object({
    muestra: z.enum(["ORINA", "SANGRE", "CABELLO"]),
    unidad: z.string().max(30),
    valor: z.number().nonnegative().max(100000),
    fechaToma: z.iso.date(),
    laboratorio: z.string().trim().max(80).nullable().optional(),
  })
  .strict();

export const filtrosCasosSchema = z.object({
  estado: z.enum(["ABIERTA", "ESPERA_LABORATORIO", "CERRADA"]).optional(),
  nivel: z.enum(["VERDE", "AMARILLO", "ROJO"]).optional(),
});

export type FichaDto = z.infer<typeof fichaSchema>;
export type LaboratorioDto = z.infer<typeof laboratorioSchema>;

// Los tipos inferidos deben coincidir con los del dominio (falla la compilación si no).
export const aCambiosFicha = (d: FichaDto): CambiosFicha => d;
export const aFiltrosCasos = (d: z.infer<typeof filtrosCasosSchema>): FiltrosCasos => d;
