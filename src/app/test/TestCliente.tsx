"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { casosDeUsoCliente } from "@/composition/client";
import { contentPack, municipios } from "@/composition/contenido";
import { FlujoTest } from "@/presentation/components/test/FlujoTest";
import { MisResultados } from "@/presentation/components/test/MisResultados";
import { useSincronizacion } from "@/presentation/hooks/useSincronizacion";

type Vista = "test" | "historial";

/** Une los casos de uso (composition) con la interfaz (presentation). */
export function TestCliente() {
  const router = useRouter();
  // Se usa #historial (no ?vista=) para que la ruta precacheada sirva sin internet.
  const [vista, setVista] = useState<Vista>("test");
  const [intento, setIntento] = useState(0);
  const [pendientes, setPendientes] = useState<number | null>(null);

  const sincronizar = useCallback(() => casosDeUsoCliente().sincronizar.ejecutar(), []);
  const { estado, sincronizarAhora } = useSincronizacion(sincronizar);
  const cargarHistorial = useCallback(() => casosDeUsoCliente().verHistorial.ejecutar(), []);

  useEffect(() => {
    const leer = () => setVista(window.location.hash === "#historial" ? "historial" : "test");
    leer();
    window.addEventListener("hashchange", leer);
    return () => window.removeEventListener("hashchange", leer);
  }, []);

  useEffect(() => {
    if (estado) setPendientes(estado.pendientes);
  }, [estado]);

  const ir = (v: Vista) => {
    window.location.hash = v === "historial" ? "historial" : "";
    setVista(v);
    window.scrollTo(0, 0);
  };

  if (vista === "historial") {
    return (
      <MisResultados
        pack={contentPack}
        cargar={cargarHistorial}
        pendientes={pendientes}
        onNuevoTest={() => {
          setIntento((n) => n + 1);
          ir("test");
        }}
        onSalir={() => router.push("/")}
      />
    );
  }

  return (
    <FlujoTest
      key={intento}
      pack={contentPack}
      municipios={municipios}
      realizarTest={async (r) => {
        const evaluacion = await casosDeUsoCliente().realizarTest.ejecutar(r);
        void sincronizarAhora(); // si hay señal, se va de inmediato
        return evaluacion;
      }}
      onSalir={() => router.push("/")}
      onVerHistorial={() => ir("historial")}
    />
  );
}
