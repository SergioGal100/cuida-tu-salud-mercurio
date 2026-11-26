import type { ResultadoEvaluacion } from "@/domain/scoring";
import type { Respuestas } from "@/domain/scoring";
import type { FichaDto, LaboratorioDto } from "@/presentation/schemas/postaSchemas";

/** Cliente HTTP de la API de posta (usa la cookie de sesión de Auth.js). */
async function pedir<T>(url: string, metodo: string, cuerpo: unknown): Promise<T> {
  const r = await fetch(url, {
    method: metodo,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
  if (!r.ok) throw new Error(`${metodo} ${url}: ${r.status}`);
  return (await r.json()) as T;
}

export const apiPosta = {
  crearConsulta: (respuestas: Respuestas) => pedir<{ id: string }>("/api/v1/consultas", "POST", { respuestas }),
  guardarFicha: (id: string, ficha: FichaDto) => pedir<{ ok: true }>(`/api/v1/consultas/${id}`, "PUT", ficha),
  cargarLaboratorio: (id: string, lab: LaboratorioDto) =>
    pedir<ResultadoEvaluacion>(`/api/v1/consultas/${id}/laboratorio`, "POST", lab),
};
