/** Catálogo de municipios (content/municipios.json). La ubicación más fina que se guarda. */
export interface Municipio {
  codigo: string;
  nombre: string;
  departamento: string;
  latCentro: number;
  lonCentro: number;
  comunidades: string[];
}

/** Valor que se guarda cuando la persona no quiere decir su municipio. */
export const MUNICIPIO_NO_DICE = "prefiero_no_decir";
