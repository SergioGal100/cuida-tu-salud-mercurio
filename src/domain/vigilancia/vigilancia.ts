import type { ContentPack, NivelId } from "../contenido/ContentPack";
import type { OrigenEvaluacion } from "../evaluacion/Evaluacion";
import type { Respuestas } from "../scoring/tipos";

/** Lo mínimo de una evaluación que necesita la vigilancia (sin datos personales). */
export interface FilaVigilancia {
  municipioCodigo: string | null;
  nivel: NivelId;
  urgente: boolean;
  origen: OrigenEvaluacion;
  /** ISO. */
  creadaEn: string;
  respuestas: Respuestas;
}

export interface MunicipioRef {
  codigo: string;
  nombre: string;
  departamento?: string;
  latCentro: number;
  lonCentro: number;
}

/** "Autorreportado" = celular (persona o promotor); "verificado" = entrevista en la posta. */
export type FiltroOrigen = "todos" | "auto" | "posta";

export type Insignia = "alto" | "medio" | "bajo";
export type ClaveNivel = NivelId | "URGENTE";

/** Conteo publicable: null cuando está suprimido (1 a supresionMinima-1). */
export type Conteo = number | null;

export interface FilaMunicipio {
  codigo: string;
  nombre: string;
  departamento?: string;
  latCentro: number;
  lonCentro: number;
  total: Conteo;
  conVisita: Conteo;
  porNivel: Record<ClaveNivel, Conteo>;
  insignia: Insignia | null;
  suprimido: boolean;
  enAlerta: boolean;
}

export interface ConteoRespuesta {
  id: string;
  etiqueta: string;
  conteo: Conteo;
}

export interface ResumenVigilancia {
  desde: string;
  hasta: string;
  kpis: {
    tests: number;
    conVisita: number;
    verificadosPosta: number;
    municipiosEnAlerta: number;
    totalMunicipios: number;
  };
  municipios: FilaMunicipio[];
  /** Fila aparte para "Prefiero no decir" (no va al mapa). */
  sinMunicipio: Omit<FilaMunicipio, "departamento" | "latCentro" | "lonCentro" | "insignia" | "enAlerta">;
  serieSemanal: { inicio: string; conteo: number }[];
  sintomas: ConteoRespuesta[];
  exposiciones: ConteoRespuesta[];
  /** Base de los conteos de síntomas y exposiciones (tests completos del periodo). */
  baseConteos: Conteo;
}

const DIA_MS = 24 * 60 * 60 * 1000;
export const CLAVES_NIVEL: ClaveNivel[] = ["VERDE", "AMARILLO", "ROJO", "URGENTE"];

const claveNivel = (f: FilaVigilancia): ClaveNivel => (f.urgente ? "URGENTE" : f.nivel);
const ms = (iso: string) => new Date(iso).getTime();

/** Visita recomendada: cualquier nivel por encima del primero, o urgente. */
export function recomiendaVisita(f: FilaVigilancia, pack: ContentPack): boolean {
  return f.urgente || pack.ordenNiveles.indexOf(f.nivel) > 0;
}

export function pasaOrigen(f: FilaVigilancia, origen: FiltroOrigen): boolean {
  if (origen === "todos") return true;
  return origen === "posta" ? f.origen === "POSTA" : f.origen !== "POSTA";
}

/** Suprime conteos chicos para que nadie pueda ser reconocido (0 se muestra). */
export function suprimir(n: number, minimo: number): Conteo {
  return n > 0 && n < minimo ? null : n;
}

export function insigniaPara(conVisita: number, pack: ContentPack): Insignia {
  const { altoDesde, medioDesde } = pack.vigilancia.insignias;
  return conVisita >= altoDesde ? "alto" : conVisita >= medioDesde ? "medio" : "bajo";
}

function contarPorNivel(filas: FilaVigilancia[], minimo: number): Record<ClaveNivel, Conteo> {
  const c = Object.fromEntries(CLAVES_NIVEL.map((k) => [k, 0])) as Record<ClaveNivel, number>;
  for (const f of filas) c[claveNivel(f)]++;
  return Object.fromEntries(CLAVES_NIVEL.map((k) => [k, suprimir(c[k], minimo)])) as Record<ClaveNivel, Conteo>;
}

/**
 * Arma todo el panel: KPIs, filas por municipio (con supresión < mínimo),
 * serie semanal, y conteos de síntomas y exposiciones respondidos "sí".
 */
