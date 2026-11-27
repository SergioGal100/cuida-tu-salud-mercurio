import Link from "next/link";
import { redirect } from "next/navigation";
import { contentPack, personalActual } from "@/composition/server";
import { tx } from "@/presentation/components/posta/comunes";
import { salir } from "../ingresar/acciones";

export const dynamic = "force-dynamic";

/** Todo lo de /posta (salvo el ingreso) exige sesión del personal de salud. */
export default async function LayoutPosta({ children }: { children: React.ReactNode }) {
  const personal = await personalActual();
  if (!personal) redirect("/posta/ingresar");
  const t = contentPack.postaUi;
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-2">
          <Link href="/posta" className="text-lg font-bold text-primary">
            {tx(t, "titulo")}
          </Link>
          <span className="rounded bg-amarillo-suave px-2 text-sm font-bold text-amarillo">{tx(t, "datosPrueba")}</span>
          {(personal.rol === "EPIDEMIOLOGO" || personal.rol === "ADMIN") && (
            <Link href="/posta/vigilancia" className="text-sm font-bold text-primary underline">
              {tx(t, "vigilancia")}
            </Link>
          )}
          <span className="ml-auto text-sm text-muted-foreground">{personal.email}</span>
          <form action={salir}>
            <button type="submit" className="text-sm font-bold text-primary underline">
              {tx(t, "salir")}
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
