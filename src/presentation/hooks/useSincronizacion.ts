"use client";

import { useCallback, useEffect, useState } from "react";
import type { ResultadoSincronizacion } from "@/application/use-cases/cliente/SincronizarPendientes";

const CADA_MS = 2 * 60 * 1000;

/**
 * Envía la bandeja de salida al abrir, al volver la señal (evento "online")
 * y cada 2 minutos. No usa Background Sync porque iPhone no lo soporta.
 */
export function useSincronizacion(sincronizar: () => Promise<ResultadoSincronizacion>) {
  const [estado, setEstado] = useState<ResultadoSincronizacion | null>(null);

  const ahora = useCallback(async () => {
    try {
      setEstado(await sincronizar());
    } catch {
      // La bandeja sigue pendiente; se reintenta en el próximo ciclo.
    }
  }, [sincronizar]);

  useEffect(() => {
    void ahora();
    const alVolver = () => void ahora();
    window.addEventListener("online", alVolver);
    const t = window.setInterval(() => navigator.onLine && void ahora(), CADA_MS);
    return () => {
      window.removeEventListener("online", alVolver);
      window.clearInterval(t);
    };
  }, [ahora]);

  return { estado, sincronizarAhora: ahora };
}
