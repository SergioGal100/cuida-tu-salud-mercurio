/**
 * Actividades experimentales del chequeo (memoria, reacción, alternancia y
 * espiral). Son descriptivas: NO cambian el nivel ni se envían al servidor.
 * Aquí solo se resumen los datos crudos; la captura vive en presentation.
 */

export interface ResultadoMemoria {
  correctas: number;
  total: number;
  /** Secuencia más larga repetida bien (0 si ninguna). */
  maxLongitud: number;
}

export interface ResultadoReaccion {
  /** Mediana de los intentos válidos, en ms redondeados. */
  medianaMs: number;
  validos: number;
  /** Toques antes de la señal. */
  anticipaciones: number;
}

export interface ResultadoAlternancia {
  segundos: number;
  /** Toques que alternaron bien (A→B o B→A). */
  alternados: number;
  /** Misma letra dos veces seguidas. */
  repetidos: number;
}

export interface ResultadoEspiral {
  duracionMs: number;
  /** Distancia media del trazo a la espiral, en unidades del dibujo (300 × 300). */
  distanciaMedia: number;
  puntos: number;
}

/** Lo que se guarda en el historial del celular. null = actividad omitida. */
export interface ResultadoActividades {
  memoria: ResultadoMemoria | null;
  reaccion: ResultadoReaccion | null;
  alternancia: ResultadoAlternancia | null;
  espiral: ResultadoEspiral | null;
}

export const SIN_ACTIVIDADES: ResultadoActividades = { memoria: null, reaccion: null, alternancia: null, espiral: null };

export function resumirMemoria(rondas: { longitud: number; correcta: boolean }[]): ResultadoMemoria {
  const bien = rondas.filter((r) => r.correcta);
  return {
    correctas: bien.length,
    total: rondas.length,
    maxLongitud: bien.reduce((m, r) => Math.max(m, r.longitud), 0),
  };
}

/** La respuesta es correcta si toca exactamente las casillas en el mismo orden. */
export function esSecuenciaCorrecta(esperada: number[], tocada: number[]): boolean {
  return esperada.length === tocada.length && esperada.every((c, i) => c === tocada[i]);
}

export function mediana(valores: number[]): number {
  if (valores.length === 0) return 0;
  const o = [...valores].sort((a, b) => a - b);
  const m = Math.floor(o.length / 2);
  return o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2;
}

export function resumirReaccion(tiemposMs: number[], anticipaciones: number): ResultadoReaccion {
  return { medianaMs: Math.round(mediana(tiemposMs)), validos: tiemposMs.length, anticipaciones };
}

export function resumirAlternancia(toques: ("A" | "B")[], segundos: number): ResultadoAlternancia {
  let alternados = toques.length > 0 ? 1 : 0;
  let repetidos = 0;
  for (let i = 1; i < toques.length; i++) {
    if (toques[i] === toques[i - 1]) repetidos++;
    else alternados++;
  }
  return { segundos, alternados, repetidos };
}

/** Geometría de la espiral de Arquímedes r = b·θ que se dibuja en un lienzo de 300 × 300. */
export const LIENZO_ESPIRAL = 300;
export function parametrosEspiral(vueltas: number) {
  const centro = LIENZO_ESPIRAL / 2;
  const radioMax = centro - 16;
  return { centro, vueltas, b: radioMax / (2 * Math.PI * vueltas) };
}

/** Puntos de la espiral para dibujarla (polilínea). */
export function puntosEspiral(vueltas: number, pasos = 360): [number, number][] {
  const { centro, b } = parametrosEspiral(vueltas);
  const total = vueltas * pasos;
  return Array.from({ length: total + 1 }, (_, i) => {
    const t = (i / pasos) * 2 * Math.PI;
    return [centro + b * t * Math.cos(t), centro + b * t * Math.sin(t)];
  });
}

/** Distancia (radial) de un punto al brazo de la espiral más cercano. */
export function distanciaAEspiral(x: number, y: number, vueltas: number): number {
  const { centro, b } = parametrosEspiral(vueltas);
  const dx = x - centro;
  const dy = y - centro;
  const r = Math.hypot(dx, dy);
  let fi = Math.atan2(dy, dx);
  if (fi < 0) fi += 2 * Math.PI;
  let mejor = Infinity;
  for (let k = 0; k <= vueltas; k++) mejor = Math.min(mejor, Math.abs(r - b * (fi + 2 * Math.PI * k)));
  return mejor;
}

export function resumirEspiral(trazo: { x: number; y: number; t: number }[], vueltas: number): ResultadoEspiral {
  if (trazo.length === 0) return { duracionMs: 0, distanciaMedia: 0, puntos: 0 };
  const suma = trazo.reduce((s, p) => s + distanciaAEspiral(p.x, p.y, vueltas), 0);
  return {
    duracionMs: Math.round(trazo[trazo.length - 1].t - trazo[0].t),
    distanciaMedia: Math.round((suma / trazo.length) * 10) / 10,
    puntos: trazo.length,
  };
}
