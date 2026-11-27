// Genera evaluaciones simuladas (DATOS DE PRUEBA) para el panel de vigilancia.
// Determinista: misma semilla, mismas respuestas e ids. Las fechas se cuentan hacia
// atrás desde "hoy" para que el panel siempre tenga datos recientes en la demo.
import type { ContentPack } from "../src/domain/contenido/ContentPack";
import type { OrigenEvaluacion } from "../src/domain/evaluacion/Evaluacion";
import { evaluar, type Respuestas, type ResultadoEvaluacion } from "../src/domain/scoring";

export const VERSION_SIMULADA = "simulacion-demo";

export interface EvaluacionSimulada {
  id: string;
  origen: OrigenEvaluacion;
  creadaEn: Date;
  municipioCodigo: string | null;
  respuestas: Respuestas;
  resultado: ResultadoEvaluacion;
}

/** PRNG mulberry32: reproducible y sin dependencias. */
function prng(semilla: number) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function uuidDeterminista(n: number) {
  const hex = n.toString(16).padStart(12, "0");
  return `5eed0000-0000-4000-8000-${hex}`;
}

type Perfil = "minero_quema" | "minero" | "ribereno" | "poblador";

/**
 * Peso de cada municipio y perfil típico (DATOS FICTICIOS sobre municipios reales).
 * Norte de La Paz: minería aurífera con quema. Amazonía (Beni, Pando): ribereños que
 * comen pescado. Chiquitanía: minería más reciente. Altiplano: pocos chequeos.
 * DEMO-05 (Trinidad) queda con menos de 5: se ve la supresión.
 */
const REPARTO: { codigo: string | null; peso: number; perfiles: Perfil[] }[] = [
  { codigo: "DEMO-01", peso: 24, perfiles: ["minero_quema", "minero_quema", "minero", "ribereno"] }, // Guanay
  { codigo: "DEMO-02", peso: 11, perfiles: ["minero", "minero_quema", "poblador"] }, // Sorata
  { codigo: "DEMO-03", peso: 8, perfiles: ["minero", "ribereno", "poblador"] }, // Apolo
  { codigo: "DEMO-04", peso: 11, perfiles: ["ribereno", "ribereno", "poblador"] }, // Rurrenabaque
  { codigo: "DEMO-06", peso: 14, perfiles: ["ribereno", "ribereno", "minero", "poblador"] }, // Riberalta
  { codigo: "DEMO-07", peso: 6, perfiles: ["ribereno", "poblador"] }, // Cobija
  { codigo: "DEMO-08", peso: 9, perfiles: ["minero", "minero_quema", "poblador"] }, // San Ramón
  { codigo: "DEMO-09", peso: 6, perfiles: ["minero", "poblador"] }, // San Ignacio de Velasco
  { codigo: "DEMO-10", peso: 4, perfiles: ["poblador", "minero"] }, // Oruro
  { codigo: "DEMO-11", peso: 3, perfiles: ["minero", "poblador"] }, // Potosí
  { codigo: null, peso: 4, perfiles: ["poblador", "minero"] },
];

export function generarSimulacion(pack: ContentPack, hoy: Date, total = 340): EvaluacionSimulada[] {
  const r = prng(20261126);
  const elegir = <T,>(xs: T[]) => xs[Math.floor(r() * xs.length)];
  const conProb = <T,>(p: number, si: T, no: T) => (r() < p ? si : no);
  const pesoTotal = REPARTO.reduce((s, x) => s + x.peso, 0);
  const DIA = 86_400_000;

  function respuestasPara(perfil: Perfil, municipio: string | null): Respuestas {
    const minero = perfil.startsWith("minero");
    const quema =
      perfil === "minero_quema"
        ? elegir(["quema_cerrada_sin_retorta", "quema_aire_libre_sin_proteccion", "quema_aire_libre_sin_proteccion"])
        : minero
          ? elegir(["cerca_del_area", "no", "quema_aire_libre_sin_proteccion"])
          : conProb(0.2, "cerca_del_area", "no");
    const intensidad = perfil === "minero_quema" ? 0.55 : minero ? 0.35 : perfil === "ribereno" ? 0.3 : 0.12;
    const sintomas = Object.fromEntries(
      pack.sintomas.grupos.map((g) => [g.id, r() < intensidad ? "si" : r() < 0.08 ? "duda" : "no"]),
    ) as Respuestas["sintomas"];
    return {
      contexto: {
        quienResponde: conProb(0.08, "promotor", "yo"),
        municipio: municipio ?? "prefiero_no_decir",
        embarazoLactancia: conProb(0.06, "si", "no"),
        ninosEnCasa: conProb(0.45, "si", "no"),
        rangoEdad: elegir(["18_29", "30_44", "30_44", "45_59", "60_mas", "prefiero_no_decir"]),
        sexo: minero ? conProb(0.85, "masculino", "femenino") : elegir(["masculino", "femenino", "prefiero_no_decir"]),
      },
      quema,
      ...(quema !== "no" ? { alarmaAguda: conProb(0.03, "si", "no") } : {}),
      manipulacion: minero
        ? elegir(["piel_descubierta", "epp_inadecuado", "epp_inadecuado", "respirador_cartucho"])
        : conProb(0.1, "piel_descubierta", "no_manipula"),
      tiempo: minero ? elegir(["mas_de_2_anios", "mas_de_2_anios", "entre_6m_y_2_anios"]) : elegir(["mas_de_2_anios", "menos_de_6m"]),
      pescado:
        perfil === "ribereno"
          ? elegir(["mas_de_3_por_semana", "de_1_a_3_por_semana"])
          : elegir(["de_1_a_3_por_semana", "casi_nunca", "casi_nunca"]),
      sintomas,
    };
  }

  const salida: EvaluacionSimulada[] = [];
  const agregar = (municipio: string | null, perfil: Perfil, diasAtras: number) => {
    const respuestas = respuestasPara(perfil, municipio);
    const creadaEn = new Date(hoy.getTime() - diasAtras * DIA - Math.floor(r() * 10) * 3_600_000);
    const origen: OrigenEvaluacion =
      respuestas.contexto?.quienResponde === "promotor" ? "PROMOTOR" : r() < 0.12 ? "POSTA" : "AUTO";
    salida.push({
      id: uuidDeterminista(salida.length + 1),
      origen,
      creadaEn,
      municipioCodigo: municipio,
      respuestas,
      resultado: evaluar(respuestas, pack, { fechaReferencia: creadaEn }),
    });
  };

  for (let i = 0; i < total; i++) {
    let x = r() * pesoTotal;
    const zona = REPARTO.find((z) => (x -= z.peso) < 0) ?? REPARTO[0];
    // Más tests en las semanas recientes (la campaña fue creciendo).
    const diasAtras = Math.floor(Math.pow(r(), 1.35) * 84);
    agregar(zona.codigo, elegir(zona.perfiles), diasAtras);
  }
  // DEMO-05 (Trinidad): solo 2 tests (por debajo del mínimo de 5, el panel los suprime).
  for (let i = 0; i < 2; i++) agregar("DEMO-05", "ribereno", 2 + i * 6);
  return salida;
}
