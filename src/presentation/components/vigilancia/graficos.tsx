import type { Conteo, FilaMunicipio, ResumenVigilancia } from "@/domain/vigilancia";

/** Reemplaza {clave} en un texto del pack. */
export const fmt = (t: string, v: Record<string, string | number>) =>
  t.replace(/\{(\w+)\}/g, (_, k: string) => String(v[k] ?? `{${k}}`));

const ESCALA = ["#f3c66b", "#e0853a", "#b3361f", "#7a1410"];

function colorCalor(t: number) {
  const x = Math.min(Math.max(t, 0), 1) * (ESCALA.length - 1);
  return ESCALA[Math.round(x)];
}

const TERRITORIO =
  "M40 70 C90 20 190 30 250 45 S380 60 395 140 S370 300 320 345 S170 385 110 350 S20 260 28 180 S10 110 40 70z";

/**
 * Mapa esquemático: cada municipio es una burbuja en su centro (lat/lon del
 * catálogo) con un halo de calor según los tests con visita recomendada.
 * Sin Leaflet ni teselas: funciona sin internet y no ubica a nadie.
 */
export function MapaCalor({
  municipios,
  textos,
}: {
  municipios: FilaMunicipio[];
  textos: { titulo: string; menos: string; mas: string; suprimido: string };
}) {
  const W = 420;
  const H = 400;
  const lats = municipios.map((m) => m.latCentro);
  const lons = municipios.map((m) => m.lonCentro);
  const [minLat, maxLat, minLon, maxLon] = [Math.min(...lats), Math.max(...lats), Math.min(...lons), Math.max(...lons)];
  const padLat = Math.max((maxLat - minLat) * 0.3, 0.2);
  const padLon = Math.max((maxLon - minLon) * 0.3, 0.2);
  const x = (lon: number) => ((lon - (minLon - padLon)) / (maxLon - minLon + 2 * padLon)) * W;
  const y = (lat: number) => H - ((lat - (minLat - padLat)) / (maxLat - minLat + 2 * padLat)) * H;
  const max = Math.max(1, ...municipios.map((m) => m.conVisita ?? 0));

  return (
    <div className="flex flex-col gap-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-xl bg-[#eaf1ec]" role="img" aria-label={textos.titulo}>
        <defs>
          {municipios.map((m, i) => {
            const c = colorCalor((m.conVisita ?? 0) / max);
            return (
              <radialGradient key={m.codigo} id={`calor-${i}`}>
                <stop offset="0%" stopColor={c} stopOpacity="0.85" />
                <stop offset="60%" stopColor={c} stopOpacity="0.35" />
                <stop offset="100%" stopColor={c} stopOpacity="0" />
              </radialGradient>
            );
          })}
          <pattern id="puntos" width="14" height="14" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#c9d8cf" />
          </pattern>
        </defs>
        {/* Territorio esquemático (decorativo, no es un límite real). */}
        <path d={TERRITORIO} fill="#fffdf9" stroke="#9fb5a8" strokeWidth="1.5" />
        <path d={TERRITORIO} fill="url(#puntos)" />
        <path d="M30 210 C110 190 150 250 220 230 S330 160 400 190" fill="none" stroke="#8cc3d6" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
        <path d="M150 40 C170 110 140 160 190 220" fill="none" stroke="#8cc3d6" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />

        {municipios.map((m, i) =>
          !m.suprimido && (m.conVisita ?? 0) > 0 ? (
            <circle
              key={`h-${m.codigo}`}
              cx={x(m.lonCentro)}
              cy={y(m.latCentro)}
              r={28 + 52 * Math.sqrt((m.conVisita ?? 0) / max)}
              fill={`url(#calor-${i})`}
            />
          ) : null,
        )}
        {municipios.map((m) => {
          const cx = x(m.lonCentro);
          const cy = y(m.latCentro);
          return (
            <g key={m.codigo}>
              {m.suprimido ? (
                <circle cx={cx} cy={cy} r="9" fill="#ffffff" stroke="#9aa3a0" strokeWidth="2" strokeDasharray="3 3" />
              ) : (
                <circle cx={cx} cy={cy} r="6.5" fill="#1f2a2e" stroke="#ffffff" strokeWidth="2.5" />
              )}
              <text x={cx} y={cy + 24} textAnchor="middle" fontSize="13" fontWeight="700" fill="#1f2a2e" paintOrder="stroke" stroke="#fffdf9" strokeWidth="4">
                {m.nombre.replace(/\s*\(prueba\)/, "")}
              </text>
              {m.suprimido && (
                <text x={cx} y={cy + 39} textAnchor="middle" fontSize="11" fill="#5b6669" paintOrder="stroke" stroke="#fffdf9" strokeWidth="4">
                  {textos.suprimido}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        {textos.menos}
        <span className="h-2.5 w-40 rounded-full" style={{ background: `linear-gradient(90deg, ${ESCALA.join(",")})` }} />
        {textos.mas}
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
