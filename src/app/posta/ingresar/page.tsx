import { redirect } from "next/navigation";
import { contentPack, personalActual } from "@/composition/server";
import { FormIngreso } from "@/presentation/components/posta/FormIngreso";
import { tx } from "@/presentation/components/posta/comunes";
import { Ilustracion } from "@/presentation/components/ui/Ilustracion";
import { ingresar } from "./acciones";

export const dynamic = "force-dynamic";

export default async function PaginaIngreso() {
  if (await personalActual()) redirect("/posta");
  const t = contentPack.postaUi;
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-5 px-4 py-8">
      <div className="tarjeta hero flex flex-col items-center gap-2 p-6 text-center">
        <Ilustracion id="posta" className="size-28" />
        <h1 className="text-3xl font-bold">{tx(t, "titulo")}</h1>
      </div>
      <div className="tarjeta p-5">
        <FormIngreso t={t} accion={ingresar} />
      </div>
      <p className="rounded-2xl border border-[#f0d9a8] bg-amarillo-suave p-3 text-sm text-amarillo">
        <b>{tx(t, "datosPrueba")}.</b> {tx(t, "usuarioPrueba")}
      </p>
    </main>
  );
}
