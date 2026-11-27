"use client";

import type { ContentPack, NivelId } from "@/domain/contenido/ContentPack";
import type { Evaluacion } from "@/domain/evaluacion/Evaluacion";
import { cn } from "@/presentation/lib/utils";
import { ResumenActividades } from "../actividades/Actividades";
import { Ilustracion } from "../ui/Ilustracion";
import { Simbolo } from "./Simbolo";

type Clave = NivelId | "URGENTE";

const ESTILO: Record<Clave, { tarjeta: string; luz: string; titulo: string }> = {
  VERDE: { tarjeta: "bg-gradient-to-br from-[#e9f6ec] to-[#d4ecdb] border-verde/40", luz: "bg-verde", titulo: "text-verde" },
  AMARILLO: { tarjeta: "bg-gradient-to-br from-[#fff6d9] to-[#ffe7a3] border-amarillo/40", luz: "bg-[#f2b705]", titulo: "text-amarillo" },
  ROJO: { tarjeta: "bg-gradient-to-br from-[#fdeeeb] to-[#f9d2cc] border-rojo/40", luz: "bg-rojo", titulo: "text-rojo" },
  URGENTE: { tarjeta: "bg-gradient-to-br from-[#a3241d] to-[#6f1612] border-transparent text-white", luz: "bg-rojo", titulo: "text-white" },
};

const COLOR_TRAMO: Record<NivelId, string> = { VERDE: "bg-verde", AMARILLO: "bg-[#f2b705]", ROJO: "bg-rojo" };

/** Medidor de tramos sin números: marca en qué tramo cae el resultado. */
function Medidor({ nivel, orden, etiquetas }: { nivel: NivelId; orden: NivelId[]; etiquetas: Record<NivelId, string> }) {
  return (
    <div className="flex flex-col gap-1.5" aria-hidden>
      <div className="flex gap-1.5">
        {orden.map((n) => (
          <div key={n} className="relative flex-1">
            <div className={cn("h-3 rounded-full", n === nivel ? COLOR_TRAMO[n] : "bg-crema")} />
            {n === nivel && (
              <span className="absolute -top-1.5 left-1/2 size-6 -translate-x-1/2 rounded-full border-4 border-card bg-foreground shadow-suave" />
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 text-center text-sm text-muted-foreground">
        {orden.map((n) => (
          <span key={n} className={cn("flex-1", n === nivel && "font-bold text-foreground")}>
            {etiquetas[n]}
          </span>
        ))}
      </div>
    </div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-bold">{titulo}</h2>
      {children}
    </section>
  );
}

export function Resultado({ evaluacion, pack }: { evaluacion: Evaluacion; pack: ContentPack }) {
  const r = evaluacion.resultado;
  const clave: Clave = r.urgente ? "URGENTE" : r.nivel;
  const textos = pack.resultado[clave];
  const ui = pack.ui;
  const orden = pack.ordenNiveles;
  const mostrarMuestra =
    r.muestraSugerida !== null && orden.indexOf(r.nivel) >= orden.indexOf(pack.muestraSugerida.mostrarDesdeNivel);
  const etiquetaSintoma = (id: string) => pack.sintomas.grupos.find((g) => g.id === id)?.etiqueta ?? id;
  const iconoMotivo = (tipo: string, id: string) =>
    (tipo === "sintoma"
      ? pack.sintomas.grupos.find((g) => g.id === id)?.icono
      : tipo === "exposicion"
        ? pack.exposicion.grupos.find((g) => g.id === id)?.icono
        : null) ?? null;
  const etiquetasNivel = { VERDE: ui.nivel_VERDE, AMARILLO: ui.nivel_AMARILLO, ROJO: ui.nivel_ROJO };

  return (
    <div className="flex flex-col gap-6">
      <div className={cn("flex flex-col gap-4 rounded-3xl border-2 p-5 shadow-elevada", ESTILO[clave].tarjeta)} role="status">
        <div className="flex items-center gap-4">
          <Ilustracion id={`nivel-${clave}`} className="size-20 shrink-0" />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-bold tracking-widest uppercase opacity-80">{ui.tuResultado}</p>
            <h1 className={cn("text-2xl leading-tight font-bold", ESTILO[clave].titulo)}>{textos.titulo}</h1>
          </div>
        </div>
        {!r.urgente && <Medidor nivel={r.nivel} orden={orden} etiquetas={etiquetasNivel} />}
      </div>

      <p className="text-lg">{textos.mensaje}</p>

      {r.motivos.length > 0 && (
        <Seccion titulo={ui.porQue}>
          <ul className="flex flex-col gap-2">
            {r.motivos.map((m) => {
              const icono = iconoMotivo(m.tipo, m.id);
              return (
                <li key={`${m.tipo}-${m.id}`} className="tarjeta flex items-center gap-3 p-3">
                  {icono ? (
                    <span className="circulo-icono size-12 shrink-0">
                      <Simbolo id={icono} className="size-8" />
                    </span>
                  ) : (
                    <span aria-hidden className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-xl font-bold text-accent-foreground">
                      !
                    </span>
                  )}
                  {m.texto}
                </li>
              );
            })}
          </ul>
        </Seccion>
      )}

      <Seccion titulo={ui.queHacer}>
        <ol className="relative flex flex-col gap-3 pl-1">
          <span aria-hidden className="absolute top-4 bottom-4 left-[1.15rem] w-0.5 bg-primary/25" />
          {textos.acciones.map((a, i) => (
            <li key={a} className="relative flex items-start gap-3">
              <span className="z-10 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground shadow-suave ring-4 ring-background">
                {i + 1}
              </span>
              <span className="tarjeta flex-1 p-3">{a}</span>
            </li>
          ))}
        </ol>
      </Seccion>

      {evaluacion.actividades && <ResumenActividades actividades={evaluacion.actividades} cfg={pack.actividades} />}

      {mostrarMuestra && r.muestraSugerida && (
        <Seccion titulo={ui.muestraSugerida}>
          <p className="rounded-2xl border border-primary/20 bg-secondary p-4 text-secondary-foreground">
            {pack.muestraSugerida.textos[r.muestraSugerida]}
          </p>
        </Seccion>
      )}

      <Seccion titulo={ui.paraConversar}>
        <p>{pack.resultado.queContarEnLaPosta}</p>
        {r.dudas.length > 0 && (
          <div className="rounded-2xl bg-accent p-4 text-accent-foreground">
            <p className="font-bold">{ui.dudasIntro}</p>
            <ul className="list-disc pl-6">
              {r.dudas.map((id) => (
                <li key={id}>{etiquetaSintoma(id)}</li>
              ))}
            </ul>
          </div>
        )}
      </Seccion>

      <details className="tarjeta border-l-4 border-l-rojo p-4">
        <summary className="cursor-pointer font-bold text-rojo">{ui.alarmasTitulo}</summary>
        <ul className="mt-2 list-disc pl-6">
          {pack.resultado.alarmasInmediatas.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </details>

      <p className="rounded-2xl border-2 border-dashed border-border bg-card/60 p-4 font-bold">{pack.resultado.aviso}</p>
    </div>
  );
}
