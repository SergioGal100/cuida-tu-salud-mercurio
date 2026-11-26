import { atencionActual, listarCasos, registrarConsulta } from "@/composition/server";
import { aFiltrosCasos, filtrosCasosSchema, nuevaConsultaSchema } from "@/presentation/schemas/postaSchemas";

const noAutorizado = () => Response.json({ error: "no_autorizado" }, { status: 401 });

/** Crea la consulta con su evaluación de entrevista (origen POSTA). */
export async function POST(req: Request) {
  const atencion = await atencionActual();
  if (!atencion) return noAutorizado();
  const r = nuevaConsultaSchema.safeParse(await req.json().catch(() => null));
  if (!r.success) return Response.json({ error: "formato_invalido" }, { status: 400 });
  const id = await registrarConsulta.ejecutar(r.data.respuestas, atencion);
  return Response.json({ id }, { status: 201 });
}

/** Casos del establecimiento del usuario. */
export async function GET(req: Request) {
  const atencion = await atencionActual();
  if (!atencion) return noAutorizado();
  const q = Object.fromEntries(new URL(req.url).searchParams);
  const r = filtrosCasosSchema.safeParse(q);
  if (!r.success) return Response.json({ error: "formato_invalido" }, { status: 400 });
  const casos = await listarCasos.ejecutar(atencion, aFiltrosCasos(r.data));
  return Response.json(casos);
}
