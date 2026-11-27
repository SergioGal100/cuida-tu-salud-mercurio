import type { ReactNode } from "react";
import type { AlertaAbierta } from "@/application/ports/VigilanciaRepository";
import type { ContentPack } from "@/domain/contenido/ContentPack";
import { CLAVES_NIVEL, type FiltroOrigen, type Insignia, type ResumenVigilancia } from "@/domain/vigilancia";
import { cn } from "@/presentation/lib/utils";
import { BotonRecalcular } from "./BotonRecalcular";
import { BarrasConteo, MapaCalor, SerieSemanal, fmt } from "./graficos";

const ESTILO_INSIGNIA: Record<Insignia, { clase: string; marca: string }> = {
  alto: { clase: "bg-rojo-suave text-rojo", marca: "▲" },
  medio: { clase: "bg-amarillo-suave text-amarillo", marca: "●" },
  bajo: { clase: "bg-verde-suave text-verde", marca: "▽" },
};

function Panel({ titulo, nota, children, className }: { titulo: string; nota?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("tarjeta flex flex-col gap-4 p-5", className)}>
      <header className="flex flex-col gap-0.5">
        <h2 className="text-xl font-bold">{titulo}</h2>
        {nota && <p className="text-sm text-muted-foreground">{nota}</p>}
      </header>
      {children}
    </section>
  );
}

function Kpi({ titulo, valor, nota, acento }: { titulo: string; valor: number; nota: string; acento?: boolean }) {
  return (
    <div className={cn("tarjeta flex flex-col gap-2 p-4 lg:p-5", acento && "border-rojo/30 bg-gradient-to-br from-card to-rojo-suave")}>
      <span className="text-base font-bold text-muted-foreground">{titulo}</span>
      <span className={cn("kpi-numero", acento && "text-rojo")}>{valor}</span>
      <span className="text-sm text-muted-foreground">{nota}</span>
    </div>
  );
}

/** "**negrita** resto" → <b>negrita</b> resto (solo para los textos de privacidad del pack). */
function ConNegrita({ texto }: { texto: string }) {
  return (
    <>
      {texto.split(/(\*\*[^*]+\*\*)/).map((p, i) =>
        p.startsWith("**") ? <b key={i}>{p.slice(2, -2)}</b> : <span key={i}>{p}</span>,
      )}
    </>
  );
}

