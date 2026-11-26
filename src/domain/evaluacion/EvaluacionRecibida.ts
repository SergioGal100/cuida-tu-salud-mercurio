import type { Respuestas, ResultadoEvaluacion } from "../scoring/tipos";
import type { OrigenEvaluacion } from "./Evaluacion";

/** Lo que el celular dice que calculó; el servidor lo compara con su cálculo. */
export interface ResultadoCliente {
  puntaje: number;
  nivel: string;
  urgente: boolean;
}

/** Una evaluación tal como llega en un lote público (sin datos personales). */
export interface EvaluacionEntrante {
  id: string;
  origen: OrigenEvaluacion;
  creadaEn: string;
  versionPack: string;
  respuestas: Respuestas;
  resultadoCliente?: ResultadoCliente;
}

/** Lo que se guarda: respuestas tal cual + cálculo propio del servidor. */
export interface EvaluacionRecibida {
  id: string;
  origen: OrigenEvaluacion;
  creadaEnDispositivo: string;
  municipioCodigo: string | null;
  rangoEdad: string | null;
  sexo: string | null;
  embarazoLactancia: string | null;
  ninosEnCasa: string | null;
  respuestas: Respuestas;
  resultado: ResultadoEvaluacion;
  versionPack: string;
  discrepancia: boolean;
}

export function hayDiscrepancia(cliente: ResultadoCliente | undefined, servidor: ResultadoEvaluacion): boolean {
  if (!cliente) return false;
  return cliente.puntaje !== servidor.puntaje || cliente.nivel !== servidor.nivel || cliente.urgente !== servidor.urgente;
}
