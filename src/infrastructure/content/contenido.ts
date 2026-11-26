import packJson from "../../../content/content_pack.json";
import municipiosJson from "../../../content/municipios.json";
import type { ContentPack } from "@/domain/contenido/ContentPack";
import { validarPack } from "./packSchema";

/**
 * Los JSON se importan directo para que queden dentro del bundle
 * (y así en la caché del service worker). Una sola fuente de verdad.
 */
export const contentPack: ContentPack = validarPack(packJson);

export interface Municipio {
  codigo: string;
  nombre: string;
  departamento: string;
  latCentro: number;
  lonCentro: number;
  comunidades: string[];
}

export const municipios: Municipio[] = municipiosJson.municipios;
