"use client";

import type { ReactNode } from "react";
import type { Opcion } from "@/domain/contenido/ContentPack";
import { cn } from "@/presentation/lib/utils";
import { Simbolo } from "./Simbolo";

/** Pantalla base del test: encabezado con atrás y progreso, contenido y pie. */
export function Pantalla({
  progreso,
  textoAtras,
  onAtras,
  children,
  pie,
}: {
  progreso?: { actual: number; total: number; texto: string };
  textoAtras?: string;
  onAtras?: () => void;
  children: ReactNode;
  pie?: ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-4 pb-6">
      <header className="flex min-h-12 items-center gap-3">
        {onAtras && (
          <button type="button" onClick={onAtras} className="-ml-2 rounded-lg px-2 py-2 text-base font-bold text-primary">
            ← {textoAtras}
          </button>
        )}
        {progreso && (
          <div className="ml-auto flex flex-1 flex-col items-end gap-1">
            <span className="text-sm text-muted-foreground">{progreso.texto}</span>
            <div className="h-2 w-full max-w-40 overflow-hidden rounded-full bg-muted" aria-hidden>
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(progreso.actual / progreso.total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </header>
      <div className="flex flex-1 flex-col gap-5 pt-4">{children}</div>
      {pie && <footer className="flex flex-col gap-3 pt-6">{pie}</footer>}
    </main>
  );
}

export function TituloPregunta({ icono, children }: { icono?: string | null; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      {icono && (
        <div className="flex size-24 items-center justify-center self-center rounded-3xl bg-secondary text-primary">
          <Simbolo id={icono} className="size-16" />
        </div>
      )}
      <h1 className="text-2xl leading-snug font-bold">{children}</h1>
    </div>
  );
}

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
          <span
            aria-hidden
            className={cn(
              "size-6 shrink-0 rounded-full border-2 border-input",
              valor === o.id && "border-primary bg-primary shadow-[inset_0_0_0_4px_var(--card)]",
            )}
          />
          {o.texto}
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
      className={cn(
        "flex min-h-14 w-full items-center justify-center rounded-xl bg-primary px-6 text-xl font-bold text-primary-foreground disabled:opacity-50",
        props.className,
      )}
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
      className={cn(
        "flex min-h-14 w-full items-center justify-center rounded-xl border-2 border-primary px-6 text-lg font-bold text-primary",
        props.className,
      )}
    >
      {children}
    </button>
  );
}
