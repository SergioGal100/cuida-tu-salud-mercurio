import { ZodError } from "zod";
import { recibirLote } from "@/composition/server";
import { aLoteDominio } from "@/presentation/schemas/loteSchema";

const MAX_BYTES = 256 * 1024;

/** Recibe hasta 50 tests anónimos. Idempotente por id. No guarda la IP. */
export async function POST(req: Request) {
  const texto = await req.text();
  if (texto.length > MAX_BYTES) return Response.json({ error: "lote_muy_grande" }, { status: 413 });

  let lote;
  try {
    lote = aLoteDominio(JSON.parse(texto));
  } catch (e) {
    const detalle = e instanceof ZodError ? e.issues.slice(0, 5) : undefined;
    return Response.json({ error: "formato_invalido", detalle }, { status: 400 });
  }

  const r = await recibirLote.ejecutar(lote);
  return Response.json(r);
}
