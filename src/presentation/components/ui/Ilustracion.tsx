import type { ReactNode } from "react";

/**
 * Ilustraciones propias en dos tonos (relleno suave + trazo verde azulado).
 * Son decorativas: siempre aria-hidden; el texto va al lado, desde el pack.
 */
const T = "var(--primary)"; // trazo
const R = "#cfe6e0"; // relleno verde suave
const C = "#f1e2c9"; // relleno tierra suave
const TI = "var(--tierra)";

const trazo = { fill: "none", stroke: T, strokeWidth: 4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const DIBUJOS: Record<string, ReactNode> = {
  // Persona junto al río y los cerros, con un latido.
  hero: (
    <>
      <circle cx="80" cy="80" r="74" fill="#ffffff" opacity="0.7" />
      <path d="M10 112l30-38 22 24 26-40 30 36 32-22v58H10z" fill={C} />
      <path d="M10 112l30-38 22 24 26-40 30 36 32-22" {...trazo} stroke={TI} strokeWidth={3} />
      <path d="M6 132c12-7 22-7 34 0s22 7 34 0 22-7 34 0 22 7 34 0 14-5 18-2" {...trazo} strokeWidth={3} />
      <path d="M16 146c12-6 20-6 32 0s20 6 32 0 20-6 32 0 18 5 30 0" {...trazo} strokeWidth={3} opacity="0.6" />
      <circle cx="80" cy="48" r="13" fill={R} {...{ stroke: T, strokeWidth: 4 }} />
      <path d="M58 116c0-22 10-38 22-38s22 16 22 38" fill={R} stroke={T} strokeWidth={4} strokeLinejoin="round" />
      <path d="M104 40h10l5-10 7 20 5-10h10" {...trazo} strokeWidth={3.5} />
      <path d="M70 96c4 4 16 4 20 0" {...trazo} strokeWidth={3} />
    </>
  ),
  // Minero con casco y chaleco, cerros y casitas detrás (portada).
  minero: (
    <>
      <circle cx="80" cy="74" r="70" fill="#f6e3c3" />
      <path d="M8 96l26-24 18 14 24-30 22 22 20-16 34 34v24H8z" fill="#cfe3c8" />
      <path d="M14 100h18v-12l9-7 9 7v12h10v-8l7-5 7 5v8" fill="#fffdf9" stroke={TI} strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M44 160c0-24 16-38 36-38s36 14 36 38z" fill="#e0853a" stroke="#9a4f17" strokeWidth={3} strokeLinejoin="round" />
      <path d="M56 160v-30M104 160v-30" stroke="#f6f1e7" strokeWidth={5} />
      <path d="M68 126l12 12 12-12" fill="none" stroke="#9a4f17" strokeWidth={3} strokeLinejoin="round" />
      <path d="M68 92c0 14 5 26 12 26s12-12 12-26" fill="#b9825a" />
      <ellipse cx="80" cy="86" rx="17" ry="20" fill="#c68a5e" stroke="#8a5a3a" strokeWidth={2.5} />
      <path d="M73 84h1M86 84h1" stroke="#3a2a20" strokeWidth={4} strokeLinecap="round" />
      <path d="M75 96c3 2 7 2 10 0" fill="none" stroke="#8a5a3a" strokeWidth={2.5} strokeLinecap="round" />
      <path d="M58 76c0-16 10-26 22-26s22 10 22 26z" fill="#f2b705" stroke="#a37400" strokeWidth={3} strokeLinejoin="round" />
      <path d="M52 77h56" stroke="#a37400" strokeWidth={5} strokeLinecap="round" />
      <path d="M80 50v26" stroke="#a37400" strokeWidth={3} />
      <circle cx="80" cy="62" r="5" fill="#fff7d1" stroke="#a37400" strokeWidth={2} />
    </>
  ),
  // Familia junto al río con casita (comunidad).
  comunidad: (
    <>
      <circle cx="80" cy="80" r="70" fill="#e7f1ee" />
      <path d="M92 66l22-18 22 18v34H92z" fill="#fffdf9" stroke={T} strokeWidth={3.5} strokeLinejoin="round" />
      <path d="M86 70l28-24 28 24" fill="none" stroke={TI} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
      <rect x="107" y="80" width="13" height="20" rx="2" fill={R} stroke={T} strokeWidth={3} />
      <circle cx="46" cy="62" r="11" fill="#c68a5e" stroke="#8a5a3a" strokeWidth={2.5} />
      <path d="M28 104c0-18 8-28 18-28s18 10 18 28z" fill={R} stroke={T} strokeWidth={3} strokeLinejoin="round" />
      <circle cx="72" cy="80" r="8" fill="#c68a5e" stroke="#8a5a3a" strokeWidth={2.5} />
      <path d="M60 104c0-12 5-18 12-18s12 6 12 18z" fill={C} stroke={TI} strokeWidth={3} strokeLinejoin="round" />
      <path d="M14 118c12-7 22-7 34 0s22 7 34 0 22-7 34 0 18 6 30 0" fill="none" stroke="#5aa9c2" strokeWidth={4} strokeLinecap="round" />
      <path d="M24 134c12-6 20-6 32 0s20 6 32 0 20-6 32 0" fill="none" stroke="#5aa9c2" strokeWidth={3} strokeLinecap="round" opacity="0.6" />
    </>
  ),
  // Pin sobre un mapa plegado (municipio).
  ubicacion: (
    <>
      <path d="M20 48l38-14 44 14 38-14v86l-38 14-44-14-38 14z" fill={C} stroke={TI} strokeWidth={3.5} strokeLinejoin="round" />
      <path d="M58 34v86M102 48v86" stroke={TI} strokeWidth={3} opacity="0.6" />
      <path d="M30 92c20-10 30 8 52-4s34-6 48 2" fill="none" stroke="#5aa9c2" strokeWidth={3.5} strokeLinecap="round" />
      <path d="M80 112s-26-26-26-46a26 26 0 0 1 52 0c0 20-26 46-26 46z" fill={R} stroke={T} strokeWidth={4} strokeLinejoin="round" />
      <circle cx="80" cy="66" r="9" fill="#ffffff" stroke={T} strokeWidth={4} />
    </>
  ),
  // Dos personas: "¿quién responde?".
  personas: (
    <>
      <circle cx="80" cy="80" r="70" fill="#e7f1ee" />
      <circle cx="60" cy="58" r="15" fill="#c68a5e" stroke="#8a5a3a" strokeWidth={3} />
      <path d="M32 122c0-26 12-40 28-40s28 14 28 40z" fill={R} stroke={T} strokeWidth={3.5} strokeLinejoin="round" />
      <circle cx="104" cy="66" r="12" fill="#b9825a" stroke="#8a5a3a" strokeWidth={3} />
      <path d="M82 122c0-20 10-32 22-32s22 12 22 32z" fill={C} stroke={TI} strokeWidth={3.5} strokeLinejoin="round" />
      <path d="M112 40h22a6 6 0 0 1 6 6v10a6 6 0 0 1-6 6h-10l-8 7v-7h-4a6 6 0 0 1-6-6V46a6 6 0 0 1 6-6z" fill="#ffffff" stroke={T} strokeWidth={3} strokeLinejoin="round" />
    </>
  ),
  // Madre con bebé: embarazo o lactancia.
  familia: (
    <>
      <circle cx="80" cy="80" r="70" fill="#fdeeeb" />
      <circle cx="74" cy="48" r="15" fill="#c68a5e" stroke="#8a5a3a" strokeWidth={3} />
      <path d="M44 132c0-36 14-60 30-60s30 24 30 60z" fill={C} stroke={TI} strokeWidth={3.5} strokeLinejoin="round" />
      <ellipse cx="92" cy="98" rx="20" ry="13" fill="#ffffff" stroke={T} strokeWidth={3} />
      <circle cx="102" cy="94" r="8" fill="#d9a07a" stroke="#8a5a3a" strokeWidth={2.5} />
      <path d="M116 46c-3-6 4-10 7-4 3-6 10-2 7 4l-7 7z" fill="var(--nivel-rojo)" />
    </>
  ),
  // Niño con pelota.
  nino: (
    <>
      <circle cx="80" cy="80" r="70" fill="#fff1c7" />
      <circle cx="70" cy="58" r="14" fill="#c68a5e" stroke="#8a5a3a" strokeWidth={3} />
      <path d="M48 124c0-26 10-40 22-40s22 14 22 40z" fill={R} stroke={T} strokeWidth={3.5} strokeLinejoin="round" />
      <circle cx="112" cy="110" r="14" fill="#ffffff" stroke={TI} strokeWidth={3} />
      <path d="M100 104c8 4 16 4 24 0M112 96v28" stroke={TI} strokeWidth={2.5} fill="none" />
    </>
  ),
  "act-memoria": (
    <>
      {[0, 1, 2].flatMap((f) =>
        [0, 1, 2].map((c) => (
          <rect
            key={`${f}-${c}`}
            x={30 + c * 36}
            y={30 + f * 36}
            width="28"
            height="28"
            rx="7"
            fill={(f === 0 && c === 1) || (f === 1 && c === 1) || (f === 2 && c === 2) || (f === 0 && c === 2) ? T : R}
          />
        )),
      )}
    </>
  ),
  "act-reaccion": (
    <>
      <circle cx="80" cy="80" r="56" fill={R} />
      <circle cx="80" cy="80" r="38" fill={T} />
      <path d="M86 52l-20 32h16l-6 26 22-34H82z" fill="#ffffff" />
    </>
  ),
  "act-alternancia": (
    <>
      <circle cx="52" cy="80" r="32" fill={T} />
      <circle cx="108" cy="80" r="32" fill={R} />
      <text x="52" y="92" textAnchor="middle" fontSize="34" fontWeight="700" fill="#ffffff">A</text>
      <text x="108" y="92" textAnchor="middle" fontSize="34" fontWeight="700" fill={T}>B</text>
    </>
  ),
  "act-espiral": (
    <>
      <circle cx="80" cy="80" r="62" fill={R} />
      <path
        d="M80 80c4 0 6 4 4 8-3 6-12 6-16 0-6-8 0-20 12-20 16 0 24 16 18 30-8 18-34 20-46 4-14-20 0-48 26-48 30 0 44 30 34 54"
        fill="none"
        stroke={T}
        strokeWidth={5}
        strokeLinecap="round"
      />
    </>
  ),
  // Escudo con un corazón: "es para cuidarte".
  escudo: (
    <>
      <path d="M80 18l48 16v34c0 32-20 56-48 70-28-14-48-38-48-70V34z" fill={R} {...{ stroke: T, strokeWidth: 4, strokeLinejoin: "round" }} />
      <path d="M80 104s-26-15-26-32c0-9 7-15 14-15 6 0 10 4 12 8 2-4 6-8 12-8 7 0 14 6 14 15 0 17-26 32-26 32z" fill="#ffffff" {...{ stroke: T, strokeWidth: 4, strokeLinejoin: "round" }} />
    </>
  ),
  // Tarjeta de identidad tachada: "sin nombre ni carnet".
  "sin-documento": (
    <>
      <rect x="22" y="44" width="116" height="76" rx="12" fill={C} stroke={TI} strokeWidth={4} />
      <circle cx="56" cy="76" r="12" fill="#ffffff" stroke={TI} strokeWidth={4} />
      <path d="M38 106c4-10 12-14 18-14s14 4 18 14M88 70h34M88 84h26M88 98h30" {...trazo} stroke={TI} strokeWidth={4} />
      <circle cx="120" cy="40" r="22" fill="#ffffff" stroke={T} strokeWidth={4} />
      <path d="M106 26l28 28" {...trazo} strokeWidth={5} />
    </>
  ),
  // Celular con señal y nube: "se envía cuando hay señal".
  senal: (
    <>
      <rect x="46" y="34" width="56" height="104" rx="12" fill={R} stroke={T} strokeWidth={4} />
      <rect x="56" y="50" width="36" height="58" rx="4" fill="#ffffff" />
      <circle cx="74" cy="122" r="4" fill={T} />
      <path d="M108 52c8 6 12 14 12 22s-4 16-12 22M118 40c12 9 18 21 18 34s-6 25-18 34" {...trazo} />
      <path d="M64 86l8 8 14-18" {...trazo} />
    </>
  ),
  "nivel-VERDE": (
    <>
      <circle cx="80" cy="80" r="58" fill="#d8efdf" stroke="var(--nivel-verde)" strokeWidth={5} />
      <path d="M54 82l18 18 36-40" {...trazo} stroke="var(--nivel-verde)" strokeWidth={9} />
    </>
  ),
  "nivel-AMARILLO": (
    <>
      <circle cx="80" cy="80" r="58" fill="#ffe9a8" stroke="#b07a00" strokeWidth={5} />
      <path d="M80 48v40" {...trazo} stroke="#8a5a00" strokeWidth={10} />
      <circle cx="80" cy="110" r="6" fill="#8a5a00" />
    </>
  ),
  "nivel-ROJO": (
    <>
      <circle cx="80" cy="80" r="58" fill="#fbd3cd" stroke="var(--nivel-rojo)" strokeWidth={5} />
      <path d="M58 64h44v42a8 8 0 0 1-8 8H66a8 8 0 0 1-8-8z" fill="#ffffff" stroke="var(--nivel-rojo)" strokeWidth={5} />
      <path d="M80 76v26M67 89h26" {...trazo} stroke="var(--nivel-rojo)" strokeWidth={7} />
      <path d="M70 64v-8a10 10 0 0 1 20 0v8" {...trazo} stroke="var(--nivel-rojo)" strokeWidth={5} />
    </>
  ),
  "nivel-URGENTE": (
    <>
      <circle cx="80" cy="80" r="58" fill="#ffffff" opacity="0.18" />
      <path d="M80 30l56 98H24z" fill="#ffffff" stroke="#ffffff" strokeWidth={6} strokeLinejoin="round" />
      <path d="M80 66v30" {...trazo} stroke="var(--nivel-urgente-suave)" strokeWidth={10} />
      <circle cx="80" cy="112" r="6" fill="var(--nivel-urgente-suave)" />
    </>
  ),
  // Cuaderno con una línea de tiempo.
  "historial-vacio": (
    <>
      <rect x="34" y="24" width="92" height="116" rx="12" fill={R} stroke={T} strokeWidth={4} />
      <path d="M58 52v68" {...trazo} strokeDasharray="2 10" />
      <circle cx="58" cy="52" r="7" fill="#ffffff" stroke={T} strokeWidth={4} />
      <path d="M74 52h34M74 84h26M74 116h30" {...trazo} opacity="0.5" />
      <circle cx="58" cy="84" r="7" fill="#ffffff" stroke={T} strokeWidth={4} opacity="0.5" />
      <circle cx="58" cy="116" r="7" fill="#ffffff" stroke={T} strokeWidth={4} opacity="0.5" />
    </>
  ),
  // Nube tachada.
  "sin-conexion": (
    <>
      <path d="M46 112a26 26 0 0 1 2-52 34 34 0 0 1 64 6 22 22 0 0 1 2 46z" fill={R} stroke={T} strokeWidth={4} strokeLinejoin="round" />
      <path d="M40 36l84 92" {...trazo} stroke={TI} strokeWidth={6} />
    </>
  ),
  // Casita de la posta con cruz.
  posta: (
    <>
      <path d="M22 76l58-46 58 46" fill="none" stroke={T} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" />
      <path d="M36 70v66h88V70" fill={R} stroke={T} strokeWidth={4} strokeLinejoin="round" />
      <rect x="66" y="100" width="28" height="36" rx="3" fill="#ffffff" stroke={T} strokeWidth={4} />
      <rect x="62" y="56" width="36" height="36" rx="8" fill="#ffffff" stroke={T} strokeWidth={4} />
      <path d="M80 64v20M70 74h20" {...trazo} stroke="var(--nivel-rojo)" strokeWidth={5} />
    </>
  ),
};

export function Ilustracion({ id, className }: { id: string; className?: string }) {
  const dibujo = DIBUJOS[id];
  if (!dibujo) return null;
  return (
    <svg viewBox="0 0 160 160" className={className} aria-hidden>
      {dibujo}
    </svg>
  );
}
