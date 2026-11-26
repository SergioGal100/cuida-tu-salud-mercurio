import type { NivelId } from "../contenido/ContentPack";
import type { Respuestas, ResultadoEvaluacion, ResultadoLaboratorio } from "../scoring/tipos";

export type EstadoConsulta = "ABIERTA" | "ESPERA_LABORATORIO" | "CERRADA";
export const ESTADOS_CONSULTA: EstadoConsulta[] = ["ABIERTA", "ESPERA_LABORATORIO", "CERRADA"];

export type Conducta = "CONTROL" | "DERIVACION" | "LABORATORIO";
export const CONDUCTAS: Conducta[] = ["CONTROL", "DERIVACION", "LABORATORIO"];

/** Examen físico con casillas. Sin texto libre: nada que pueda identificar a la persona. */
export interface ExamenFisico {
  temblorObservado?: boolean;
  coordinacionAlterada?: boolean;
  enciasInflamadas?: boolean;
}
export const CAMPOS_EXAMEN = ["temblorObservado", "coordinacionAlterada", "enciasInflamadas"] as const;

/** Quién atiende: sale de la sesión, nunca del formulario. */
export interface Atencion {
  usuarioId: string;
  establecimientoId: string;
}

export interface LaboratorioRegistrado extends ResultadoLaboratorio {
  id: string;
  laboratorio: string | null;
  nivel: NivelId | null;
  creadoEn: string;
}

/** Una consulta en la posta, con la entrevista (evaluación de origen POSTA). */
export interface Consulta {
  id: string;
  evaluacionId: string;
  establecimientoId: string;
  fecha: string;
  respuestas: Respuestas;
  /** Resultado de la entrevista sin laboratorio. */
  resultadoEntrevista: ResultadoEvaluacion;
  examen: ExamenFisico;
  conducta: Conducta | null;
  nivelFinal: NivelId;
  estado: EstadoConsulta;
  /** Más reciente primero. */
  laboratorios: LaboratorioRegistrado[];
}

export interface ResumenConsulta {
  id: string;
  fecha: string;
  municipioCodigo: string | null;
  nivelFinal: NivelId;
  urgente: boolean;
  estado: EstadoConsulta;
  tieneLaboratorio: boolean;
}
