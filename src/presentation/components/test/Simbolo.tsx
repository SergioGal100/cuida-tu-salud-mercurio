import type { ReactNode } from "react";

/**
 * Pictogramas propios del test (trazo simple, se leen a 64 px y en pantallas
 * gastadas). Los ids coinciden con el campo "icono" de content_pack.json.
 */
const TRAZO = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 3,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const SIMBOLOS: Record<string, ReactNode> = {
  // Mano con líneas de temblor
  "sym-tremor": (
    <>
      <path d="M24 54V30a3 3 0 0 1 6 0v-4a3 3 0 0 1 6 0v2a3 3 0 0 1 6 0v4a3 3 0 0 1 6 0v12c0 6-4 10-10 10h-6c-4 0-8-2-8-4z" />
      <path d="M24 38l-4-4a3 3 0 0 0-5 3l9 13" />
      <path d="M10 18l-4 4M12 10l-6 2M54 16l4 4M52 8l6 2" />
    </>
  ),
  // Pie con chispas de hormigueo
  "sym-tingling": (
    <>
      <path d="M22 12c-4 8-6 18-4 28 1 8 6 14 14 14 7 0 10-4 9-9-1-6-7-8-8-14-1-7 2-12 0-17-2-4-8-6-11-2z" />
      <path d="M46 14l2 4 4 2-4 2-2 4-2-4-4-2 4-2zM52 34l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" />
    </>
  ),
  // Persona sobre una línea, brazos abiertos
  "sym-balance": (
    <>
      <circle cx="32" cy="12" r="5" />
      <path d="M32 18v18M14 26l18-4 18 4M32 36l-8 14M32 36l8 14M8 56h48" />
      <path d="M14 26l-3 4M50 26l3 4" />
    </>
  ),
  // Cabeza con nube de pensamientos
  "sym-memory": (
    <>
      <path d="M38 56V46h4a6 6 0 0 0 6-6v-6l4-2-4-8C46 14 38 8 28 8 17 8 10 17 10 28c0 7 3 12 8 16v12" />
      <path d="M22 24c2-4 9-4 11 0s-3 6-5 8M28 38v1" />
    </>
  ),
  // Boca con gota de sabor metálico
  "sym-mouth": (
    <>
      <path d="M8 30c8-6 16-6 24-2 8-4 16-4 24 2-6 12-14 16-24 16S14 42 8 30z" />
      <path d="M8 30c10 4 38 4 48 0" />
      <path d="M44 10c-3 4-5 7-5 9a5 5 0 0 0 10 0c0-2-2-5-5-9z" />
    </>
  ),
  // Batería baja (cansancio)
  "sym-fatigue": (
    <>
      <rect x="8" y="20" width="42" height="24" rx="4" />
      <path d="M50 28h4v8h-4" />
      <path d="M14 26v12" strokeWidth={6} />
      <path d="M22 54l4-6M34 54l-2-6" />
    </>
  ),
  // Recipiente sobre fuego con vapor
  "work-art-burn": (
    <>
      <path d="M12 30h40l-4 12H16z" />
      <path d="M24 56c-4-3-4-7 0-10 0 3 2 4 3 4 0-4 3-6 5-8 0 4 4 6 4 10s-3 5-6 5" />
      <path d="M22 22c-3-3 3-5 0-9M32 22c-3-3 3-5 0-9M42 22c-3-3 3-5 0-9" />
    </>
  ),
  // Mano con gotas de mercurio
  "work-art-mercury": (
    <>
      <path d="M10 44c6 0 12-2 16-6h12a4 4 0 0 1 0 8H28M10 56c8 0 14-2 22-2h10c4 0 8-2 12-6l2-4a3 3 0 0 0-5-3l-8 7" />
      <circle cx="30" cy="16" r="5" />
      <circle cx="44" cy="22" r="3.5" />
      <circle cx="20" cy="26" r="3" />
    </>
  ),
  // Calendario con reloj de arena
  "work-art-years": (
    <>
      <rect x="8" y="12" width="48" height="42" rx="4" />
      <path d="M8 24h48M20 8v8M44 8v8" />
      <path d="M24 32h16M24 48h16M26 32c0 6 12 6 12 16M38 32c0 6-12 6-12 16" />
    </>
  ),
  // Pez sobre olas de río
  "work-art-fish": (
    <>
      <path d="M8 28c8-10 26-12 36 0-10 12-28 10-36 0z" />
      <path d="M44 28l12-8v16z" />
      <circle cx="18" cy="26" r="1.5" fill="currentColor" />
      <path d="M6 46c5-4 9-4 13 0s9 4 13 0 9-4 13 0 9 4 13 0M6 56c5-4 9-4 13 0s9 4 13 0 9-4 13 0 9 4 13 0" />
    </>
  ),
};

/**
 * Dos tonos: el mismo dibujo relleno en verde suave y corrido 2 px detrás del
 * trazo (estilo serigrafía). Así el pictograma gana volumen sin otro archivo.
 */
export function Simbolo({ id, className, titulo }: { id: string | null; className?: string; titulo?: string }) {
  const contenido = id ? SIMBOLOS[id] : undefined;
  if (!contenido) return null;
  return (
    <svg viewBox="0 0 64 64" className={className} role={titulo ? "img" : undefined} aria-hidden={titulo ? undefined : true}>
      {titulo && <title>{titulo}</title>}
      <g fill="#bfe0d8" stroke="none" transform="translate(2 2)" opacity="0.9">
        {contenido}
      </g>
      <g {...TRAZO}>{contenido}</g>
    </svg>
  );
}
