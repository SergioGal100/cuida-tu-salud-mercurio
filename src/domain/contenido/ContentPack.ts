/**
 * Forma de content/content_pack.json. Tipos puros: la validación en tiempo de
 * ejecución vive en infrastructure/content/packSchema.ts.
 */

export type NivelId = "VERDE" | "AMARILLO" | "ROJO";
export type MuestraSugeridaId = "ORINA" | "CABELLO_O_SANGRE" | "ORINA_Y_SANGRE";
export type MuestraLaboratorio = "ORINA" | "SANGRE" | "CABELLO";

export const TEXTOS_UI = [
  "atras", "seguir", "saltar", "prefieroNoDecir", "progreso", "tuResultado", "puntaje",
  "porQue", "queHacer", "muestraSugerida", "paraConversar", "dudasIntro", "alarmasTitulo",
  "nuevaPersona", "volverInicio", "repetirTest", "modoPromotor", "sinConexionTitulo",
  "sinConexionMensaje", "historialTitulo", "historialVacio", "historialNota", "sintomasNuevos",
  "pendientesEnvio", "todoEnviado", "nivel_VERDE", "nivel_AMARILLO", "nivel_ROJO",
] as const;
export type TextoUi = (typeof TEXTOS_UI)[number];

export interface Opcion {
  id: string;
  texto: string;
}

export interface PreguntaContexto {
  id: string;
  pregunta: string;
  opciones?: Opcion[];
  opcional?: boolean;
  fuente?: string;
  permiteNoDecir?: boolean;
}

export interface OpcionExposicion extends Opcion {
  puntos: number;
  motivo?: string;
}

export interface GrupoExposicion {
  id: string;
  codigoMatriz: string;
  seleccion: "unica";
  icono: string | null;
  pregunta: string;
  opciones: OpcionExposicion[];
  nota?: string;
}

export interface GrupoSintoma {
  id: string;
  codigoMatriz: string;
  puntos: number;
  icono: string | null;
  pregunta: string;
  etiqueta: string;
}

export interface EfectoRegla {
  nivelMinimo?: NivelId;
  urgente?: boolean;
  subeSiMayor?: boolean;
  siNormalYSintomasMarcados?: NivelId;
}

export interface Regla {
  id: string;
  prioridad: number;
  activa: boolean;
  origen: string;
  condicion: string;
  efecto: EfectoRegla;
  motivo: string;
}

export interface RangoNivel {
  id: NivelId;
  min: number;
  max: number;
}

export interface RangoLaboratorio {
  muestra: MuestraLaboratorio;
  unidad: string;
  unidadTexto: string;
  verdeHasta: number;
  amarilloHasta: number;
}

export interface TextoResultado {
  titulo: string;
  mensaje: string;
  acciones: string[];
}

export interface ContentPack {
  version: string;
  idioma: string;
  tratamiento: string;
  app: {
    nombre: string;
    nombreCorto: string;
    descripcion: string;
    botonTest: string;
    botonHistorial: string;
    enlacePosta: string;
    avisoDatosPrueba: string;
    /** Tres textos cortos de la portada (gratis, sin nombre, sin internet). */
    beneficios: string[];
    portada: {
      tituloLinea1: string;
      tituloLinea2: string;
      subtitulo: string;
      elige: string;
      entradas: { id: PerfilEntrada; titulo: string; detalle: string | null }[];
    };
  };
  /** Textos sueltos de la interfaz del test. */
  ui: Record<TextoUi, string>;
  confianza: { frases: string[]; boton: string; bienvenida: Record<PerfilEntrada, string> };
  contexto: PreguntaContexto[];
  exposicion: { tope: number; grupos: GrupoExposicion[] };
  alarmaAguda: {
    id: string;
    mostrarSi: { grupo: string; noEs: string[] };
    pregunta: string;
    opciones: Opcion[];
    siEsSi: string;
  };
  sintomas: {
    tope: number;
    respuestas: Opcion[];
    grupos: GrupoSintoma[];
    gruposNeurologicos: string[];
  };
  niveles: RangoNivel[];
  ordenNiveles: NivelId[];
  definiciones: {
    quemaSinProteccion: string[];
    pescadoFrecuente: string[];
    sintomasMarcados?: string;
    exposicionVapor?: string;
  };
  reglas: Regla[];
  muestraSugerida: {
    soloExposicionVapor: MuestraSugeridaId | null;
    soloPescadoFrecuente: MuestraSugeridaId | null;
    ambas: MuestraSugeridaId | null;
    ninguna: MuestraSugeridaId | null;
    textos: Record<MuestraSugeridaId, string>;
    mostrarDesdeNivel: NivelId;
  };
  laboratorio: {
    vigenciaDias: number;
    rangos: RangoLaboratorio[];
    guiaMuestraOrina: string[];
  };
  resultado: Record<NivelId | "URGENTE", TextoResultado> & {
    alarmasInmediatas: string[];
    aviso: string;
    queContarEnLaPosta: string;
  };
  /** Textos de la app de posta (clave → texto). */
  postaUi: Record<string, string>;
  actividades: ConfigActividades;
  vigilancia: ConfigVigilancia;
  posta: {
    diferenciales: { sintoma: string; otrasCausas: string }[];
    notaDiferencial: string;
  };
}

/** Panel de vigilancia: supresión, regla de alerta, cortes y textos. */
export interface ConfigVigilancia {
  /** Celdas con menos de este número no muestran el conteo. */
  supresionMinima: number;
  semanasSerie: number;
  periodosDias: number[];
  periodoPorDefecto: number;
  alerta: { id: string; ventanaDias: number; minimoRojos: number; texto: string };
  /** Cortes de la insignia por tests con visita recomendada en el periodo. */
  insignias: { altoDesde: number; medioDesde: number };
  etiquetasExposicion: Record<string, string>;
  textos: Record<string, string>;
  /** Puntos del bloque "Cómo se protege a las personas" (admite **negrita**). */
  privacidad: string[];
}

/** Por dónde entra la persona desde la portada: cambia la bienvenida, no las preguntas. */
export type PerfilEntrada = "mineria" | "comunidad";

export type IdActividad = "memoria" | "reaccion" | "alternancia" | "espiral";

/** Actividades experimentales del chequeo: no cambian el nivel. */
export interface ConfigActividades {
  titulo: string;
  intro: string;
  nota: string;
  empezar: string;
  saltarTodas: string;
  saltar: string;
  siguiente: string;
  progreso: string;
  resultadosTitulo: string;
  omitida: string;
  orden: IdActividad[];
  memoria: Record<"titulo" | "instruccion" | "listo" | "repite" | "bien" | "noEsa" | "ronda" | "resultado", string> & {
    longitudes: number[];
  };
  reaccion: Record<"titulo" | "instruccion" | "comenzar" | "espera" | "toca" | "muyPronto" | "intento" | "resultado", string> & {
    intentos: number;
    esperaMinMs: number;
    esperaMaxMs: number;
  };
  alternancia: Record<"titulo" | "instruccion" | "comenzar" | "resultado", string> & { segundos: number };
  espiral: Record<"titulo" | "instruccion" | "terminar" | "borrar" | "resultado", string> & { vueltas: number };
}
