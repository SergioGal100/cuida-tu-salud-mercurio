"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CAMPOS_EXAMEN,
  CONDUCTAS,
  ESTADOS_CONSULTA,
  type Conducta,
  type Consulta,
  type EstadoConsulta,
  type ExamenFisico,
} from "@/domain/consulta/Consulta";
import type { ContentPack, MuestraLaboratorio } from "@/domain/contenido/ContentPack";
import type { ResultadoEvaluacion } from "@/domain/scoring";
import { apiPosta } from "./apiPosta";
import { ChipNivel, claseBoton, claseCampo, fechaCorta, Tarjeta, tx } from "./comunes";

const hoyIso = () => new Date().toISOString().slice(0, 10);

/** Ficha clínica: entrevista, diferenciales, examen, conducta y laboratorio con recálculo. */
export function FichaConsulta({
  consulta,
  pack,
  municipioNombre,
}: {
  consulta: Consulta;
  pack: ContentPack;
  municipioNombre: string;
}) {
  const t = pack.postaUi;
  const router = useRouter();
  const r = consulta.resultadoEntrevista;

  // --- Ficha (examen, conducta, estado)
  const [examen, setExamen] = useState<ExamenFisico>(consulta.examen);
  const [conducta, setConducta] = useState<Conducta | null>(consulta.conducta);
  const [estado, setEstado] = useState<EstadoConsulta>(consulta.estado);
  const [fichaMsg, setFichaMsg] = useState<"ok" | "error" | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    setGuardando(true);
    setFichaMsg(null);
    try {
      await apiPosta.guardarFicha(consulta.id, { examen, conducta, estado });
      setFichaMsg("ok");
      router.refresh();
    } catch {
      setFichaMsg("error");
    } finally {
      setGuardando(false);
    }
  }

  // --- Laboratorio
  const muestras = [...new Set(pack.laboratorio.rangos.map((x) => x.muestra))];
  const [muestra, setMuestra] = useState<MuestraLaboratorio>(muestras[0]);
  const unidades = pack.laboratorio.rangos.filter((x) => x.muestra === muestra);
  const [unidad, setUnidad] = useState(unidades[0]?.unidad ?? "");
  const [valor, setValor] = useState("");
  const [fechaToma, setFechaToma] = useState(hoyIso());
  const [laboratorio, setLaboratorio] = useState("");
  const [recalculo, setRecalculo] = useState<ResultadoEvaluacion | null>(null);
  const [labError, setLabError] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function cargarLab(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setLabError(false);
    try {
      const res = await apiPosta.cargarLaboratorio(consulta.id, {
        muestra,
        unidad,
        valor: Number(valor.replace(",", ".")),
        fechaToma,
        laboratorio: laboratorio.trim() || null,
      });
      setRecalculo(res);
      setValor("");
      router.refresh();
    } catch {
      setLabError(true);
    } finally {
      setCargando(false);
    }
  }

  const regla = (id: string) => pack.reglas.find((x) => x.id === id);
  const sintomasSi = Object.entries(consulta.respuestas.sintomas ?? {})
    .filter(([, v]) => v === "si")
    .map(([k]) => k);
  const diferenciales = pack.posta.diferenciales.filter((d) => sintomasSi.includes(d.sintoma));
  const etiquetaSintoma = (id: string) => pack.sintomas.grupos.find((g) => g.id === id)?.etiqueta ?? id;
  const textoAdvertencia: Record<string, string> = {
    laboratorio_vencido: tx(t, "labVencido"),
    laboratorio_fecha_futura: tx(t, "labFechaFutura"),
    laboratorio_sin_rango: tx(t, "labSinRango"),
  };

  return (
    <div className="flex flex-col gap-4">
      <Link href="/posta" className="text-base font-bold text-primary">
        ← {tx(t, "volver")}
      </Link>

      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">{tx(t, "ficha")}</h1>
        <span className="text-muted-foreground">
          {fechaCorta(consulta.fecha, pack.idioma)} · {municipioNombre}
        </span>
      </header>

      <Tarjeta>
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-bold">{tx(t, "nivelFinal")}</span>
          <ChipNivel nivel={consulta.nivelFinal} urgente={r.urgente} t={t} />
          <span className="text-sm text-muted-foreground">{tx(t, `estado_${consulta.estado}`)}</span>
        </div>
      </Tarjeta>

      <div className="grid gap-4 lg:grid-cols-2">
        <Tarjeta titulo={tx(t, "entrevista")}>
          <dl className="grid grid-cols-3 gap-2 text-center">
            {[
              ["exposicion", r.puntajeExposicion, pack.exposicion.tope],
              ["sintomas", r.puntajeSintomas, pack.sintomas.tope],
              ["total", r.puntaje, pack.exposicion.tope + pack.sintomas.tope],
            ].map(([k, v, max]) => (
              <div key={k as string} className="rounded-lg bg-muted p-2">
                <dt className="text-sm text-muted-foreground">{tx(t, k as string)}</dt>
                <dd className="text-xl font-bold">
                  {v} <span className="text-sm font-normal text-muted-foreground">/ {max}</span>
                </dd>
              </div>
            ))}
          </dl>
          <div className="flex items-center gap-2">
            <span className="text-sm">{tx(t, "entrevista")}:</span>
            <ChipNivel nivel={r.nivel} urgente={r.urgente} t={t} />
          </div>

          <h3 className="font-bold">{tx(t, "reglasAplicadas")}</h3>
          {r.reglas.length === 0 ? (
            <p className="text-muted-foreground">{tx(t, "sinReglas")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {r.reglas.map((id) => (
                <li key={id} className="rounded-lg border p-2">
                  <p className="font-mono text-sm font-bold">{id}</p>
                  <p>{regla(id)?.motivo}</p>
                  <p className="text-sm text-muted-foreground">{tx(t, `origen_${regla(id)?.origen}`)}</p>
                </li>
              ))}
            </ul>
          )}

          <h3 className="font-bold">{tx(t, "motivos")}</h3>
          <ul className="list-disc pl-5">
            {r.motivos.filter((m) => m.tipo !== "regla").map((m) => (
              <li key={`${m.tipo}-${m.id}`}>{m.texto}</li>
            ))}
          </ul>
          {r.dudas.length > 0 && (
            <p className="rounded-lg bg-accent p-2 text-accent-foreground">
              <b>{tx(t, "dudas")}:</b> {r.dudas.map(etiquetaSintoma).join(", ")}
            </p>
          )}
          {r.muestraSugerida && (
            <div className="rounded-lg bg-secondary p-2 text-secondary-foreground">
              <b>{tx(t, "muestraSugerida")}:</b> {pack.muestraSugerida.textos[r.muestraSugerida]}
              {r.muestraSugerida.includes("ORINA") && (
                <details className="mt-1">
                  <summary className="cursor-pointer font-bold">{tx(t, "guiaOrina")}</summary>
                  <ul className="list-disc pl-5">
                    {pack.laboratorio.guiaMuestraOrina.map((g) => (
                      <li key={g}>{g}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </Tarjeta>

        <div className="flex flex-col gap-4">
          {diferenciales.length > 0 && (
            <Tarjeta titulo={tx(t, "diferenciales")}>
              <ul className="flex flex-col gap-2">
                {diferenciales.map((d) => (
                  <li key={d.sintoma}>
                    <b>{etiquetaSintoma(d.sintoma)}:</b> {d.otrasCausas}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-muted-foreground">{pack.posta.notaDiferencial}</p>
            </Tarjeta>
          )}

          <Tarjeta titulo={tx(t, "examen")}>
            {CAMPOS_EXAMEN.map((c) => (
              <label key={c} className="flex min-h-11 items-center gap-3">
                <input
                  type="checkbox"
                  className="size-5 accent-[var(--primary)]"
                  checked={!!examen[c]}
                  onChange={(e) => setExamen({ ...examen, [c]: e.target.checked })}
                />
                {tx(t, `examen_${c}`)}
              </label>
            ))}
            <label className="flex flex-col gap-1">
              <span className="font-bold">{tx(t, "conducta")}</span>
              <select
                className={claseCampo}
                value={conducta ?? ""}
                onChange={(e) => setConducta((e.target.value || null) as Conducta | null)}
              >
                <option value="">{tx(t, "sinConducta")}</option>
                {CONDUCTAS.map((c) => (
                  <option key={c} value={c}>
                    {tx(t, `conducta_${c}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-bold">{tx(t, "estado")}</span>
              <select className={claseCampo} value={estado} onChange={(e) => setEstado(e.target.value as EstadoConsulta)}>
                {ESTADOS_CONSULTA.map((e) => (
                  <option key={e} value={e}>
                    {tx(t, `estado_${e}`)}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className={claseBoton} onClick={guardar} disabled={guardando}>
              {tx(t, "guardar")}
            </button>
            {fichaMsg === "ok" && <p className="text-verde">{tx(t, "guardado")}</p>}
            {fichaMsg === "error" && <p className="text-rojo">{tx(t, "errorGuardar")}</p>}
          </Tarjeta>

          <Tarjeta titulo={tx(t, "laboratorio")}>
            <form onSubmit={cargarLab} className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-bold">{tx(t, "muestra")}</span>
                <select
                  className={claseCampo}
                  value={muestra}
                  onChange={(e) => {
                    const m = e.target.value as MuestraLaboratorio;
                    setMuestra(m);
                    setUnidad(pack.laboratorio.rangos.find((x) => x.muestra === m)?.unidad ?? "");
                  }}
                >
                  {muestras.map((m) => (
                    <option key={m} value={m}>
                      {tx(t, `muestra_${m}`)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-bold">{tx(t, "unidad")}</span>
                <select className={claseCampo} value={unidad} onChange={(e) => setUnidad(e.target.value)}>
                  {unidades.map((u) => (
                    <option key={u.unidad} value={u.unidad}>
                      {u.unidadTexto}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-bold">{tx(t, "valor")}</span>
                <input
                  className={claseCampo}
                  inputMode="decimal"
                  required
                  pattern="[0-9]+([.,][0-9]+)?"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-bold">{tx(t, "fechaToma")}</span>
                <input
                  className={claseCampo}
                  type="date"
                  required
                  max={hoyIso()}
                  value={fechaToma}
                  onChange={(e) => setFechaToma(e.target.value)}
                />
              </label>
              <label className="col-span-2 flex flex-col gap-1">
                <span className="text-sm font-bold">{tx(t, "nombreLaboratorio")}</span>
                <input className={claseCampo} maxLength={80} value={laboratorio} onChange={(e) => setLaboratorio(e.target.value)} />
              </label>
              <button type="submit" className={`${claseBoton} col-span-2`} disabled={cargando}>
                {tx(t, "cargarResultado")}
              </button>
            </form>
            {labError && <p className="text-rojo">{tx(t, "errorGuardar")}</p>}

            {recalculo && (
              <div className="flex flex-col gap-2 rounded-lg border-2 border-primary/40 bg-secondary p-3" role="status">
                <div className="flex flex-wrap items-center gap-2">
                  <b>{tx(t, "recalculado")}</b>
                  <ChipNivel nivel={recalculo.nivel} urgente={recalculo.urgente} t={t} />
                </div>
                {recalculo.nivelLaboratorio && (
                  <div className="flex items-center gap-2 text-sm">
                    {tx(t, "nivelLaboratorio")}: <ChipNivel nivel={recalculo.nivelLaboratorio} t={t} />
                  </div>
                )}
                {recalculo.advertencias.map((a) => (
                  <p key={a} className="rounded bg-amarillo-suave p-2 text-amarillo">
                    {textoAdvertencia[a] ?? a}
                  </p>
                ))}
              </div>
            )}

            {consulta.laboratorios.length > 0 && (
              <>
                <h3 className="font-bold">{tx(t, "laboratoriosCargados")}</h3>
                <ul className="flex flex-col gap-1">
                  {consulta.laboratorios.map((l) => (
                    <li key={l.id} className="flex flex-wrap items-center gap-2 text-sm">
                      <span>{fechaCorta(`${l.fechaToma}T12:00:00Z`, pack.idioma)}</span>
                      <span className="font-bold">
                        {tx(t, `muestra_${l.muestra}`)} {l.valor}{" "}
                        {pack.laboratorio.rangos.find((x) => x.muestra === l.muestra && x.unidad === l.unidad)?.unidadTexto ??
                          l.unidad}
                      </span>
                      {l.nivel && <ChipNivel nivel={l.nivel} t={t} />}
                      {l.laboratorio && <span className="text-muted-foreground">{l.laboratorio}</span>}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Tarjeta>
        </div>
      </div>

      <p className="rounded-xl bg-muted p-4 font-bold">{pack.resultado.aviso}</p>
    </div>
  );
}
