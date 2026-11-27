import type { Conteo, FilaMunicipio, ResumenVigilancia } from "@/domain/vigilancia";
import { DEPARTAMENTOS, MAPA_ALTO, MAPA_ANCHO, proyectar } from "./boliviaGeo";

/** Reemplaza {clave} en un texto del pack. */
export const fmt = (t: string, v: Record<string, string | number>) =>
  t.replace(/\{(\w+)\}/g, (_, k: string) => String(v[k] ?? `{${k}}`));

const ESCALA = ["#f3c66b", "#e0853a", "#b3361f", "#7a1410"];

function colorCalor(t: number) {
  const x = Math.min(Math.max(t, 0), 1) * (ESCALA.length - 1);
  return ESCALA[Math.round(x)];
}

/**
 * Dónde va el nombre de cada departamento: punto interior lejos del borde y de
 * los municipios del catálogo (calculado una vez; Santa Cruz ajustado a mano).
 * Si se cambia municipios.json, revisar que no se tapen.
 */
const ETIQUETA_DEPTO: Record<string, [number, number]> = {
  Beni: [135, 168],
  Chuquisaca: [228, 459],
  Cochabamba: [159, 312],
  "La Paz": [60, 318],
  Oruro: [69, 366],
  Pando: [81, 96],
  Potosí: [105, 474],
  "Santa Cruz": [345, 385],
  Tarija: [252, 489],
};

export interface TextosMapa {
  titulo: string;
  menos: string;
  mas: string;
  suprimido: string;
  leyendaSuprimido: string;
  detalle: string;
  detalleSuprimido: string;
}

type Caja = { x1: number; y1: number; x2: number; y2: number };
type Ubicacion = { dx: number; dy: number; ancla: "start" | "end" | "middle" };
const choca = (a: Caja, b: Caja) => a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2;

const OPCIONES: Ubicacion[] = [
  { dx: 10, dy: 4, ancla: "start" },
  { dx: -10, dy: 4, ancla: "end" },
  { dx: 0, dy: -12, ancla: "middle" },
  { dx: 0, dy: 20, ancla: "middle" },
  { dx: 10, dy: -9, ancla: "start" },
  { dx: -10, dy: 17, ancla: "end" },
  { dx: 10, dy: 17, ancla: "start" },
  { dx: -10, dy: -9, ancla: "end" },
];

/**
 * Ubica cada nombre en el primer lugar libre alrededor de su punto, en orden de
 * importancia, sin pisar otros nombres ni puntos y sin salirse del mapa.
 */
function ubicarEtiquetas(puntos: { cx: number; cy: number; texto: string }[], fs: number): Ubicacion[] {
  const ocupadas: Caja[] = puntos.map((p) => ({ x1: p.cx - 7, y1: p.cy - 7, x2: p.cx + 7, y2: p.cy + 7 }));
  return puntos.map((p, i) => {
    const w = p.texto.length * fs * 0.56;
    const h = fs * 1.1;
    const caja = (o: Ubicacion): Caja => {
      const x = p.cx + o.dx;
      const x1 = o.ancla === "start" ? x : o.ancla === "end" ? x - w : x - w / 2;
      const y2 = p.cy + o.dy + 2;
      return { x1, y1: y2 - h, x2: x1 + w, y2 };
    };
    const libre =
      OPCIONES.find((o) => {
        const c = caja(o);
        if (c.x1 < 2 || c.x2 > MAPA_ANCHO - 2 || c.y1 < 2 || c.y2 > MAPA_ALTO - 2) return false;
        return !ocupadas.some((b, j) => j !== i && choca(c, b));
      }) ?? OPCIONES[0];
    ocupadas.push(caja(libre));
    return libre;
  });
}

/**
 * Mapa de Bolivia con sus departamentos. Cada municipio es un punto en su centro
 * (lat/lon del catálogo) con un halo de calor según los chequeos con visita
 * recomendada. Sin Leaflet ni teselas: funciona sin internet y no ubica a nadie.
 * Pasando el mouse (o tocando) sobre un punto se ve el detalle.
 */
