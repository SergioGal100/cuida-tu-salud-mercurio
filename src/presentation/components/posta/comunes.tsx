import type { ReactNode } from "react";
import type { NivelId } from "@/domain/contenido/ContentPack";
import { cn } from "@/presentation/lib/utils";

export type TextosPosta = Record<string, string>;

/** Texto de la posta por clave; si falta, muestra la clave (así se nota en la demo). */
export const tx = (t: TextosPosta, clave: string) => t[clave] ?? clave;

const COLOR_NIVEL: Record<NivelId, string> = {
  VERDE: "bg-verde-suave text-verde border-verde/40",
  AMARILLO: "bg-amarillo-suave text-amarillo border-amarillo/40",
  ROJO: "bg-rojo-suave text-rojo border-rojo/40",
};

export function ChipNivel({ nivel, urgente, t }: { nivel: NivelId; urgente?: boolean; t: TextosPosta }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-sm font-bold", COLOR_NIVEL[nivel])}>
      <span aria-hidden className="size-2 rounded-full bg-current" />
      {tx(t, `nivel_${nivel}`)}
      {urgente && <span className="ml-1 rounded bg-urgente-suave px-1 text-xs text-urgente">{tx(t, "urgente")}</span>}
    </span>
  );
}

export function Tarjeta({ titulo, children, className }: { titulo?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm", className)}>
      {titulo && <h2 className="text-lg font-bold">{titulo}</h2>}
      {children}
    </section>
  );
}

export const fechaCorta = (iso: string, idioma: string) =>
  new Date(iso).toLocaleDateString(idioma, { day: "2-digit", month: "short", year: "numeric" });

export const claseCampo =
  "min-h-11 w-full rounded-lg border-2 border-input bg-card px-3 text-base focus-visible:border-primary focus-visible:outline-none";
export const claseBoton =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-base font-bold text-primary-foreground disabled:opacity-50";
export const claseBotonSecundario =
  "inline-flex min-h-11 items-center justify-center rounded-lg border-2 border-primary px-4 text-base font-bold text-primary";
