"use client";

import { useRouter } from "next/navigation";
import { casosDeUsoCliente } from "@/composition/client";
import { contentPack, municipios } from "@/composition/contenido";
import { FlujoTest } from "@/presentation/components/test/FlujoTest";

export function TestCliente() {
  const router = useRouter();
  return (
    <FlujoTest
      pack={contentPack}
      municipios={municipios}
      realizarTest={(r) => casosDeUsoCliente().realizarTest.ejecutar(r)}
      onSalir={() => router.push("/")}
    />
  );
}
