import { contentPack, municipios } from "@/composition/contenido";

export const dynamic = "force-static";

export function GET() {
  return Response.json({ pack: contentPack.version, municipios: municipios.length });
}
