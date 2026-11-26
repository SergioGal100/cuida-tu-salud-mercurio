import { z } from "zod";
import type { EvaluacionEntrante } from "@/domain/evaluacion/EvaluacionRecibida";
import { MAXIMO_LOTE } from "@/application/use-cases/servidor/RecibirLote";

/**
 * DTO del lote público. Estricto a propósito: cada respuesta es un id del pack
 * (letras, números, "_" o "-"), así no puede entrar texto libre como un nombre.
 */
const idRespuesta = z.string().regex(/^[A-Za-z0-9_-]{1,40}$/);

export const respuestasSchema = z
  .object({
    contexto: z
      .object({
        quienResponde: idRespuesta.optional(),
        municipio: idRespuesta.optional(),
        embarazoLactancia: idRespuesta.optional(),
        ninosEnCasa: idRespuesta.optional(),
        rangoEdad: idRespuesta.optional(),
        sexo: idRespuesta.optional(),
      })
      .strict()
      .optional(),
    quema: idRespuesta.optional(),
    manipulacion: idRespuesta.optional(),
    tiempo: idRespuesta.optional(),
    pescado: idRespuesta.optional(),
    alarmaAguda: idRespuesta.optional(),
    sintomas: z.record(idRespuesta, z.enum(["si", "no", "duda"])).optional(),
  })
  .strict();

const evaluacionSchema = z
  .object({
    id: z.uuid(),
    // POSTA solo entra por la app de posta, con sesión.
    origen: z.enum(["AUTO", "PROMOTOR"]),
    creadaEn: z.iso.datetime({ offset: true }),
    versionPack: z.string().max(40),
    respuestas: respuestasSchema,
    resultadoCliente: z
      .object({ puntaje: z.number().int(), nivel: z.string().max(20), urgente: z.boolean() })
      .strict()
      .optional(),
  })
  .strict();

export const loteSchema = z.object({ evaluaciones: z.array(evaluacionSchema).min(1).max(MAXIMO_LOTE) }).strict();

export function aLoteDominio(json: unknown): EvaluacionEntrante[] {
  return loteSchema.parse(json).evaluaciones;
}
