"use client";

import { useEffect, useRef, useState } from "react";
import {
  LIENZO_ESPIRAL,
  SIN_ACTIVIDADES,
  esSecuenciaCorrecta,
  puntosEspiral,
  resumirAlternancia,
  resumirEspiral,
  resumirMemoria,
  resumirReaccion,
  type ResultadoActividades,
} from "@/domain/actividades";
import type { ContentPack, IdActividad } from "@/domain/contenido/ContentPack";
import { cn, formatear } from "@/presentation/lib/utils";
import { BotonPrincipal, BotonSecundario, Pantalla } from "../test/piezas";
import { Ilustracion } from "../ui/Ilustracion";

type Config = ContentPack["actividades"];
type Resultado<K extends IdActividad> = NonNullable<ResultadoActividades[K]>;

/** Texto descriptivo de una actividad hecha (sin "normal" ni "anormal"). */
export function textoActividad(id: IdActividad, r: ResultadoActividades, cfg: Config): string | null {
  switch (id) {
    case "memoria":
      return r.memoria && formatear(cfg.memoria.resultado, { correctas: r.memoria.correctas, total: r.memoria.total, max: r.memoria.maxLongitud });
    case "reaccion":
      return r.reaccion && formatear(cfg.reaccion.resultado, { ms: r.reaccion.medianaMs, n: r.reaccion.validos });
    case "alternancia":
      return (
        r.alternancia &&
        formatear(cfg.alternancia.resultado, { toques: r.alternancia.alternados, s: r.alternancia.segundos, errores: r.alternancia.repetidos })
      );
    case "espiral":
      return r.espiral && formatear(cfg.espiral.resultado, { s: Math.round(r.espiral.duracionMs / 1000), d: r.espiral.distanciaMedia });
  }
}

