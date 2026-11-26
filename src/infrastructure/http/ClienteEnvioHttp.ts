import type { ClienteEnvio, RespuestaLote } from "@/application/ports/ClienteEnvio";
import type { Evaluacion } from "@/domain/evaluacion/Evaluacion";

/** POST /api/v1/evaluaciones/lote. Sin cookies ni identificadores. */
export class ClienteEnvioHttp implements ClienteEnvio {
  constructor(private readonly url = "/api/v1/evaluaciones/lote") {}

  async enviarLote(evaluaciones: Evaluacion[]): Promise<RespuestaLote> {
    const r = await fetch(this.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "omit",
      body: JSON.stringify({
        evaluaciones: evaluaciones.map((e) => ({
          id: e.id,
          origen: e.origen,
          creadaEn: e.creadaEn,
          versionPack: e.versionPack,
          respuestas: e.respuestas,
          // El servidor recalcula; esto es para marcar discrepancias.
          resultadoCliente: { puntaje: e.resultado.puntaje, nivel: e.resultado.nivel, urgente: e.resultado.urgente },
        })),
      }),
    });
    if (!r.ok) throw new Error(`Lote rechazado: ${r.status}`);
    return (await r.json()) as RespuestaLote;
  }
}