export function resumirVigilancia(
  todas: FilaVigilancia[],
  pack: ContentPack,
  municipios: MunicipioRef[],
  opciones: { desde: Date; hasta: Date; origen: FiltroOrigen; municipiosEnAlerta: Set<string> },
): ResumenVigilancia {
  const cfg = pack.vigilancia;
  const minimo = cfg.supresionMinima;
  const { desde, hasta, origen, municipiosEnAlerta } = opciones;
  const delOrigen = todas.filter((f) => pasaOrigen(f, origen));
  const periodo = delOrigen.filter((f) => ms(f.creadaEn) >= desde.getTime() && ms(f.creadaEn) <= hasta.getTime());

  const filaDe = (filas: FilaVigilancia[]) => {
    const visita = filas.filter((f) => recomiendaVisita(f, pack)).length;
    const suprimido = filas.length > 0 && filas.length < minimo;
    return {
      total: suprimir(filas.length, minimo),
      conVisita: suprimido ? null : suprimir(visita, minimo),
      porNivel: suprimido
        ? (Object.fromEntries(CLAVES_NIVEL.map((k) => [k, null])) as Record<ClaveNivel, Conteo>)
        : contarPorNivel(filas, minimo),
      suprimido,
      visita,
    };
  };

  const filasMunicipio: FilaMunicipio[] = municipios.map((m) => {
    const r = filaDe(periodo.filter((f) => f.municipioCodigo === m.codigo));
    return {
      codigo: m.codigo,
      nombre: m.nombre,
      departamento: m.departamento,
      latCentro: m.latCentro,
      lonCentro: m.lonCentro,
      total: r.total,
      conVisita: r.conVisita,
      porNivel: r.porNivel,
      suprimido: r.suprimido,
      insignia: r.suprimido ? null : insigniaPara(r.visita, pack),
      enAlerta: municipiosEnAlerta.has(m.codigo),
    };
  });
  filasMunicipio.sort((a, b) => (b.conVisita ?? -1) - (a.conVisita ?? -1));

  const codigos = new Set(municipios.map((m) => m.codigo));
  const sinMun = filaDe(periodo.filter((f) => !f.municipioCodigo || !codigos.has(f.municipioCodigo)));

  // Serie: semanas completas que terminan en "hasta".
  const serieSemanal = Array.from({ length: cfg.semanasSerie }, (_, i) => {
    const fin = hasta.getTime() - (cfg.semanasSerie - 1 - i) * 7 * DIA_MS;
    const inicio = fin - 7 * DIA_MS;
    return {
      inicio: new Date(inicio).toISOString(),
      conteo: delOrigen.filter((f) => ms(f.creadaEn) > inicio && ms(f.creadaEn) <= fin).length,
    };
  });

  // Síntomas y exposiciones: solo tests que llegaron a los síntomas.
  const completos = periodo.filter((f) => f.respuestas.sintomas && Object.keys(f.respuestas.sintomas).length > 0);
  const baseSuprimida = completos.length < minimo;
  const conteo = (n: number): Conteo => (baseSuprimida ? null : suprimir(n, minimo));

  const sintomas = pack.sintomas.grupos
    .map((g) => ({
      id: g.id,
      etiqueta: g.etiqueta,
      conteo: conteo(completos.filter((f) => f.respuestas.sintomas?.[g.id] === "si").length),
    }))
    .sort((a, b) => (b.conteo ?? -1) - (a.conteo ?? -1));

  const exposiciones = pack.exposicion.grupos
    .map((g) => {
      const conPuntos = new Set(g.opciones.filter((o) => o.puntos > 0).map((o) => o.id));
      const n = completos.filter((f) => {
        const v = (f.respuestas as Record<string, unknown>)[g.id];
        return typeof v === "string" && conPuntos.has(v);
      }).length;
      return { id: g.id, etiqueta: cfg.etiquetasExposicion[g.id] ?? g.id, conteo: conteo(n) };
    })
    .sort((a, b) => (b.conteo ?? -1) - (a.conteo ?? -1));

  return {
    desde: desde.toISOString(),
    hasta: hasta.toISOString(),
    kpis: {
      tests: periodo.length,
      conVisita: periodo.filter((f) => recomiendaVisita(f, pack)).length,
      verificadosPosta: periodo.filter((f) => f.origen === "POSTA").length,
      municipiosEnAlerta: filasMunicipio.filter((m) => m.enAlerta).length,
      totalMunicipios: municipios.length,
    },
    municipios: filasMunicipio,
    sinMunicipio: {
      codigo: "",
      nombre: "",
      total: sinMun.total,
      conVisita: sinMun.conVisita,
      porNivel: sinMun.porNivel,
      suprimido: sinMun.suprimido,
    },
    serieSemanal,
    sintomas,
    exposiciones,
    baseConteos: baseSuprimida ? null : completos.length,
  };
}

export interface AlertaNueva {
  municipioCodigo: string;
  regla: string;
  desde: string;
  hasta: string;
  conteo: number;
}

/**
 * Regla del pack: un municipio entra en alerta si junta al menos
 * `minimoRojos` tests en ROJO o URGENTE dentro de la ventana que termina hoy.
 */
export function calcularAlertas(
  filas: FilaVigilancia[],
  pack: ContentPack,
  municipiosValidos: Set<string>,
  ahora: Date,
): AlertaNueva[] {
  const { id, ventanaDias, minimoRojos } = pack.vigilancia.alerta;
  const hasta = ahora.getTime();
  const desde = hasta - ventanaDias * DIA_MS;
  const conteos = new Map<string, number>();
  for (const f of filas) {
    if (!f.municipioCodigo || !municipiosValidos.has(f.municipioCodigo)) continue;
    const t = ms(f.creadaEn);
    if (t < desde || t > hasta) continue;
    if (f.urgente || f.nivel === "ROJO") conteos.set(f.municipioCodigo, (conteos.get(f.municipioCodigo) ?? 0) + 1);
  }
  return [...conteos.entries()]
    .filter(([, n]) => n >= minimoRojos)
    .sort((a, b) => b[1] - a[1])
    .map(([municipioCodigo, conteo]) => ({
      municipioCodigo,
      regla: id,
      desde: new Date(desde).toISOString(),
      hasta: new Date(hasta).toISOString(),
      conteo,
    }));
}
