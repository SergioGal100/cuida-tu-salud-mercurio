import { notFound } from "next/navigation";
import { atencionActual, contentPack, municipios, verConsulta } from "@/composition/server";
import { tx } from "@/presentation/components/posta/comunes";
import { FichaConsulta } from "@/presentation/components/posta/FichaConsulta";

export default async function PaginaFicha({ params }: { params: Promise<{ id: string }> }) {
  const atencion = await atencionActual();
  if (!atencion) return <p className="rounded-xl bg-muted p-4">{tx(contentPack.postaUi, "sinPermiso")}</p>;
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  // Solo encuentra consultas del establecimiento del usuario.
  const consulta = await verConsulta.ejecutar(id, atencion);
  if (!consulta) notFound();
  const municipio = municipios.find((m) => m.codigo === consulta.respuestas.contexto?.municipio);
  return (
    <FichaConsulta
      consulta={consulta}
      pack={contentPack}
      municipioNombre={municipio?.nombre ?? tx(contentPack.postaUi, "sinMunicipio")}
    />
  );
}
