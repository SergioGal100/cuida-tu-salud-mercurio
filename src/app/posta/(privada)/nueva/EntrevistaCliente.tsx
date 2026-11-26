"use client";

import { useRouter } from "next/navigation";
import { contentPack, municipios } from "@/composition/contenido";
import { tx } from "@/presentation/components/posta/comunes";
import { apiPosta } from "@/presentation/components/posta/apiPosta";
import { FlujoTest } from "@/presentation/components/test/FlujoTest";

/** El mismo cuestionario del test, en modo entrevista. */
export function EntrevistaCliente() {
  const router = useRouter();
  const t = contentPack.postaUi;
  return (
    <div className="-mx-4 -my-6">
      <FlujoTest
        pack={contentPack}
        municipios={municipios}
        realizarTest={() => Promise.reject(new Error("no se usa en entrevista"))}
        onSalir={() => router.push("/posta")}
        entrevista={{
          alTerminar: async (respuestas) => {
            const { id } = await apiPosta.crearConsulta(respuestas);
            router.push(`/posta/casos/${id}`);
          },
          textoGuardando: tx(t, "guardandoEntrevista"),
          textoError: tx(t, "errorGuardar"),
          textoReintentar: tx(t, "reintentar"),
        }}
      />
    </div>
  );
}