export function MapaCalor({ municipios, textos }: { municipios: FilaMunicipio[]; textos: TextosMapa }) {
  const max = Math.max(1, ...municipios.map((m) => m.conVisita ?? 0));
  const FS = 12;
  // Los de menos visitas se dibujan primero (los de más quedan encima).
  const puntos = [...municipios]
    .sort((a, b) => (a.conVisita ?? -1) - (b.conVisita ?? -1))
    .map((m) => {
      const [cx, cy] = proyectar(m.lonCentro, m.latCentro);
      return { m, cx, cy, texto: m.nombre };
    });
  // Los de más visitas eligen primero dónde va su nombre.
  const porImportancia = [...puntos].reverse();
  const ubicaciones = ubicarEtiquetas(porImportancia, FS);
  const etiquetas = new Map(porImportancia.map((p, i) => [p.m.codigo, ubicaciones[i]]));
  const detalle = (m: FilaMunicipio) =>
    fmt(m.suprimido ? textos.detalleSuprimido : textos.detalle, {
      municipio: m.nombre,
      departamento: m.departamento ?? "",
      visita: m.conVisita ?? 0,
      total: m.total ?? 0,
    });

  return (
    <div className="flex flex-col gap-3">
      <svg
        viewBox={`0 0 ${MAPA_ANCHO} ${MAPA_ALTO}`}
        className="mx-auto w-full max-w-[34rem] rounded-xl bg-[#eaf1ec]"
        role="img"
        aria-label={textos.titulo}
      >
        <defs>
          {municipios.map((m) => {
            const c = colorCalor((m.conVisita ?? 0) / max);
            return (
              <radialGradient key={m.codigo} id={`calor-${m.codigo}`}>
                <stop offset="0%" stopColor={c} stopOpacity="0.9" />
                <stop offset="55%" stopColor={c} stopOpacity="0.4" />
                <stop offset="100%" stopColor={c} stopOpacity="0" />
              </radialGradient>
            );
          })}
          <clipPath id="bolivia">
            {DEPARTAMENTOS.map((d) => (
              <path key={d.nombre} d={d.d} />
            ))}
          </clipPath>
        </defs>

        {/* Borde del país: trazo grueso debajo, tapado por dentro con el relleno. */}
        <g fill="none" stroke="#7f978a" strokeWidth="3.5" strokeLinejoin="round">
          {DEPARTAMENTOS.map((d) => (
            <path key={d.nombre} d={d.d} />
          ))}
        </g>
        <g fill="#fffdf9">
          {DEPARTAMENTOS.map((d) => (
            <path key={d.nombre} d={d.d} />
          ))}
        </g>

        {/* Calor, recortado al territorio. */}
        <g clipPath="url(#bolivia)">
          {puntos.map(({ m, cx, cy }) =>
            !m.suprimido && (m.conVisita ?? 0) > 0 ? (
              <circle
                key={m.codigo}
                cx={cx}
                cy={cy}
                r={16 + 34 * Math.sqrt((m.conVisita ?? 0) / max)}
                fill={`url(#calor-${m.codigo})`}
              />
            ) : null,
          )}
        </g>

        {/* Límites departamentales y sus nombres. */}
        <g fill="none" stroke="#c6b998" strokeWidth="0.9" strokeDasharray="3 2.5">
          {DEPARTAMENTOS.map((d) => (
            <path key={d.nombre} d={d.d} />
          ))}
        </g>
        {DEPARTAMENTOS.map((d) => {
          const [x, y] = ETIQUETA_DEPTO[d.nombre] ?? [d.cx, d.cy];
          return (
            <text key={d.nombre} x={x} y={y} textAnchor="middle" fontSize="10.5" fontWeight="700" letterSpacing="1.5" fill="#a8997a">
              {d.nombre.toUpperCase()}
            </text>
          );
        })}

        {puntos.map(({ m, cx, cy, texto }) => {
          const o = etiquetas.get(m.codigo) ?? OPCIONES[0];
          return (
            <g key={m.codigo}>
              <title>{detalle(m)}</title>
              {/* Área invisible más grande para poder tocarlo en el celular. */}
              <circle cx={cx} cy={cy} r="14" fill="transparent" />
              {m.suprimido ? (
                <circle cx={cx} cy={cy} r="6" fill="#ffffff" stroke="#7d8784" strokeWidth="1.8" strokeDasharray="2.5 2" />
              ) : (
                <circle
                  cx={cx}
                  cy={cy}
                  r={m.enAlerta ? 6 : 4.8}
                  fill={m.enAlerta ? "#9b1c14" : "#1f2a2e"}
                  stroke="#ffffff"
                  strokeWidth="2"
                />
              )}
              <text
                x={cx + o.dx}
                y={cy + o.dy}
                textAnchor={o.ancla}
                fontSize={FS}
                fontWeight="700"
                fill={m.suprimido ? "#5b6669" : "#1f2a2e"}
                paintOrder="stroke"
                stroke="#fffdf9"
                strokeWidth="3.5"
                strokeLinejoin="round"
              >
                {texto}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
        <span className="flex items-center gap-3">
          {textos.menos}
          <span className="h-2.5 w-32 rounded-full" style={{ background: `linear-gradient(90deg, ${ESCALA.join(",")})` }} />
          {textos.mas}
        </span>
        <span className="flex items-center gap-2">
          <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
            <circle cx="8" cy="8" r="5.5" fill="#fff" stroke="#7d8784" strokeWidth="1.6" strokeDasharray="2.5 2" />
          </svg>
          {textos.leyendaSuprimido}
        </span>
      </div>
    </div>
  );
}

/** Serie semanal como área suave. */
export function SerieSemanal({ serie, idioma }: { serie: ResumenVigilancia["serieSemanal"]; idioma: string }) {
  const W = 320;
  const H = 220;
  const P = { izq: 28, der: 12, arr: 20, aba: 22 };
  const max = Math.max(5, ...serie.map((s) => s.conteo));
  const techo = Math.ceil(max / 5) * 5;
  const x = (i: number) => P.izq + (i / Math.max(serie.length - 1, 1)) * (W - P.izq - P.der);
  const y = (v: number) => P.arr + (1 - v / techo) * (H - P.arr - P.aba);
  const linea = serie.map((s, i) => `${i ? "L" : "M"}${x(i)},${y(s.conteo)}`).join(" ");
  const area = `${linea} L${x(serie.length - 1)},${y(0)} L${x(0)},${y(0)} Z`;
  const fecha = (iso: string) => new Date(iso).toLocaleDateString(idioma, { day: "numeric", month: "short" });
  const ultimo = serie[serie.length - 1];
  const n = serie.length - 1;
  const marcas = [...new Set([0, Math.floor(n / 3), Math.floor((2 * n) / 3), n])];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden>
      <defs>
        <linearGradient id="area-serie" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f6e63" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#0f6e63" stopOpacity="0.03" />
        </linearGradient>
      </defs>
      {[0, techo / 2, techo].map((v) => (
        <g key={v}>
          <line x1={P.izq} x2={W - P.der} y1={y(v)} y2={y(v)} stroke="#e6ddcc" />
          <text x={P.izq - 6} y={y(v) + 4} textAnchor="end" fontSize="10" fill="#5b6669">
            {v}
          </text>
        </g>
      ))}
      <path d={area} fill="url(#area-serie)" />
      <path d={linea} fill="none" stroke="#0f6e63" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {ultimo && (
        <g>
          <circle cx={x(n)} cy={y(ultimo.conteo)} r="4.5" fill="#134e4a" stroke="#fff" strokeWidth="2" />
          <text x={x(n)} y={y(ultimo.conteo) - 9} textAnchor="end" fontSize="11" fontWeight="700" fill="#134e4a">
            {ultimo.conteo}
          </text>
        </g>
      )}
      {marcas.map((i) => (
        <text key={i} x={x(i)} y={H - 4} textAnchor={i === 0 ? "start" : i === n ? "end" : "middle"} fontSize="10" fill="#5b6669">
          {fecha(serie[i].inicio)}
        </text>
      ))}
    </svg>
  );
}

/** Lista de barras horizontales con "n de total" (sin porcentajes). */
export function BarrasConteo({
  filas,
  base,
  textoDe,
}: {
  filas: { id: string; etiqueta: string; conteo: Conteo }[];
  base: Conteo;
  textoDe: string;
}) {
  return (
    <ul className="flex flex-col gap-3">
      {filas.map((f) => (
        <li key={f.id} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
          <span className="text-base leading-snug">{f.etiqueta}</span>
          <span className="text-right text-sm font-bold whitespace-nowrap">
            {f.conteo === null || base === null ? "<5" : fmt(textoDe, { n: f.conteo, total: base })}
          </span>
          <span className="col-span-2 h-2.5 overflow-hidden rounded-full bg-crema">
            <span
              className="block h-full rounded-full bg-gradient-to-r from-[#13857a] to-primary"
              style={{ width: `${f.conteo && base ? Math.max((f.conteo / base) * 100, 2) : 0}%` }}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}
