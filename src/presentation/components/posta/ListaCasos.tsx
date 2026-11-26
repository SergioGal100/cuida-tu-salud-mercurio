import Link from "next/link";
import type { FiltrosCasos } from "@/application/ports/ConsultaRepository";
import type { ResumenConsulta } from "@/domain/consulta/Consulta";
import { ESTADOS_CONSULTA } from "@/domain/consulta/Consulta";
import type { ContentPack } from "@/domain/contenido/ContentPack";
import type { Municipio } from "@/domain/contenido/Municipio";
import { ChipNivel, claseBoton, claseBotonSecundario, claseCampo, fechaCorta, tx } from "./comunes";

/** "Mis casos": lista del establecimiento con filtros por nivel y estado (formulario GET). */
export function ListaCasos({
  casos,
  filtros,
  pack,
  municipios,
}: {
  casos: ResumenConsulta[];
  filtros: FiltrosCasos;
  pack: ContentPack;
  municipios: Municipio[];
}) {
  const t = pack.postaUi;
  const nombreMunicipio = (c: string | null) =>
    municipios.find((m) => m.codigo === c)?.nombre ?? tx(t, "sinMunicipio");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-bold">{tx(t, "misCasos")}</h1>
        <Link href="/posta/nueva" className={claseBoton}>
          + {tx(t, "nuevaEntrevista")}
        </Link>
      </div>

      <form className="flex flex-wrap items-end gap-3" method="get">
        <label className="flex flex-col gap-1 text-sm font-bold">
          {tx(t, "filtroNivel")}
          <select name="nivel" defaultValue={filtros.nivel ?? ""} className={claseCampo}>
            <option value="">{tx(t, "todos")}</option>
            {pack.ordenNiveles.map((n) => (
              <option key={n} value={n}>
                {tx(t, `nivel_${n}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm font-bold">
          {tx(t, "filtroEstado")}
          <select name="estado" defaultValue={filtros.estado ?? ""} className={claseCampo}>
            <option value="">{tx(t, "todos")}</option>
            {ESTADOS_CONSULTA.map((e) => (
              <option key={e} value={e}>
                {tx(t, `estado_${e}`)}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className={claseBotonSecundario}>
          OK
        </button>
      </form>

      {casos.length === 0 ? (
        <p className="rounded-xl bg-muted p-4">{tx(t, "sinCasos")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {casos.map((c) => (
            <li key={c.id}>
              <Link
                href={`/posta/casos/${c.id}`}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border bg-card p-3 shadow-sm hover:border-primary"
              >
                <ChipNivel nivel={c.nivelFinal} urgente={c.urgente} t={t} />
                <span className="font-bold">{fechaCorta(c.fecha, pack.idioma)}</span>
                <span className="text-muted-foreground">{nombreMunicipio(c.municipioCodigo)}</span>
                <span className="text-sm text-muted-foreground">{tx(t, `estado_${c.estado}`)}</span>
                {c.tieneLaboratorio && (
                  <span className="rounded bg-secondary px-2 text-sm text-secondary-foreground">
                    {tx(t, "conLaboratorio")}
                  </span>
                )}
                <span className="ml-auto text-sm font-bold text-primary">{tx(t, "abrir")} →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
