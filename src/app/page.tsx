import Link from "next/link";
import { contentPack } from "@/composition/contenido";

export const dynamic = "force-static";

export default function Inicio() {
  const { app } = contentPack;
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold text-primary">{app.nombre}</h1>
        <p className="text-muted-foreground">{app.descripcion}</p>
      </header>

      <nav className="flex flex-col gap-3">
        <Link
          href="/test"
          className="flex min-h-14 items-center justify-center rounded-xl bg-primary px-6 text-xl font-bold text-primary-foreground"
        >
          {app.botonTest}
        </Link>
        <Link
          href="/test?vista=historial"
          className="flex min-h-14 items-center justify-center rounded-xl border-2 border-primary px-6 text-xl font-bold text-primary"
        >
          {app.botonHistorial}
        </Link>
      </nav>

      <p className="mt-auto rounded-xl bg-muted p-4 text-base">{contentPack.resultado.aviso}</p>
      <Link href="/posta" className="text-center text-base text-muted-foreground underline">
        {app.enlacePosta}
      </Link>
    </main>
  );
}
