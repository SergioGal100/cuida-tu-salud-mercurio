import packJson from "../../../content/content_pack.json";
import municipiosJson from "../../../content/municipios.json";
import type { ContentPack } from "@/domain/contenido/ContentPack";
import type { Municipio } from "@/domain/contenido/Municipio";
import { validarPack } from "./packSchema";

/**
 * Los JSON se importan directo para que queden dentro del bundle
 * (y así en la caché del service worker). Una sola fuente de verdad.
 */
export const contentPack: ContentPack = validarPack(packJson);

export const municipios: Municipio[] = municipiosJson.municipios;
