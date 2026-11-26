import Link from "next/link";
import { contentPack } from "@/composition/contenido";
import { Ilustracion } from "@/presentation/components/ui/Ilustracion";

export const dynamic = "force-static";

export default function Inicio() {
  const { app } = contentPack;
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-4 pt-4 pb-8">
      <section className="hero tarjeta flex flex-col items-center gap-4 overflow-hidden px-5 pt-5 pb-6 text-center">
        <span className="self-start text-sm font-bold tracking-widest text-primary uppercase">{app.nombreCorto}</span>
        <Ilustracion id="hero" className="size-52 drop-shadow-sm" />
        <h1 className="text-3xl leading-tight font-bold">{app.nombre}</h1>
        <p className="text-muted-foreground">{app.descripcion}</p>
        <ul className="flex flex-wrap justify-center gap-2">
          {app.beneficios.map((b) => (
            <li key={b} className="insignia bg-card px-3 py-1 text-base text-primary shadow-suave">
              <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7" />
              </svg>
              {b}
            </li>
          ))}
        </ul>
      </section>

      <nav className="flex flex-col gap-3">
        <Link href="/test" className="boton-principal">
          {app.botonTest} <span aria-hidden>→</span>
        </Link>
        <Link href="/test#historial" className="boton-secundario">
          {app.botonHistorial}
        </Link>
      </nav>

      <p className="mt-auto rounded-2xl border-2 border-dashed border-border p-4 text-base text-muted-foreground">
        {contentPack.resultado.aviso}
      </p>
      <Link href="/posta" className="text-center text-base font-bold text-primary underline underline-offset-4">
        {app.enlacePosta}
      </Link>
    </main>
  );
}
