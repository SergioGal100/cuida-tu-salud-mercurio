"use client";

import { useEffect, useState } from "react";
import type { EntradaHistorial } from "@/application/use-cases/cliente/VerHistorial";
import type { ContentPack, NivelId } from "@/domain/contenido/ContentPack";
import { cn } from "@/presentation/lib/utils";
import { Ilustracion } from "../ui/Ilustracion";
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
      marca={pack.app.nombreCorto}
      textoAtras={ui.atras}
      onAtras={onSalir}
      pie={
        <>
          <BotonPrincipal onClick={onNuevoTest}>{pack.app.botonTest}</BotonPrincipal>
          <BotonSecundario onClick={onSalir}>{ui.volverInicio}</BotonSecundario>
        </>
      }
    >
      <div className="hero tarjeta flex items-center gap-4 p-4">
        <Ilustracion id="historial-vacio" className="size-20 shrink-0" />
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold">{ui.historialTitulo}</h1>
          <p className="text-base text-muted-foreground">{ui.historialNota}</p>
        </div>
      </div>
      {pendientes !== null && (
        <p className="flex items-center gap-2 rounded-2xl bg-secondary p-3 text-base text-secondary-foreground">
          <span aria-hidden className={cn("size-3 shrink-0 rounded-full", pendientes > 0 ? "animate-pulse bg-[#f2b705]" : "bg-verde")} />
          {pendientes > 0 ? ui.pendientesEnvio.replace("{n}", String(pendientes)) : ui.todoEnviado}
        </p>
      )}

      {lista?.length === 0 && <p className="tarjeta p-4 text-center">{ui.historialVacio}</p>}

      <ol className="relative flex flex-col gap-4">
        {lista && lista.length > 1 && (
          <span aria-hidden className="absolute top-6 bottom-6 left-[0.95rem] w-0.5 bg-primary/20" />
        )}
        {lista?.map(({ evaluacion: e, sintomasNuevos }) => {
          const clave = e.resultado.urgente ? "URGENTE" : e.resultado.nivel;
          return (
            <li key={e.id} className="relative flex gap-3">
              <span
                aria-hidden
                className={cn("z-10 mt-4 size-8 shrink-0 rounded-full shadow-suave ring-4 ring-background", COLOR[clave])}
              />
              <div className="tarjeta flex flex-1 flex-col gap-2 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex flex-1 flex-col">
                    <span className="text-sm font-bold text-muted-foreground uppercase">{fecha(e.creadaEn)}</span>
                    <span className="font-bold">{pack.resultado[clave].titulo}</span>
                  </div>
                  <span className="insignia bg-crema text-foreground">
                    {ui.puntaje} {e.resultado.puntaje}
                  </span>
                </div>
                {sintomasNuevos.length > 0 && (
                  <div className="rounded-xl bg-accent p-2 text-base text-accent-foreground">
                    <span className="font-bold">{ui.sintomasNuevos}</span> {sintomasNuevos.map(etiqueta).join(", ")}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </Pantalla>
  );
}
