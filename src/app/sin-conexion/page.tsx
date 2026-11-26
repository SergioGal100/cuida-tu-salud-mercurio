import Link from "next/link";
import { contentPack } from "@/composition/contenido";

export const dynamic = "force-static";

export default function SinConexion() {
  const { app, ui } = contentPack;
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4 py-8">
      <h1 className="text-2xl font-bold text-primary">{ui.sinConexionTitulo}</h1>
      <p>{ui.sinConexionMensaje}</p>
      <Link
        href="/test"
        className="flex min-h-14 items-center justify-center rounded-xl bg-primary px-6 text-xl font-bold text-primary-foreground"
      >
        {app.botonTest}
      </Link>
    </main>
  );
}
