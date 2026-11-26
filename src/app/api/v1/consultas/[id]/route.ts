import { atencionActual, guardarFicha } from "@/composition/server";
import { aCambiosFicha, fichaSchema } from "@/presentation/schemas/postaSchemas";

/** Guarda examen, conducta y estado. */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const atencion = await atencionActual();
  if (!atencion) return Response.json({ error: "no_autorizado" }, { status: 401 });
  const r = fichaSchema.safeParse(await req.json().catch(() => null));
  if (!r.success) return Response.json({ error: "formato_invalido" }, { status: 400 });
  const ok = await guardarFicha.ejecutar((await params).id, aCambiosFicha(r.data), atencion);
  return ok ? Response.json({ ok: true }) : Response.json({ error: "no_encontrada" }, { status: 404 });
}
