// Genera src/presentation/components/vigilancia/boliviaGeo.ts a partir de los límites
// departamentales de geoBoundaries (BOL ADM1, dominio público, fuente GeoBolivia).
// Uso:
//   curl -sL <simplifiedGeometryGeoJSON de https://www.geoboundaries.org/api/current/gbOpen/BOL/ADM1/> -o adm1.geojson
//   node scripts/generar-mapa-bolivia.mjs adm1.geojson
import { readFileSync, writeFileSync } from "node:fs";

const entrada = process.argv[2];
if (!entrada) throw new Error("Falta la ruta del GeoJSON");
const geo = JSON.parse(readFileSync(entrada, "utf8"));

// Proyección equirectangular corregida por la latitud media del país.
const LON0 = -69.75, LAT0 = -9.55, LAT_MEDIA = -16.3, K = 40, PAD = 8;
const C = Math.cos((LAT_MEDIA * Math.PI) / 180);
const px = ([lon, lat]) => [PAD + (lon - LON0) * K * C, PAD + (LAT0 - lat) * K];

const TOL = 0.9; // en px del viewBox
function dp(pts, tol) {
  if (pts.length < 3) return pts;
  const [a, b] = [pts[0], pts[pts.length - 1]];
  let max = 0, idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i];
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const d = Math.abs(dy * x - dx * y + b[0] * a[1] - b[1] * a[0]) / len;
    if (d > max) { max = d; idx = i; }
  }
  if (max <= tol) return [a, b];
  return [...dp(pts.slice(0, idx + 1), tol).slice(0, -1), ...dp(pts.slice(idx), tol)];
}

const area = (r) => r.reduce((s, p, i) => { const q = r[(i + 1) % r.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
function centroide(r) {
  const A = area(r);
  let cx = 0, cy = 0;
  r.forEach((p, i) => { const q = r[(i + 1) % r.length]; const f = p[0] * q[1] - q[0] * p[1]; cx += (p[0] + q[0]) * f; cy += (p[1] + q[1]) * f; });
  return [cx / (6 * A), cy / (6 * A)];
}

let maxX = 0, maxY = 0;
const departamentos = geo.features.map((f) => {
  const g = f.geometry;
  const polis = g.type === "MultiPolygon" ? g.coordinates : [g.coordinates];
  let mayor = null;
  const partes = [];
  for (const poli of polis) {
    for (const anillo of poli) {
      // Anillo cerrado: se parte en el punto más lejano al inicio y se simplifica cada mitad.
      const pts = anillo.map(px);
      let lejos = 1;
      pts.forEach((p, i) => { if (Math.hypot(p[0] - pts[0][0], p[1] - pts[0][1]) > Math.hypot(pts[lejos][0] - pts[0][0], pts[lejos][1] - pts[0][1])) lejos = i; });
      const r = [...dp(pts.slice(0, lejos + 1), TOL).slice(0, -1), ...dp(pts.slice(lejos), TOL)];
      if (r.length < 4 || Math.abs(area(r)) < 6) continue; // descarta islotes mínimos
      for (const [x, y] of r) { maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
      if (!mayor || Math.abs(area(r)) > Math.abs(area(mayor))) mayor = r;
      partes.push("M" + r.slice(0, -1).map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L") + "Z");
    }
  }
  const [cx, cy] = centroide(mayor);
  return { nombre: f.properties.shapeName, d: partes.join(""), cx: +cx.toFixed(1), cy: +cy.toFixed(1) };
});

const salida = `// GENERADO por scripts/generar-mapa-bolivia.mjs: no editar a mano.
// Límites departamentales de Bolivia: geoBoundaries (BOL ADM1, GeoBolivia), dominio público.
// Simplificados para dibujar; no sirven como límites oficiales.

export const MAPA_ANCHO = ${Math.ceil(maxX + PAD)};
export const MAPA_ALTO = ${Math.ceil(maxY + PAD)};

const LON0 = ${LON0}, LAT0 = ${LAT0}, K = ${K}, PAD = ${PAD}, C = ${C.toFixed(6)};

/** Lon/lat → coordenadas del viewBox (misma proyección que los departamentos). */
export function proyectar(lon: number, lat: number): [number, number] {
  return [PAD + (lon - LON0) * K * C, PAD + (LAT0 - lat) * K];
}

export const DEPARTAMENTOS: { nombre: string; d: string; cx: number; cy: number }[] = ${JSON.stringify(departamentos, null, 1)};
`;
writeFileSync(new URL("../src/presentation/components/vigilancia/boliviaGeo.ts", import.meta.url), salida);
console.log(`ok: ${departamentos.length} departamentos, ${Math.round(salida.length / 1024)} KB, ${Math.ceil(maxX + PAD)}x${Math.ceil(maxY + PAD)}`);
