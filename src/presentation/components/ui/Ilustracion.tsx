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
