import type { ContentPack } from "../contenido/ContentPack";
import type { Respuestas } from "./tipos";

/**
 * Las condiciones de las reglas están escritas en texto en el pack
 * (campo "condicion"). Aquí está su traducción a código, una por id de regla.
 * Todo lo demás de la regla (activa, prioridad, efecto, motivo) y los
 * conjuntos de opciones (definiciones) vienen del pack.
 */

export interface ContextoCondicion {
  respuestas: Respuestas;
  pack: ContentPack;
  puntajeExposicion: number;
  /** true si hay un resultado de laboratorio vigente y con rango conocido. */
  hayLaboratorioVigente: boolean;
}

const esSi = (valor: string | undefined) => valor === "si";

/** La alarma aguda solo cuenta si la pregunta corresponde (pack.alarmaAguda.mostrarSi). */
export function alarmaAgudaAplica(respuestas: Respuestas, pack: ContentPack): boolean {
  const { grupo, noEs } = pack.alarmaAguda.mostrarSi;
  const valor = respuestaExposicion(respuestas, grupo);
  return valor !== undefined && !noEs.includes(valor);
}

export function respuestaExposicion(respuestas: Respuestas, grupoId: string): string | undefined {
  const valor = (respuestas as Record<string, unknown>)[grupoId];
  return typeof valor === "string" ? valor : undefined;
}

/** definiciones.sintomasMarcados: temblor = si Y (hormigueo = si O coordinacion = si) */
export function sintomasMarcados(respuestas: Respuestas): boolean {
  const s = respuestas.sintomas ?? {};
  return esSi(s.temblor) && (esSi(s.hormigueo) || esSi(s.coordinacion));
}

/** definiciones.exposicionVapor: quema != no O manipulacion != no_manipula (ausente no cuenta) */
export function exposicionVapor(respuestas: Respuestas): boolean {
  const quema = respuestas.quema;
  const manipulacion = respuestas.manipulacion;
  return (quema !== undefined && quema !== "no") ||
    (manipulacion !== undefined && manipulacion !== "no_manipula");
}

/** definiciones.pescadoFrecuente */
export function pescadoFrecuente(respuestas: Respuestas, pack: ContentPack): boolean {
  return respuestas.pescado !== undefined &&
    pack.definiciones.pescadoFrecuente.includes(respuestas.pescado);
}

export const condiciones: Record<string, (c: ContextoCondicion) => boolean> = {
  // alarmaAguda = si
  alerta_aguda: ({ respuestas, pack }) =>
    alarmaAgudaAplica(respuestas, pack) && esSi(respuestas.alarmaAguda),

  // sintomasMarcados Y quema en quemaSinProteccion
  rojo_neuro_y_quema: ({ respuestas, pack }) =>
    sintomasMarcados(respuestas) &&
    respuestas.quema !== undefined &&
    pack.definiciones.quemaSinProteccion.includes(respuestas.quema),

  // hay resultado de laboratorio vigente
  laboratorio: ({ hayLaboratorioVigente }) => hayLaboratorioVigente,

  // (embarazoLactancia = si O ninosEnCasa = si) Y puntajeExposicion > 0
  grupo_vulnerable: ({ respuestas, puntajeExposicion }) =>
    (esSi(respuestas.contexto?.embarazoLactancia) || esSi(respuestas.contexto?.ninosEnCasa)) &&
    puntajeExposicion > 0,

  // pescado en pescadoFrecuente Y algún grupo neurológico = si
  pescado_y_neuro: ({ respuestas, pack }) =>
    pescadoFrecuente(respuestas, pack) &&
    pack.sintomas.gruposNeurologicos.some((id) => esSi(respuestas.sintomas?.[id])),

  // quema = quema_cerrada_sin_retorta
  quema_cerrada_min_amarillo: ({ respuestas }) =>
    respuestas.quema === "quema_cerrada_sin_retorta",
};
