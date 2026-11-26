import type { MuestraLaboratorio, MuestraSugeridaId, NivelId } from "../contenido/ContentPack";

export type RespuestaSintoma = "si" | "no" | "duda";

/**
 * Respuestas del test. Las claves de exposición (quema, manipulacion, tiempo,
 * pescado) son los ids de los grupos del pack. Una respuesta ausente suma 0.
 */
export interface Respuestas {
  contexto?: Partial<Record<string, string>>;
  quema?: string;
  manipulacion?: string;
  tiempo?: string;
  pescado?: string;
  alarmaAguda?: string;
  sintomas?: Partial<Record<string, RespuestaSintoma>>;
}

export interface ResultadoLaboratorio {
  muestra: MuestraLaboratorio;
  unidad: string;
  valor: number;
  /** Fecha ISO, "AAAA-MM-DD". */
  fechaToma: string;
}

export interface OpcionesEvaluacion {
  /** Reemplaza al reloj: hoy, en ISO "AAAA-MM-DD" o Date. Obligatoria si hay laboratorio. */
  fechaReferencia?: string | Date;
  laboratorio?: ResultadoLaboratorio;
}

export type Advertencia =
  | "laboratorio_vencido"
  | "laboratorio_fecha_futura"
  | "laboratorio_sin_rango";

export interface Motivo {
  /** De dónde sale: una opción de exposición, un síntoma o una regla. */
  tipo: "exposicion" | "sintoma" | "regla";
  /** Id del grupo (exposición o síntoma) o de la regla. */
  id: string;
  texto: string;
}

export interface ResultadoEvaluacion {
  versionPack: string;
  puntajeExposicion: number;
  puntajeSintomas: number;
  puntaje: number;
  nivel: NivelId;
  urgente: boolean;
  /** Ids de todas las reglas que se cumplen, en orden de prioridad. */
  reglas: string[];
  motivos: Motivo[];
  muestraSugerida: MuestraSugeridaId | null;
  /** Ids de síntomas respondidos con "No sé". */
  dudas: string[];
  /** null si no hay laboratorio o no está vigente. */
  nivelLaboratorio: NivelId | null;
  advertencias: Advertencia[];
}
