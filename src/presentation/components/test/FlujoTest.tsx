"use client";

import { useEffect, useMemo, useState } from "react";
import type { ResultadoActividades } from "@/domain/actividades";
import type { ContentPack, PerfilEntrada } from "@/domain/contenido/ContentPack";
import { MUNICIPIO_NO_DICE, type Municipio } from "@/domain/contenido/Municipio";
import type { Evaluacion } from "@/domain/evaluacion/Evaluacion";
import { pasosDelTest, type Paso } from "@/domain/evaluacion/flujo";
import type { Respuestas, RespuestaSintoma } from "@/domain/scoring";
import { BotonPrincipal, BotonSecundario, ListaOpciones, Pantalla, TituloPregunta } from "./piezas";
import { Resultado } from "./Resultado";
import { ActividadesFlujo } from "../actividades/Actividades";
import { Ilustracion } from "../ui/Ilustracion";

/** Una ilustración por frase de confianza, en el orden del pack. */
const ILUSTRACION_CONFIANZA = ["escudo", "sin-documento", "senal"];

/** Ilustración de cada pregunta de contexto (por id del pack). */
const ILUSTRACION_CONTEXTO: Record<string, string> = {
  quienResponde: "personas",
  embarazoLactancia: "familia",
  ninosEnCasa: "nino",
};

export interface PropsFlujoTest {
  pack: ContentPack;
  municipios: Municipio[];
  /** Caso de uso RealizarTest, inyectado desde app/ vía composition. */
  realizarTest: (respuestas: Respuestas, actividades?: ResultadoActividades) => Promise<Evaluacion>;
  /** Entrada elegida en la portada: solo cambia la bienvenida. */
  perfil?: PerfilEntrada;
  onSalir: () => void;
  onVerHistorial?: () => void;
  /**
   * Modo entrevista (posta): sin pantalla de confianza ni "¿quién responde?",
   * y al terminar se guarda la consulta en vez de mostrar el resultado.
   */
  entrevista?: {
    alTerminar: (respuestas: Respuestas) => Promise<void>;
    textoGuardando: string;
    textoError: string;
    textoReintentar: string;
  };
}

function visibles(pack: ContentPack, r: Respuestas, entrevista: boolean): Paso[] {
  const pasos = pasosDelTest(pack, r);
  if (!entrevista) return pasos;
  return pasos.filter(
    (p) => p.tipo !== "confianza" && !(p.tipo === "contexto" && p.ids.includes("quienResponde")),
  );
}

