import { atencionActual, contentPack, listarCasos, municipios } from "@/composition/server";
import { tx } from "@/presentation/components/posta/comunes";
import { ListaCasos } from "@/presentation/components/posta/ListaCasos";
import { aFiltrosCasos, filtrosCasosSchema } from "@/presentation/schemas/postaSchemas";

export default async function MisCasos({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const atencion = await atencionActual();
  if (!atencion) return <p className="rounded-xl bg-muted p-4">{tx(contentPack.postaUi, "sinPermiso")}</p>;
  const q = await searchParams;
  const r = filtrosCasosSchema.safeParse({ nivel: q.nivel || undefined, estado: q.estado || undefined });
  const filtros = r.success ? aFiltrosCasos(r.data) : {};
  const casos = await listarCasos.ejecutar(atencion, filtros);
  return <ListaCasos casos={casos} filtros={filtros} pack={contentPack} municipios={municipios} />;
}
