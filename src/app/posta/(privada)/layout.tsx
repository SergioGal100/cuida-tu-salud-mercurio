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
      <header className="sticky top-0 z-10 border-b bg-card/90 shadow-suave backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5">
          <Link href="/posta" className="flex items-center gap-2 text-lg font-bold text-titulo">
            <span aria-hidden className="flex size-8 items-center justify-center rounded-lg bg-primary text-lg text-primary-foreground">
              +
            </span>
            {tx(t, "titulo")}
          </Link>
          <span className="insignia bg-amarillo-suave text-amarillo">{tx(t, "datosPrueba")}</span>
          <nav className="flex gap-1 rounded-full bg-crema p-1 text-sm font-bold">
            <Link href="/posta" className="rounded-full px-3 py-1.5 text-titulo hover:bg-card">
              {tx(t, "misCasos")}
            </Link>
            {(personal.rol === "EPIDEMIOLOGO" || personal.rol === "ADMIN") && (
              <Link href="/posta/vigilancia" className="rounded-full px-3 py-1.5 text-titulo hover:bg-card">
                {tx(t, "vigilancia")}
              </Link>
            )}
          </nav>
          <span className="ml-auto text-sm text-muted-foreground">{personal.email}</span>
          <form action={salir}>
            <button type="submit" className="rounded-full border px-3 py-1 text-sm font-bold text-primary">
              {tx(t, "salir")}
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
