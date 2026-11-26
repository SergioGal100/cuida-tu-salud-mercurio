"use client";

import type { ReactNode } from "react";
import type { Opcion } from "@/domain/contenido/ContentPack";
import { cn } from "@/presentation/lib/utils";
import { Simbolo } from "./Simbolo";

/** Pantalla base del test: marca, atrás y progreso arriba; contenido; pie con botones. */
export function Pantalla({
  marca,
  progreso,
  textoAtras,
  onAtras,
  children,
  pie,
}: {
  marca?: string;
  progreso?: { actual: number; total: number; texto: string };
  textoAtras?: string;
  onAtras?: () => void;
  children: ReactNode;
  pie?: ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-3 pb-6">
      <header className="flex flex-col gap-2">
        <div className="flex min-h-11 items-center gap-3">
          {onAtras && (
            <button
              type="button"
              onClick={onAtras}
              className="-ml-1 flex min-h-11 items-center gap-1 rounded-full bg-card px-3 text-base font-bold text-primary shadow-suave"
            >
              <span aria-hidden>←</span> {textoAtras}
            </button>
          )}
          {marca && <span className="text-sm font-bold tracking-widest text-primary uppercase">{marca}</span>}
          {progreso && <span className="ml-auto text-sm font-bold text-muted-foreground">{progreso.texto}</span>}
        </div>
        {progreso && (
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-crema" aria-hidden>
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#13857a] to-primary transition-all duration-500"
              style={{ width: `${(progreso.actual / progreso.total) * 100}%` }}
            />
          </div>
        )}
      </header>
      <div className="flex flex-1 flex-col gap-5 pt-5">{children}</div>
      {pie && <footer className="flex flex-col gap-3 pt-6">{pie}</footer>}
    </main>
  );
}

export function TituloPregunta({ icono, children }: { icono?: string | null; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-5">
      {icono && (
        <div className="circulo-icono size-36 self-center">
          <Simbolo id={icono} className="size-20" />
        </div>
      )}
      <h1 className="text-2xl leading-snug font-bold">{children}</h1>
    </div>
  );
}

/** Ícono pequeño por id de respuesta (sí / no / no sé). Solo decoración. */
const MARCA_RESPUESTA: Record<string, { trazo: string; fondo: string }> = {
  si: { trazo: "M7 12.5l3.5 3.5L17 9", fondo: "bg-secondary text-primary" },
  no: { trazo: "M8 8l8 8M16 8l-8 8", fondo: "bg-crema text-tierra" },
  duda: { trazo: "M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.7M12 17h.01", fondo: "bg-accent text-accent-foreground" },
};

/** Lista de opciones de un toque. */
export function ListaOpciones({
  opciones,
  valor,
  onElegir,
}: {
  opciones: Opcion[];
  valor?: string;
  onElegir: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3" role="group">
      {opciones.map((o) => (
        <button
          key={o.id}
          type="button"
          className="opcion-test"
          aria-pressed={valor === o.id}
          onClick={() => onElegir(o.id)}
        >
          {MARCA_RESPUESTA[o.id] ? (
            <span aria-hidden className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", MARCA_RESPUESTA[o.id].fondo)}>
              <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
                <path d={MARCA_RESPUESTA[o.id].trazo} />
              </svg>
            </span>
          ) : (
            <span
              aria-hidden
              className={cn(
                "size-6 shrink-0 rounded-full border-2 border-input bg-card",
                valor === o.id && "border-primary bg-primary shadow-[inset_0_0_0_4px_var(--card)]",
              )}
            />
          )}
          <span className="flex-1">{o.texto}</span>
          {valor === o.id && (
            <span aria-hidden className="text-xl text-primary">
              ✓
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function BotonPrincipal({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={cn("boton-principal", props.className)}
    >
      {children}
    </button>
  );
}

export function BotonSecundario({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={cn("boton-secundario", props.className)}
    >
      {children}
    </button>
  );
}
