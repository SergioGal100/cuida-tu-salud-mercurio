import { contentPack } from "@/composition/contenido";

export const dynamic = "force-static";

export function GET() {
  return Response.json(contentPack);
}
