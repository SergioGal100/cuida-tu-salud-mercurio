import { redirect } from "next/navigation";
import { contentPack, personalActual } from "@/composition/server";
import { FormIngreso } from "@/presentation/components/posta/FormIngreso";
import { tx } from "@/presentation/components/posta/comunes";
import { ingresar } from "./acciones";

export const dynamic = "force-dynamic";

export default async function PaginaIngreso() {
  if (await personalActual()) redirect("/posta");
  const t = contentPack.postaUi;
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-4 py-8">
      <h1 className="text-3xl font-bold text-primary">{tx(t, "titulo")}</h1>
      <FormIngreso t={t} accion={ingresar} />
      <p className="rounded-lg bg-amarillo-suave p-3 text-sm text-amarillo">
        <b>{tx(t, "datosPrueba")}.</b> {tx(t, "usuarioPrueba")}
      </p>
    </main>
  );
}