/** Todo el test en una sola ruta: los pasos son estado de React, no páginas. */
export function FlujoTest({ pack, municipios, realizarTest, onSalir, onVerHistorial, entrevista, perfil }: PropsFlujoTest) {
  const [indice, setIndice] = useState(0);
  // Las actividades van entre los síntomas y el resultado (nunca en urgencias ni en la posta).
  const [enActividades, setEnActividades] = useState(false);
  const [respuestas, setRespuestas] = useState<Respuestas>({});
  const [evaluacion, setEvaluacion] = useState<Evaluacion | null>(null);
  const [error, setError] = useState(false);

  // Cada paso empieza arriba (si no, la pantalla siguiente queda a media altura).
  // Llaves a propósito: en Chrome reciente scrollTo devuelve una promesa y React
  // la tomaría como función de limpieza (rompía el test al pasar de paso).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [indice]);

  const esEntrevista = entrevista !== undefined;
  const pasos = useMemo(() => visibles(pack, respuestas, esEntrevista), [pack, respuestas, esEntrevista]);
  const paso: Paso = pasos[Math.min(indice, pasos.length - 1)];
  const ui = pack.ui;
  const totalPreguntas = pasos.filter((p) => p.tipo !== "confianza" && p.tipo !== "resultado").length;
  const esPromotor = respuestas.contexto?.quienResponde === "promotor";
  const marca = pack.app.nombreCorto;

  async function terminar(finales: Respuestas, actividades?: ResultadoActividades) {
    setError(false);
    try {
      if (entrevista) await entrevista.alTerminar(finales);
      else setEvaluacion(await realizarTest(finales, actividades));
    } catch {
      setError(true);
    }
  }

  /** Guarda la respuesta y avanza; si el siguiente paso es el resultado, evalúa. */
  function responder(nuevas: Respuestas) {
    setRespuestas(nuevas);
    const siguientes = visibles(pack, nuevas, esEntrevista);
    const proximo = indice + 1;
    setIndice(proximo);
    if (siguientes[proximo]?.tipo !== "resultado") return;
    const urgente = nuevas.alarmaAguda === "si";
    if (!esEntrevista && !urgente) setEnActividades(true);
    else void terminar(nuevas);
  }

  const conContexto = (id: string, valor: string | undefined) => ({
    ...respuestas,
    contexto: { ...respuestas.contexto, [id]: valor },
  });

  function reiniciar() {
    setEnActividades(false);
    setRespuestas({});
    setEvaluacion(null);
    setError(false);
    setIndice(0);
  }

  const atras =
    paso.tipo === "resultado" ? undefined : indice > 0 ? () => setIndice(indice - 1) : esEntrevista ? onSalir : undefined;
  const numero = esEntrevista ? indice + 1 : indice;
  const progreso =
    paso.tipo === "confianza" || paso.tipo === "resultado"
      ? undefined
      : {
          actual: numero,
          total: totalPreguntas,
          texto: ui.progreso.replace("{actual}", String(numero)).replace("{total}", String(totalPreguntas)),
        };

  if (enActividades) {
    return (
      <ActividadesFlujo
        pack={pack}
        marca={marca}
        onTerminar={(actividades) => {
          setEnActividades(false);
          void terminar(respuestas, actividades);
        }}
      />
    );
  }

  switch (paso.tipo) {
    case "confianza":
      return (
        <Pantalla
          pie={<BotonPrincipal onClick={() => setIndice(1)}>{pack.confianza.boton}</BotonPrincipal>}
          textoAtras={ui.atras}
          onAtras={onSalir}
        >
          <div className="hero -mx-4 -mt-5 flex flex-col items-center gap-2 rounded-b-[2rem] px-4 pt-4 pb-6">
            <Ilustracion
              id={perfil === "comunidad" ? "comunidad" : perfil === "mineria" ? "minero" : "hero"}
              className="size-40"
            />
            <h1 className="text-center text-3xl font-bold">{pack.app.nombreCorto}</h1>
            {perfil && <p className="text-center text-lg">{pack.confianza.bienvenida[perfil]}</p>}
          </div>
          <ul className="flex flex-col gap-3">
            {pack.confianza.frases.map((f, i) => (
              <li key={f} className="tarjeta flex items-center gap-4 p-4 text-lg leading-snug">
                <Ilustracion id={ILUSTRACION_CONFIANZA[i % ILUSTRACION_CONFIANZA.length]} className="size-16 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </Pantalla>
      );

    case "municipio": {
      const pregunta = pack.contexto.find((c) => c.fuente)!;
      const opciones = [
        ...municipios.map((m) => ({ id: m.codigo, texto: m.nombre })),
        { id: MUNICIPIO_NO_DICE, texto: ui.prefieroNoDecir },
      ];
      return (
        <Pantalla marca={marca} progreso={progreso} textoAtras={ui.atras} onAtras={atras}>
          <TituloPregunta ilustracion="ubicacion">{pregunta.pregunta}</TituloPregunta>
          <ListaOpciones
            opciones={opciones}
            valor={respuestas.contexto?.[pregunta.id]}
            onElegir={(v) => responder(conContexto(pregunta.id, v))}
          />
        </Pantalla>
      );
    }

    case "contexto": {
      const preguntas = paso.ids.map((id) => pack.contexto.find((c) => c.id === id)!);
      // Una sola pregunta obligatoria: avanza con un toque.
      if (preguntas.length === 1 && !preguntas[0].opcional) {
        const p = preguntas[0];
        return (
          <Pantalla marca={marca} progreso={progreso} textoAtras={ui.atras} onAtras={atras}>
            <TituloPregunta ilustracion={ILUSTRACION_CONTEXTO[p.id]}>{p.pregunta}</TituloPregunta>
            <ListaOpciones
              opciones={p.opciones ?? []}
              valor={respuestas.contexto?.[p.id]}
              onElegir={(v) => responder(conContexto(p.id, v))}
            />
          </Pantalla>
        );
      }
      // Preguntas opcionales juntas: se eligen y se sigue (o se salta).
      const algunaRespondida = preguntas.some((p) => respuestas.contexto?.[p.id]);
      return (
        <Pantalla
          marca={marca}
          progreso={progreso}
          textoAtras={ui.atras}
          onAtras={atras}
          pie={
            <BotonPrincipal onClick={() => responder(respuestas)}>
              {algunaRespondida ? ui.seguir : ui.saltar}
            </BotonPrincipal>
          }
        >
          {preguntas.map((p) => (
            <section key={p.id} className="flex flex-col gap-3">
              <h1 className="text-2xl font-bold">{p.pregunta}</h1>
              <ListaOpciones
                opciones={p.opciones ?? []}
                valor={respuestas.contexto?.[p.id]}
                onElegir={(v) =>
                  setRespuestas(conContexto(p.id, respuestas.contexto?.[p.id] === v ? undefined : v))
                }
              />
            </section>
          ))}
        </Pantalla>
      );
    }

    case "exposicion": {
      const grupo = pack.exposicion.grupos.find((g) => g.id === paso.grupoId)!;
      const valor = (respuestas as Record<string, unknown>)[grupo.id] as string | undefined;
      return (
        <Pantalla marca={marca} progreso={progreso} textoAtras={ui.atras} onAtras={atras}>
          <TituloPregunta icono={grupo.icono}>{grupo.pregunta}</TituloPregunta>
          <ListaOpciones
            opciones={grupo.opciones}
            valor={valor}
            onElegir={(v) => responder({ ...respuestas, [grupo.id]: v })}
          />
        </Pantalla>
      );
    }

    case "alarmaAguda":
      return (
        <Pantalla marca={marca} progreso={progreso} textoAtras={ui.atras} onAtras={atras}>
          <TituloPregunta>{pack.alarmaAguda.pregunta}</TituloPregunta>
          <ListaOpciones
            opciones={pack.alarmaAguda.opciones}
            valor={respuestas.alarmaAguda}
            onElegir={(v) => responder({ ...respuestas, alarmaAguda: v })}
          />
        </Pantalla>
      );

    case "sintoma": {
      const grupo = pack.sintomas.grupos.find((g) => g.id === paso.grupoId)!;
      return (
        <Pantalla marca={marca} progreso={progreso} textoAtras={ui.atras} onAtras={atras}>
          <TituloPregunta icono={grupo.icono}>{grupo.pregunta}</TituloPregunta>
          <ListaOpciones
            opciones={pack.sintomas.respuestas}
            valor={respuestas.sintomas?.[grupo.id]}
            onElegir={(v) =>
              responder({
                ...respuestas,
                sintomas: { ...respuestas.sintomas, [grupo.id]: v as RespuestaSintoma },
              })
            }
          />
        </Pantalla>
      );
    }

    case "resultado":
      if (entrevista) {
        return (
          <Pantalla
            pie={
              error && (
                <BotonPrincipal onClick={() => void terminar(respuestas)}>{entrevista.textoReintentar}</BotonPrincipal>
              )
            }
          >
            <p className={error ? "rounded-xl bg-rojo-suave p-4 text-rojo" : "animate-pulse text-muted-foreground"}>
              {error ? entrevista.textoError : entrevista.textoGuardando}
            </p>
          </Pantalla>
        );
      }
      return (
        <Pantalla
          marca={marca}
          pie={
            <>
              {esPromotor ? (
                <BotonPrincipal onClick={reiniciar}>{ui.nuevaPersona}</BotonPrincipal>
              ) : (
                onVerHistorial && <BotonPrincipal onClick={onVerHistorial}>{pack.app.botonHistorial}</BotonPrincipal>
              )}
              <BotonSecundario onClick={onSalir}>{ui.volverInicio}</BotonSecundario>
            </>
          }
        >
          {esPromotor && <p className="rounded-2xl bg-accent p-3 text-accent-foreground">{ui.modoPromotor}</p>}
          {evaluacion ? (
            <Resultado evaluacion={evaluacion} pack={pack} />
          ) : error ? (
            <p className="rounded-xl bg-rojo-suave p-4 text-rojo">{pack.resultado.aviso}</p>
          ) : (
            <p className="animate-pulse text-muted-foreground">…</p>
          )}
        </Pantalla>
      );
  }
}
