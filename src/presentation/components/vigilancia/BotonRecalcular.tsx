"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Estado = "listo" | "cargando" | "error" | { abiertas: number };

/** POST /api/v1/vigilancia/alertas y refresca el panel. */
export function BotonRecalcular({
  textos,
}: {
  textos: { recalcular: string; recalculando: string; recalculado: string; error: string };
}) {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>("listo");

  async function recalcular() {
    setEstado("cargando");
    try {
      const r = await fetch("/api/v1/vigilancia/alertas", { method: "POST" });
      if (!r.ok) throw new Error(String(r.status));
      const { abiertas } = (await r.json()) as { abiertas: number };
      setEstado({ abiertas });
      router.refresh();
    } catch {
      setEstado("error");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={recalcular}
        disabled={estado === "cargando"}
        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 font-bold text-primary-foreground shadow-elevada transition-transform active:scale-95 disabled:opacity-60"
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className={estado === "cargando" ? "size-5 animate-spin" : "size-5"}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
        >
          <path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v4h-4" />
        </svg>
        {estado === "cargando" ? textos.recalculando : textos.recalcular}
      </button>
      {typeof estado === "object" && (
        <span role="status" className="text-sm font-bold text-primary">
          {textos.recalculado.replace("{n}", String(estado.abiertas))}
        </span>
      )}
      {estado === "error" && (
        <span role="status" className="text-sm font-bold text-rojo">
          {textos.error}
        </span>
      )}
    </div>
  );
}
