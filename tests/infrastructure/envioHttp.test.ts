import { afterEach, describe, expect, it, vi } from "vitest";
import type { Evaluacion } from "@/domain/evaluacion/Evaluacion";
import { ClienteEnvioHttp } from "@/infrastructure/http/ClienteEnvioHttp";

afterEach(() => vi.unstubAllGlobals());

describe("ClienteEnvioHttp", () => {
  it("no envía las actividades (se quedan en el celular)", async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify({ aceptadas: [], duplicadas: [], rechazadas: [] })));
    vi.stubGlobal("fetch", fetch);
    const ev = {
      id: "x",
      origen: "AUTO",
      creadaEn: "2026-11-26T10:00:00Z",
      versionPack: "1",
      respuestas: {},
      resultado: { puntaje: 0, nivel: "VERDE", urgente: false },
      actividades: { memoria: { correctas: 1, total: 3, maxLongitud: 3 }, reaccion: null, alternancia: null, espiral: null },
    } as unknown as Evaluacion;
    await new ClienteEnvioHttp("/lote").enviarLote([ev]);
    const cuerpo = JSON.parse((fetch.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(cuerpo.evaluaciones[0]).not.toHaveProperty("actividades");
    expect(JSON.stringify(cuerpo)).not.toContain("memoria");
  });
});
