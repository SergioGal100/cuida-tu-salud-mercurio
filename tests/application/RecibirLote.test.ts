import { describe, expect, it } from "vitest";
import type { EvaluacionRepository } from "@/application/ports/EvaluacionRepository";
import { RecibirLote } from "@/application/use-cases/servidor/RecibirLote";
import type { EvaluacionEntrante, EvaluacionRecibida } from "@/domain/evaluacion/EvaluacionRecibida";
import { contentPack as pack } from "@/infrastructure/content/contenido";

class RepoEnMemoria implements EvaluacionRepository {
  filas = new Map<string, EvaluacionRecibida>();
  async idsExistentes(ids: string[]) {
    return new Set(ids.filter((id) => this.filas.has(id)));
  }
  async guardarVarias(evs: EvaluacionRecibida[]) {
    const nuevos = evs.filter((e) => !this.filas.has(e.id));
    nuevos.forEach((e) => this.filas.set(e.id, e));
    return nuevos.map((e) => e.id);
  }
}

const ent = (id: string, extra: Partial<EvaluacionEntrante> = {}): EvaluacionEntrante => ({
  id, origen: "AUTO", creadaEn: "2026-11-26T10:00:00Z", versionPack: pack.version,
  respuestas: { contexto: { municipio: "DEMO-01" }, quema: "quema_cerrada_sin_retorta" }, ...extra,
});

const armar = () => {
  const repo = new RepoEnMemoria();
  return { repo, uc: new RecibirLote({ pack, municipiosValidos: new Set(["DEMO-01"]), repo }) };
};

describe("RecibirLote", () => {
  it("guarda con el cálculo del servidor y el municipio", async () => {
    const { repo, uc } = armar();
    expect(await uc.ejecutar([ent("a")])).toEqual({ aceptados: ["a"], repetidos: [] });
    expect(repo.filas.get("a")).toMatchObject({ municipioCodigo: "DEMO-01", discrepancia: false, resultado: { nivel: "AMARILLO", puntaje: 25 } });
  });

  it("es idempotente: reenviar el mismo id lo da como repetido", async () => {
    const { repo, uc } = armar();
    await uc.ejecutar([ent("a")]);
    expect(await uc.ejecutar([ent("a"), ent("b"), ent("b")])).toEqual({ aceptados: ["b"], repetidos: ["a"] });
    expect(repo.filas.size).toBe(2);
  });

  it("marca discrepancia si el celular calculó otra cosa", async () => {
    const { repo, uc } = armar();
    await uc.ejecutar([ent("a", { resultadoCliente: { puntaje: 0, nivel: "VERDE", urgente: false } })]);
    expect(repo.filas.get("a")?.discrepancia).toBe(true);
  });

  it("municipio desconocido o 'prefiero no decir' queda nulo", async () => {
    const { repo, uc } = armar();
    await uc.ejecutar([
      ent("x", { respuestas: { contexto: { municipio: "INVENTADO" } } }),
      ent("y", { respuestas: { contexto: { municipio: "prefiero_no_decir" } } }),
    ]);
    expect(repo.filas.get("x")?.municipioCodigo).toBeNull();
    expect(repo.filas.get("y")?.municipioCodigo).toBeNull();
  });

  it("no acepta una alarma aguda sin quema (no se puede inflar urgencias)", async () => {
    const { repo, uc } = armar();
    await uc.ejecutar([ent("a", { respuestas: { quema: "no", alarmaAguda: "si" } })]);
    expect(repo.filas.get("a")?.resultado.urgente).toBe(false);
  });
});
