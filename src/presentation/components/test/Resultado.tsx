"use client";

import type { ContentPack, NivelId } from "@/domain/contenido/ContentPack";
import type { Evaluacion } from "@/domain/evaluacion/Evaluacion";
import { cn } from "@/presentation/lib/utils";

type Clave = NivelId | "URGENTE";

const ESTILO: Record<Clave, { tarjeta: string; luz: string }> = {
  VERDE: { tarjeta: "bg-verde-suave text-verde border-verde", luz: "bg-verde" },
  AMARILLO: { tarjeta: "bg-amarillo-suave text-amarillo border-amarillo", luz: "bg-[#f2b705]" },
  ROJO: { tarjeta: "bg-rojo-suave text-rojo border-rojo", luz: "bg-rojo" },
  URGENTE: { tarjeta: "bg-urgente-suave text-urgente border-urgente-suave", luz: "bg-rojo" },
};

function Semaforo({ nivel, orden }: { nivel: NivelId; orden: NivelId[] }) {
  return (
    <div className="flex shrink-0 flex-col gap-1.5 rounded-2xl bg-foreground p-2" aria-hidden>
      {[...orden].reverse().map((n) => (
        <span
          key={n}
          className={cn("size-7 rounded-full", n === nivel ? ESTILO[n].luz : "bg-white/15")}
        />
      ))}
    </div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
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

  return (
    <div className="flex flex-col gap-6">
      <div className={cn("flex items-center gap-4 rounded-2xl border-2 p-4", ESTILO[clave].tarjeta)} role="status">
        <Semaforo nivel={r.nivel} orden={orden} />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-bold tracking-wide uppercase opacity-80">{ui.tuResultado}</p>
          <h1 className="text-2xl leading-tight font-bold">{textos.titulo}</h1>
        </div>
      </div>

      <p className="text-lg">{textos.mensaje}</p>

      {r.motivos.length > 0 && (
        <Seccion titulo={ui.porQue}>
          <ul className="flex flex-col gap-2">
            {r.motivos.map((m) => (
              <li key={`${m.tipo}-${m.id}`} className="rounded-xl bg-card p-3 shadow-sm">
                {m.texto}
              </li>
            ))}
          </ul>
        </Seccion>
      )}

      <Seccion titulo={ui.queHacer}>
        <ol className="flex flex-col gap-2">
          {textos.acciones.map((a, i) => (
            <li key={a} className="flex gap-3 rounded-xl bg-card p-3 shadow-sm">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
                {i + 1}
              </span>
              {a}
            </li>
          ))}
        </ol>
      </Seccion>

      {mostrarMuestra && r.muestraSugerida && (
        <Seccion titulo={ui.muestraSugerida}>
          <p className="rounded-xl bg-secondary p-3 text-secondary-foreground">
            {pack.muestraSugerida.textos[r.muestraSugerida]}
          </p>
        </Seccion>
      )}

      <Seccion titulo={ui.paraConversar}>
        <p>{pack.resultado.queContarEnLaPosta}</p>
        {r.dudas.length > 0 && (
          <div className="rounded-xl bg-accent p-3 text-accent-foreground">
            <p className="font-bold">{ui.dudasIntro}</p>
            <ul className="list-disc pl-6">
              {r.dudas.map((id) => (
                <li key={id}>{etiquetaSintoma(id)}</li>
              ))}
            </ul>
          </div>
        )}
      </Seccion>

      <details className="rounded-xl border-2 border-rojo/40 bg-card p-3">
        <summary className="cursor-pointer font-bold text-rojo">{ui.alarmasTitulo}</summary>
        <ul className="mt-2 list-disc pl-6">
          {pack.resultado.alarmasInmediatas.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </details>

      <p className="rounded-xl bg-muted p-4 font-bold">{pack.resultado.aviso}</p>
    </div>
  );
}
