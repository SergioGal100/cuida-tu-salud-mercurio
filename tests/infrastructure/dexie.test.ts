import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import type { Evaluacion } from "@/domain/evaluacion/Evaluacion";
import { BandejaDexie } from "@/infrastructure/dexie/BandejaDexie";
import { BaseLocal } from "@/infrastructure/dexie/db";
import { HistorialDexie } from "@/infrastructure/dexie/HistorialDexie";

const ev = (id: string, creadaEn: string): Evaluacion => ({
  id, origen: "AUTO", creadaEn, versionPack: "x", respuestas: {}, resultado: {} as Evaluacion["resultado"],
});

describe("Dexie", () => {
  it("bandeja: pendientes en orden, marcar enviadas las saca", async () => {
    const b = new BandejaDexie(new BaseLocal(`t-${Math.random()}`));
    await b.agregar(ev("b", "2026-11-02T00:00:00Z"));
    await b.agregar(ev("a", "2026-11-01T00:00:00Z"));
    expect((await b.pendientes(10)).map((e) => e.id)).toEqual(["a", "b"]);
    await b.marcarEnviadas(["a"]);
    expect(await b.contarPendientes()).toBe(1);
  });

  it("historial: más reciente primero", async () => {
    const h = new HistorialDexie(new BaseLocal(`t-${Math.random()}`));
    await h.guardar(ev("viejo", "2026-10-01T00:00:00Z"));
    await h.guardar(ev("nuevo", "2026-11-26T00:00:00Z"));
    expect((await h.listar()).map((e) => e.id)).toEqual(["nuevo", "viejo"]);
  });
});
