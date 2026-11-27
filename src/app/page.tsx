import Link from "next/link";
import { contentPack } from "@/composition/contenido";
import { Ilustracion } from "@/presentation/components/ui/Ilustracion";

export const dynamic = "force-static";

/** Íconos de trazo para cada entrada de la portada (casco y casa). */
const ICONO_ENTRADA: Record<string, string> = {
  mineria: "M4 17h16M6 17v-2a6 6 0 0 1 12 0v2M10 9V6h4v3",
  comunidad: "M4 20V10l8-6 8 6v10M9 20v-6h6v6",
};

export default function Inicio() {
  const { app } = contentPack;
  const p = app.portada;
  return (
    <main className="relative mx-auto flex min-h-dvh max-w-md flex-col overflow-hidden">
      <section className="relative overflow-hidden px-5 pt-8 pb-10">
        {/* Fondo cálido con el minero a la derecha, como en la referencia. */}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-[#fbf1dc] via-[#f6ead2] to-[#e3eedf]" />
        <Ilustracion id="minero" className="pointer-events-none absolute -right-10 -bottom-8 size-56" />
        <div className="relative flex flex-col gap-4">
          <span className="text-sm font-bold tracking-widest text-primary uppercase">{app.nombreCorto}</span>
          <h1 className="font-display text-[2.6rem] leading-[1.02] font-extrabold tracking-tight">
            <span className="block text-[#15302b]">{p.tituloLinea1}</span>
            <span className="block max-w-[14ch] text-primary">{p.tituloLinea2}</span>
          </h1>
          <p className="max-w-[58%] text-lg leading-snug font-bold text-[#3d4a47]">{p.subtitulo}</p>
        </div>
      </section>

      <section className="relative flex flex-col gap-3 px-4 pb-4">
        <h2 className="text-lg font-bold text-foreground">{p.elige}</h2>
        {p.entradas.map((e) => (
          <Link
            key={e.id}
            href={`/test#${e.id}`}
            className="tarjeta flex items-center gap-4 p-4 transition-shadow hover:shadow-elevada active:scale-[0.99]"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
              <svg aria-hidden viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d={ICONO_ENTRADA[e.id]} />
              </svg>
            </span>
            <span className="flex flex-1 flex-col">
              <span className="text-lg leading-snug font-bold">{e.titulo}</span>
              {e.detalle && <span className="text-base text-muted-foreground">{e.detalle}</span>}
            </span>
            <span aria-hidden className="text-2xl text-primary">
              →
            </span>
          </Link>
        ))}

        <ul className="flex flex-wrap justify-center gap-2 pt-1">
          {app.beneficios.map((b) => (
            <li key={b} className="insignia bg-card px-3 py-1 text-sm text-primary shadow-suave">
              <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7" />
              </svg>
              {b}
            </li>
          ))}
        </ul>

        <Link href="/test#historial" className="boton-secundario mt-1">
          {app.botonHistorial}
        </Link>
      </section>

      <div className="mt-auto flex flex-col gap-4 px-4 pb-8">
        <p className="rounded-2xl border-2 border-dashed border-border p-4 text-base text-muted-foreground">
          {contentPack.resultado.aviso}
        </p>
        <Link href="/posta" className="text-center text-base font-bold text-primary underline underline-offset-4">
          {app.enlacePosta}
        </Link>
      </div>
    </main>
  );
}