/** Resumen de las actividades para el resultado y el historial. */
export function ResumenActividades({ actividades, cfg }: { actividades: ResultadoActividades; cfg: Config }) {
  if (cfg.orden.every((id) => actividades[id] === null)) return null;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-bold">{cfg.resultadosTitulo}</h2>
      <ul className="grid grid-cols-1 gap-2">
        {cfg.orden.map((id) => (
          <li key={id} className="tarjeta flex items-center gap-3 p-3">
            <Ilustracion id={`act-${id}`} className="size-12 shrink-0" />
            <div className="flex flex-col">
              <span className="font-bold">{cfg[id].titulo}</span>
              <span className={cn("text-base", actividades[id] === null && "text-muted-foreground")}>
                {textoActividad(id, actividades, cfg) ?? cfg.omitida}
              </span>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground">{cfg.nota}</p>
    </section>
  );
}

/** Intro + las actividades en orden + pantalla de "hecho" tras cada una. */
export function ActividadesFlujo({
  pack,
  marca,
  onTerminar,
}: {
  pack: ContentPack;
  marca: string;
  onTerminar: (r: ResultadoActividades) => void;
}) {
  const cfg = pack.actividades;
  const [indice, setIndice] = useState(-1); // -1 = introducción
  const [hecha, setHecha] = useState(false);
  const [resultados, setResultados] = useState<ResultadoActividades>(SIN_ACTIVIDADES);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [indice, hecha]);

  const id = cfg.orden[indice];
  const total = cfg.orden.length;
  const progreso =
    indice >= 0
      ? { actual: indice + 1, total, texto: formatear(cfg.progreso, { actual: indice + 1, total }) }
      : undefined;

  function siguiente(nuevos: ResultadoActividades) {
    setHecha(false);
    if (indice + 1 >= total) onTerminar(nuevos);
    else setIndice(indice + 1);
  }

  function terminarActividad<K extends IdActividad>(k: K, r: Resultado<K>) {
    setResultados({ ...resultados, [k]: r });
    setHecha(true);
  }

  if (indice < 0) {
    return (
      <Pantalla
        marca={marca}
        pie={
          <>
            <BotonPrincipal onClick={() => setIndice(0)}>{cfg.empezar}</BotonPrincipal>
            <BotonSecundario onClick={() => onTerminar(SIN_ACTIVIDADES)}>{cfg.saltarTodas}</BotonSecundario>
          </>
        }
      >
        <h1 className="text-3xl font-bold">{cfg.titulo}</h1>
        <p className="text-lg">{cfg.intro}</p>
        <ul className="grid grid-cols-2 gap-3">
          {cfg.orden.map((k) => (
            <li key={k} className="tarjeta flex flex-col items-center gap-2 p-4 text-center font-bold">
              <Ilustracion id={`act-${k}`} className="size-16" />
              {cfg[k].titulo}
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">{cfg.nota}</p>
      </Pantalla>
    );
  }

  if (hecha) {
    return (
      <Pantalla
        marca={marca}
        progreso={progreso}
        pie={<BotonPrincipal onClick={() => siguiente(resultados)}>{cfg.siguiente}</BotonPrincipal>}
      >
        <div className="tarjeta hero flex flex-col items-center gap-3 p-6 text-center">
          <Ilustracion id="nivel-VERDE" className="size-20" />
          <h1 className="text-2xl font-bold">{cfg[id].titulo}</h1>
          <p className="text-lg">{textoActividad(id, resultados, cfg)}</p>
        </div>
        <p className="text-sm text-muted-foreground">{cfg.nota}</p>
      </Pantalla>
    );
  }

  const saltar = <BotonSecundario onClick={() => siguiente({ ...resultados, [id]: null })}>{cfg.saltar}</BotonSecundario>;
  return (
    <Pantalla marca={marca} progreso={progreso} pie={saltar}>
      <h1 className="text-2xl font-bold">{cfg[id].titulo}</h1>
      <p className="text-muted-foreground">{cfg[id].instruccion}</p>
      {id === "memoria" && <Memoria key="m" cfg={cfg.memoria} onFin={(r) => terminarActividad("memoria", r)} />}
      {id === "reaccion" && <Reaccion key="r" cfg={cfg.reaccion} onFin={(r) => terminarActividad("reaccion", r)} />}
      {id === "alternancia" && (
        <Alternancia key="a" cfg={cfg.alternancia} onFin={(r) => terminarActividad("alternancia", r)} />
      )}
      {id === "espiral" && <Espiral key="e" cfg={cfg.espiral} onFin={(r) => terminarActividad("espiral", r)} />}
    </Pantalla>
  );
}

/* ---------- Memoria visual (cuadrícula 3 × 3) ---------- */

function secuenciaAlAzar(n: number): number[] {
  const casillas = Array.from({ length: 9 }, (_, i) => i);
  for (let i = casillas.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [casillas[i], casillas[j]] = [casillas[j], casillas[i]];
  }
  return casillas.slice(0, n);
}

function Memoria({ cfg, onFin }: { cfg: Config["memoria"]; onFin: (r: Resultado<"memoria">) => void }) {
  const [ronda, setRonda] = useState(0);
  const [secuencia, setSecuencia] = useState(() => secuenciaAlAzar(cfg.longitudes[0]));
  const [fase, setFase] = useState<"mirar" | "repetir" | "bien" | "mal">("mirar");
  const [tocadas, setTocadas] = useState<number[]>([]);
  const [rondas, setRondas] = useState<{ longitud: number; correcta: boolean }[]>([]);

  // Ref además del estado: dos toques muy seguidos no deben perder ninguno.
  const tocadasRef = useRef<number[]>([]);
  const faseRef = useRef(fase);
  faseRef.current = fase;

  function tocar(c: number) {
    if (faseRef.current !== "repetir" || tocadasRef.current.includes(c)) return;
    const nuevas = [...tocadasRef.current, c];
    tocadasRef.current = nuevas;
    setTocadas(nuevas);
    if (nuevas.length < secuencia.length) return;
    const correcta = esSecuenciaCorrecta(secuencia, nuevas);
    const todas = [...rondas, { longitud: secuencia.length, correcta }];
    setRondas(todas);
    faseRef.current = correcta ? "bien" : "mal";
    setFase(faseRef.current);
    window.setTimeout(() => {
      if (ronda + 1 >= cfg.longitudes.length) return onFin(resumirMemoria(todas));
      setRonda(ronda + 1);
      setSecuencia(secuenciaAlAzar(cfg.longitudes[ronda + 1]));
      tocadasRef.current = [];
      setTocadas([]);
      setFase("mirar");
    }, 1100);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <span className="insignia bg-crema text-foreground">
        {formatear(cfg.ronda, { n: ronda + 1, total: cfg.longitudes.length })}
      </span>
      <div className="grid grid-cols-3 gap-3" role="group">
        {Array.from({ length: 9 }, (_, c) => {
          const enSecuencia = secuencia.indexOf(c);
          const enTocadas = tocadas.indexOf(c);
          const mostrar = fase === "mirar" ? enSecuencia : enTocadas;
          const errada = fase === "mal" && enTocadas >= 0 && secuencia[enTocadas] !== c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => tocar(c)}
              aria-label={String(c + 1)}
              className={cn(
                "flex size-20 items-center justify-center rounded-2xl text-2xl font-bold shadow-suave transition-all active:scale-95",
                mostrar >= 0 ? "bg-primary text-primary-foreground" : "bg-secondary",
                errada && "bg-rojo text-white",
              )}
            >
              {mostrar >= 0 ? mostrar + 1 : ""}
            </button>
          );
        })}
      </div>
      <p role="status" className="min-h-7 font-bold text-primary">
        {fase === "repetir" ? cfg.repite : fase === "bien" ? cfg.bien : fase === "mal" ? cfg.noEsa : ""}
      </p>
      {fase === "mirar" && <BotonPrincipal onClick={() => setFase("repetir")}>{cfg.listo}</BotonPrincipal>}
    </div>
  );
}

/* ---------- Tiempo de reacción ---------- */

function Reaccion({ cfg, onFin }: { cfg: Config["reaccion"]; onFin: (r: Resultado<"reaccion">) => void }) {
  const [fase, setFase] = useState<"inicio" | "espera" | "senal" | "pronto">("inicio");
  const [tiempos, setTiempos] = useState<number[]>([]);
  const [anticipaciones, setAnticipaciones] = useState(0);
  const [ultimo, setUltimo] = useState<number | null>(null);
  const temporizador = useRef<number | undefined>(undefined);
  const inicioSenal = useRef(0);

  useEffect(() => () => window.clearTimeout(temporizador.current), []);

  function esperar() {
    setFase("espera");
    const ms = cfg.esperaMinMs + Math.random() * (cfg.esperaMaxMs - cfg.esperaMinMs);
    temporizador.current = window.setTimeout(() => {
      inicioSenal.current = performance.now();
      setFase("senal");
    }, ms);
  }

  function tocar() {
    if (fase === "inicio") return esperar();
    if (fase === "espera") {
      window.clearTimeout(temporizador.current);
      setAnticipaciones((n) => n + 1);
      setFase("pronto");
      temporizador.current = window.setTimeout(esperar, 1200);
      return;
    }
    if (fase === "senal") {
      const t = performance.now() - inicioSenal.current;
      const nuevos = [...tiempos, t];
      setTiempos(nuevos);
      setUltimo(Math.round(t));
      if (nuevos.length >= cfg.intentos) {
        setFase("inicio");
        onFin(resumirReaccion(nuevos, anticipaciones));
      } else esperar();
    }
  }

  const estilo = {
    inicio: "bg-primary text-primary-foreground",
    espera: "bg-secondary text-primary",
    senal: "bg-verde text-white scale-105",
    pronto: "bg-amarillo-suave text-amarillo",
  }[fase];
  const texto = { inicio: cfg.comenzar, espera: cfg.espera, senal: cfg.toca, pronto: cfg.muyPronto }[fase];

  return (
    <div className="flex flex-col items-center gap-4">
      <span className="insignia bg-crema text-foreground">
        {formatear(cfg.intento, { n: Math.min(tiempos.length + 1, cfg.intentos), total: cfg.intentos })}
      </span>
      <div className="rounded-full bg-secondary/70 p-5">
        <button
          type="button"
          onPointerDown={tocar}
          className={cn(
            "flex size-56 touch-manipulation items-center justify-center rounded-full p-6 text-center text-3xl font-bold shadow-elevada transition-all duration-150 select-none",
            estilo,
          )}
        >
          {texto}
        </button>
      </div>
      <p className="min-h-7 font-bold text-primary" role="status">
        {ultimo !== null && fase !== "pronto" ? `${ultimo} ms` : ""}
      </p>
    </div>
  );
}

/* ---------- Desafío A/B ---------- */

function Alternancia({ cfg, onFin }: { cfg: Config["alternancia"]; onFin: (r: Resultado<"alternancia">) => void }) {
  const [toques, setToques] = useState<("A" | "B")[]>([]);
  const [restante, setRestante] = useState(cfg.segundos * 1000);
  const inicio = useRef<number | null>(null);
  const terminado = useRef(false);
  const lista = useRef<("A" | "B")[]>([]);
  const fin = useRef(onFin);
  useEffect(() => {
    fin.current = onFin;
  });

  useEffect(() => {
    const t = window.setInterval(() => {
      if (inicio.current === null || terminado.current) return;
      const queda = cfg.segundos * 1000 - (performance.now() - inicio.current);
      setRestante(Math.max(queda, 0));
      if (queda <= 0) {
        terminado.current = true;
        fin.current(resumirAlternancia(lista.current, cfg.segundos));
      }
    }, 100);
    return () => window.clearInterval(t);
  }, [cfg.segundos]);

  function tocar(letra: "A" | "B") {
    if (terminado.current) return;
    if (inicio.current === null) inicio.current = performance.now();
    lista.current = [...lista.current, letra];
    setToques(lista.current);
  }

  const proxima = toques.length === 0 ? "A" : toques[toques.length - 1] === "A" ? "B" : "A";
  const seg = Math.ceil(restante / 1000);

  return (
    <div className="flex flex-col items-center gap-5">
      <span className="kpi-numero text-5xl tabular-nums">00:{String(seg).padStart(2, "0")}</span>
      <div className="flex gap-6">
        {(["A", "B"] as const).map((l) => (
          <button
            key={l}
            type="button"
            onPointerDown={() => tocar(l)}
            className={cn(
              "flex size-32 touch-manipulation items-center justify-center rounded-full text-4xl font-bold shadow-elevada transition-all select-none active:scale-95",
              proxima === l ? "bg-primary text-primary-foreground" : "bg-secondary text-primary",
            )}
          >
            {l}
          </button>
        ))}
      </div>
      <p className="font-bold text-primary tabular-nums" role="status">
        {toques.length}
      </p>
    </div>
  );
}

/* ---------- Espiral ---------- */

function Espiral({ cfg, onFin }: { cfg: Config["espiral"]; onFin: (r: Resultado<"espiral">) => void }) {
  const [trazo, setTrazo] = useState<{ x: number; y: number; t: number }[]>([]);
  const dibujando = useRef(false);
  const svg = useRef<SVGSVGElement>(null);
  const plantilla = puntosEspiral(cfg.vueltas, 90)
    .map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");

  function punto(e: React.PointerEvent) {
    const r = svg.current!.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * LIENZO_ESPIRAL,
      y: ((e.clientY - r.top) / r.height) * LIENZO_ESPIRAL,
      t: performance.now(),
    };
  }

  const camino = trazo.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        ref={svg}
        viewBox={`0 0 ${LIENZO_ESPIRAL} ${LIENZO_ESPIRAL}`}
        className="tarjeta aspect-square w-full max-w-80 touch-none"
        onPointerDown={(e) => {
          (e.target as Element).setPointerCapture?.(e.pointerId);
          dibujando.current = true;
          setTrazo((t) => [...t, punto(e)]);
        }}
        onPointerMove={(e) => {
          if (dibujando.current) setTrazo((t) => [...t, punto(e)]);
        }}
        onPointerUp={() => (dibujando.current = false)}
        onPointerCancel={() => (dibujando.current = false)}
      >
        <path d={plantilla} fill="none" stroke="#cfe6e0" strokeWidth="14" strokeLinecap="round" />
        <path d={plantilla} fill="none" stroke="#0f6e63" strokeWidth="2" strokeDasharray="4 6" />
        <circle cx={LIENZO_ESPIRAL / 2} cy={LIENZO_ESPIRAL / 2} r="6" fill="#0f6e63" />
        <path d={camino} fill="none" stroke="#a0612a" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="flex w-full flex-col gap-3">
        <BotonPrincipal disabled={trazo.length < 15} onClick={() => onFin(resumirEspiral(trazo, cfg.vueltas))}>
          {cfg.terminar}
        </BotonPrincipal>
        {trazo.length > 0 && (
          <button type="button" onClick={() => setTrazo([])} className="font-bold text-primary underline">
            {cfg.borrar}
          </button>
        )}
      </div>
    </div>
  );
}
