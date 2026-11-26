import { atencionActual, cargarLaboratorio } from "@/composition/server";
import { laboratorioSchema } from "@/presentation/schemas/postaSchemas";

/** Agrega un resultado de laboratorio y devuelve el nivel recalculado. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const atencion = await atencionActual();
  if (!atencion) return Response.json({ error: "no_autorizado" }, { status: 401 });
  const r = laboratorioSchema.safeParse(await req.json().catch(() => null));
  if (!r.success) return Response.json({ error: "formato_invalido" }, { status: 400 });
  const res = await cargarLaboratorio.ejecutar(
    (await params).id,
    { ...r.data, laboratorio: r.data.laboratorio ?? null },
    atencion,
  );
  return res.ok ? Response.json(res.resultado) : Response.json({ error: res.motivo }, { status: 404 });
}