export function PanelVigilancia({
  resumen,
  alertas,
  filtros,
  pack,
}: {
  resumen: ResumenVigilancia;
  alertas: AlertaAbierta[];
  filtros: { dias: number; origen: FiltroOrigen };
  pack: ContentPack;
}) {
  const cfg = pack.vigilancia;
  const t = cfg.textos;
  const k = resumen.kpis;
  const nombreOrigen = { todos: t.origenTodos, auto: t.origenAuto, posta: t.origenPosta }[filtros.origen];
  const nombreMunicipio = (c: string) =>
    (resumen.municipios.find((m) => m.codigo === c)?.nombre ?? c).replace(/\s*\(prueba\)/, "");
  const etiquetaNivel = (n: string) => (n === "URGENTE" ? pack.postaUi.urgente : pack.postaUi[`nivel_${n}`]) ?? n;
  const celda = (v: number | null) => (v === null ? "<5" : v);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-bold tracking-widest text-primary uppercase">{t.antetitulo}</span>
          <h1 className="text-3xl font-bold">{t.titulo}</h1>
        </div>
        <span className="insignia bg-tierra px-4 py-2 text-base text-white shadow-suave">{t.datosPrueba}</span>
      </header>

      <p className="rounded-2xl border border-[#f0d9a8] bg-amarillo-suave/70 p-4 text-base">{t.avisoMaqueta}</p>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm font-bold text-muted-foreground">
          {t.periodo}
          <select name="dias" defaultValue={filtros.dias} className="min-h-11 rounded-xl border bg-card px-3 text-base font-bold text-foreground shadow-suave">
            {cfg.periodosDias.map((d) => (
              <option key={d} value={d}>
                {fmt(t.ultimosDias, { n: d })}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-bold text-muted-foreground">
          {t.origen}
          <select name="origen" defaultValue={filtros.origen} className="min-h-11 rounded-xl border bg-card px-3 text-base font-bold text-foreground shadow-suave">
            <option value="todos">{t.origenTodos}</option>
            <option value="auto">{t.origenAuto}</option>
            <option value="posta">{t.origenPosta}</option>
          </select>
        </label>
        <button type="submit" className="min-h-11 rounded-xl border-2 border-primary bg-card px-4 font-bold text-primary shadow-suave">
          {t.aplicar}
        </button>
        <span className="ml-auto text-sm text-muted-foreground">
          {fmt(t.mostrando, { periodo: fmt(t.ultimosDias, { n: filtros.dias }), origen: nombreOrigen })}
        </span>
      </form>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Kpi titulo={t.kpiTests} valor={k.tests} nota={t.kpiTestsNota} />
        <Kpi titulo={t.kpiVisita} valor={k.conVisita} nota={fmt(t.kpiVisitaNota, { n: k.conVisita, total: k.tests })} />
        <Kpi titulo={t.kpiAlerta} valor={k.municipiosEnAlerta} nota={fmt(t.kpiAlertaNota, { total: k.totalMunicipios })} acento={k.municipiosEnAlerta > 0} />
        <Kpi titulo={t.kpiPosta} valor={k.verificadosPosta} nota={t.kpiPostaNota} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Panel titulo={t.mapaTitulo} nota={t.mapaNota}>
          <MapaCalor municipios={resumen.municipios} textos={{ titulo: t.mapaTitulo, menos: t.menos, mas: t.mas, suprimido: t.suprimido }} />
        </Panel>

        <div className="flex flex-col gap-5">
          <Panel titulo={t.municipiosTitulo} nota={t.municipiosNota}>
            <ul className="flex flex-col gap-2">
              {resumen.municipios.map((m) => (
                <li key={m.codigo} className="flex items-center gap-3 rounded-xl border bg-background/60 px-4 py-3">
                  <div className="flex flex-1 flex-col">
                    <span className="font-bold">{m.nombre.replace(/\s*\(prueba\)/, "")}</span>
                    {m.enAlerta && <span className="text-sm font-bold text-rojo">● {t.enAlerta}</span>}
                  </div>
                  <span className="text-lg font-bold">{celda(m.conVisita)}</span>
                  {m.insignia ? (
                    <span className={cn("insignia", ESTILO_INSIGNIA[m.insignia].clase)}>
                      {ESTILO_INSIGNIA[m.insignia].marca} {t[m.insignia]}
                    </span>
                  ) : (
                    <span className="insignia bg-muted text-muted-foreground">{t.suprimido}</span>
                  )}
                </li>
              ))}
            </ul>
          </Panel>

          <Panel titulo={t.alertasTitulo} className={alertas.length ? "border-rojo/30" : undefined}>
            {alertas.length === 0 ? (
              <p className="text-muted-foreground">{t.sinAlertas}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {alertas.map((a) => (
                  <li key={a.id} className="flex gap-3 rounded-xl border-l-4 border-l-rojo bg-rojo-suave/60 p-3">
                    <span aria-hidden className="text-xl text-rojo">▲</span>
                    <div className="flex flex-col">
                      <span className="font-bold">{nombreMunicipio(a.municipioCodigo)}</span>
                      <span className="text-sm">{fmt(cfg.alerta.texto, { n: a.conteo, dias: cfg.alerta.ventanaDias })}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <BotonRecalcular
              textos={{ recalcular: t.recalcular, recalculando: t.recalculando, recalculado: t.recalculado, error: t.errorRecalcular }}
            />
          </Panel>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Panel titulo={t.serieTitulo} nota={t.serieNota}>
          <SerieSemanal serie={resumen.serieSemanal} idioma={pack.idioma} />
        </Panel>
        <Panel titulo={t.sintomasTitulo} nota={t.conteoNota}>
          <BarrasConteo filas={resumen.sintomas} base={resumen.baseConteos} textoDe={t.deTotal} />
        </Panel>
        <Panel titulo={t.exposicionesTitulo} nota={t.conteoNota}>
          <BarrasConteo filas={resumen.exposiciones} base={resumen.baseConteos} textoDe={t.deTotal} />
        </Panel>
      </div>

      <Panel titulo={t.tablaTitulo} nota={t.tablaNota}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] border-separate border-spacing-0 text-left text-base">
            <thead>
              <tr className="text-sm text-muted-foreground">
                <th className="border-b px-3 py-2">{t.municipio}</th>
                {CLAVES_NIVEL.map((n) => (
                  <th key={n} className="border-b px-3 py-2 text-right">
                    {etiquetaNivel(n)}
                  </th>
                ))}
                <th className="border-b px-3 py-2 text-right">{t.total}</th>
              </tr>
            </thead>
            <tbody>
              {[...resumen.municipios, { ...resumen.sinMunicipio, nombre: pack.ui.prefieroNoDecir, codigo: "_" }].map((m) => (
                <tr key={m.codigo} className="even:bg-background/60">
                  <td className="px-3 py-2 font-bold">{m.nombre.replace(/\s*\(prueba\)/, "")}</td>
                  {CLAVES_NIVEL.map((n) => (
                    <td key={n} className={cn("px-3 py-2 text-right tabular-nums", m.porNivel[n] === null && "text-muted-foreground")}>
                      {celda(m.porNivel[n])}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right font-bold tabular-nums">{celda(m.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel titulo={t.privacidadTitulo}>
        <ul className="grid gap-3 sm:grid-cols-2">
          {cfg.privacidad.map((p) => (
            <li key={p} className="flex gap-3 rounded-xl bg-secondary/60 p-3">
              <span aria-hidden className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">
                ✓
              </span>
              <span>
                <ConNegrita texto={p} />
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
