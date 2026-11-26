"use client";

import { useEffect, useState } from "react";
import type { EntradaHistorial } from "@/application/use-cases/cliente/VerHistorial";
import type { ContentPack, NivelId } from "@/domain/contenido/ContentPack";
import { cn } from "@/presentation/lib/utils";
import { BotonPrincipal, BotonSecundario, Pantalla } from "./piezas";

const COLOR: Record<NivelId | "URGENTE", string> = {
  VERDE: "bg-verde",
  AMARILLO: "bg-[#f2b705]",
  ROJO: "bg-rojo",
  URGENTE: "bg-urgente-suave",
};

export function MisResultados({
  pack,
  cargar,
  pendientes,
  onNuevoTest,
  onSalir,
}: {
  pack: ContentPack;
  cargar: () => Promise<EntradaHistorial[]>;
  /** Cuántos tests esperan señal; null si aún no se sabe. */
  pendientes: number | null;
  onNuevoTest: () => void;
  onSalir: () => void;
}) {
  const [lista, setLista] = useState<EntradaHistorial[] | null>(null);
  const ui = pack.ui;

  useEffect(() => {
    cargar().then(setLista, () => setLista([]));
  }, [cargar]);

  const fecha = (iso: string) =>
    new Date(iso).toLocaleDateString(pack.idioma, { day: "numeric", month: "long", year: "numeric" });
  const etiqueta = (id: string) => pack.sintomas.grupos.find((g) => g.id === id)?.etiqueta ?? id;

  return (
    <Pantalla
      textoAtras={ui.atras}
      onAtras={onSalir}
      pie={
        <>
          <BotonPrincipal onClick={onNuevoTest}>{pack.app.botonTest}</BotonPrincipal>
          <BotonSecundario onClick={onSalir}>{ui.volverInicio}</BotonSecundario>
        </>
      }
    >
      <h1 className="text-3xl font-bold text-primary">{ui.historialTitulo}</h1>
      <p className="text-muted-foreground">{ui.historialNota}</p>
      {pendientes !== null && (
        <p className="rounded-xl bg-secondary p-3 text-base text-secondary-foreground">
          {pendientes > 0 ? ui.pendientesEnvio.replace("{n}", String(pendientes)) : ui.todoEnviado}
        </p>
      )}

      {lista?.length === 0 && <p className="rounded-xl bg-muted p-4">{ui.historialVacio}</p>}

      <ol className="flex flex-col gap-3">
        {lista?.map(({ evaluacion: e, sintomasNuevos }) => {
          const clave = e.resultado.urgente ? "URGENTE" : e.resultado.nivel;
          return (
            <li key={e.id} className="flex flex-col gap-2 rounded-2xl bg-card p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span aria-hidden className={cn("size-6 shrink-0 rounded-full", COLOR[clave])} />
                <div className="flex flex-1 flex-col">
                  <span className="font-bold">{pack.resultado[clave].titulo}</span>
                  <span className="text-base text-muted-foreground">{fecha(e.creadaEn)}</span>
                </div>
                <span className="text-base text-muted-foreground">
                  {ui.puntaje} {e.resultado.puntaje}
                </span>
              </div>
              {sintomasNuevos.length > 0 && (
                <div className="rounded-xl bg-accent p-2 text-base text-accent-foreground">
                  <span className="font-bold">{ui.sintomasNuevos}</span> {sintomasNuevos.map(etiqueta).join(", ")}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </Pantalla>
  );
}
