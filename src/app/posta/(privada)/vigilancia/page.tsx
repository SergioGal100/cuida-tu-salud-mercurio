import { contentPack, personalActual, resumenVigilancia } from "@/composition/server";
import { PanelVigilancia } from "@/presentation/components/vigilancia/PanelVigilancia";
import { leerFiltrosVigilancia } from "@/presentation/schemas/vigilanciaSchema";

export default async function Vigilancia({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const personal = await personalActual();
  const cfg = contentPack.vigilancia;
  if (!personal || (personal.rol !== "EPIDEMIOLOGO" && personal.rol !== "ADMIN")) {
    return <p className="tarjeta p-4">{cfg.textos.sinPermiso}</p>;
  }
  const filtros = leerFiltrosVigilancia(await searchParams, cfg.periodosDias, cfg.periodoPorDefecto);
  const { resumen, alertas } = await resumenVigilancia.ejecutar(filtros);
  return <PanelVigilancia resumen={resumen} alertas={alertas} filtros={filtros} pack={contentPack} />;
}
