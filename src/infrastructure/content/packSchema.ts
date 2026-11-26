import { z } from "zod";
import type { ContentPack } from "@/domain/contenido/ContentPack";

const nivel = z.enum(["VERDE", "AMARILLO", "ROJO"]);
const muestraSugerida = z.enum(["ORINA", "CABELLO_O_SANGRE", "ORINA_Y_SANGRE"]);
const opcion = z.object({ id: z.string(), texto: z.string() });
const textoResultado = z.object({
  titulo: z.string(),
  mensaje: z.string(),
  acciones: z.array(z.string()),
});

export const packSchema = z.object({
  version: z.string(),
  idioma: z.string(),
  tratamiento: z.string(),
  app: z.object({
    nombre: z.string(),
    nombreCorto: z.string(),
    descripcion: z.string(),
    botonTest: z.string(),
    botonHistorial: z.string(),
    enlacePosta: z.string(),
    avisoDatosPrueba: z.string(),
  }),
  confianza: z.object({ frases: z.array(z.string()), boton: z.string() }),
  contexto: z.array(
    z.object({
      id: z.string(),
      pregunta: z.string(),
      opciones: z.array(opcion).optional(),
      opcional: z.boolean().optional(),
      fuente: z.string().optional(),
      permiteNoDecir: z.boolean().optional(),
    }),
  ),
  exposicion: z.object({
    tope: z.number().nonnegative(),
    grupos: z.array(
      z.object({
        id: z.string(),
        codigoMatriz: z.string(),
        seleccion: z.literal("unica"),
        icono: z.string().nullable(),
        pregunta: z.string(),
        opciones: z.array(
          opcion.extend({ puntos: z.number().nonnegative(), motivo: z.string().optional() }),
        ),
        nota: z.string().optional(),
      }),
    ),
  }),
  alarmaAguda: z.object({
    id: z.string(),
    mostrarSi: z.object({ grupo: z.string(), noEs: z.array(z.string()) }),
    pregunta: z.string(),
    opciones: z.array(opcion),
    siEsSi: z.string(),
  }),
  sintomas: z.object({
    tope: z.number().nonnegative(),
    respuestas: z.array(opcion),
    grupos: z.array(
      z.object({
        id: z.string(),
        codigoMatriz: z.string(),
        puntos: z.number().nonnegative(),
        icono: z.string().nullable(),
        pregunta: z.string(),
        etiqueta: z.string(),
      }),
    ),
    gruposNeurologicos: z.array(z.string()),
  }),
  niveles: z.array(z.object({ id: nivel, min: z.number(), max: z.number() })),
  ordenNiveles: z.array(nivel),
  definiciones: z.object({
    quemaSinProteccion: z.array(z.string()),
    pescadoFrecuente: z.array(z.string()),
    sintomasMarcados: z.string().optional(),
    exposicionVapor: z.string().optional(),
  }),
  reglas: z.array(
    z.object({
      id: z.string(),
      prioridad: z.number(),
      activa: z.boolean(),
      origen: z.string(),
      condicion: z.string(),
      efecto: z.object({
        nivelMinimo: nivel.optional(),
        urgente: z.boolean().optional(),
        subeSiMayor: z.boolean().optional(),
        siNormalYSintomasMarcados: nivel.optional(),
      }),
      motivo: z.string(),
    }),
  ),
  muestraSugerida: z.object({
    soloExposicionVapor: muestraSugerida.nullable(),
    soloPescadoFrecuente: muestraSugerida.nullable(),
    ambas: muestraSugerida.nullable(),
    ninguna: muestraSugerida.nullable(),
    textos: z.record(muestraSugerida, z.string()),
    mostrarDesdeNivel: nivel,
  }),
  laboratorio: z.object({
    vigenciaDias: z.number().positive(),
    rangos: z.array(
      z.object({
        muestra: z.enum(["ORINA", "SANGRE", "CABELLO"]),
        unidad: z.string(),
        unidadTexto: z.string(),
        verdeHasta: z.number(),
        amarilloHasta: z.number(),
      }),
    ),
    guiaMuestraOrina: z.array(z.string()),
  }),
  resultado: z.object({
    VERDE: textoResultado,
    AMARILLO: textoResultado,
    ROJO: textoResultado,
    URGENTE: textoResultado,
    alarmasInmediatas: z.array(z.string()),
    aviso: z.string(),
    queContarEnLaPosta: z.string(),
  }),
  posta: z.object({
    diferenciales: z.array(z.object({ sintoma: z.string(), otrasCausas: z.string() })),
    notaDiferencial: z.string(),
  }),
});

/** Valida el JSON del pack y lo devuelve con el tipo del dominio. Falla si no cumple. */
export function validarPack(json: unknown): ContentPack {
  return packSchema.parse(json) satisfies ContentPack;
}
