import { describe, expect, it } from "vitest";
import { RealizarTest } from "@/application/use-cases/cliente/RealizarTest";
import { VerHistorial } from "@/application/use-cases/cliente/VerHistorial";
import { contentPack as pack } from "@/infrastructure/content/contenido";
import { BandejaEnMemoria, HistorialEnMemoria } from "@/infrastructure/memoria/EnMemoria";

function armar(fechas: string[]) {
  const bandeja = new BandejaEnMemoria();
  const historial = new HistorialEnMemoria();
  let n = 0;
  let t = 0;
  const uc = new RealizarTest({
    pack,
    reloj: { ahora: () => new Date(fechas[Math.min(t++, fechas.length - 1)]) },
    generadorId: { nuevo: () => `id-${++n}` },
    bandeja,
    historial,
  });
  return { uc, bandeja, historial };
}

describe("RealizarTest", () => {
  it("guarda en bandeja e historial, con id, fecha, versión y sin datos personales", async () => {
    const { uc, bandeja, historial } = armar(["2026-11-26T10:00:00Z"]);
    const ev = await uc.ejecutar({ contexto: { quienResponde: "yo" }, quema: "quema_cerrada_sin_retorta" });
    expect(ev).toMatchObject({ id: "id-1", origen: "AUTO", creadaEn: "2026-11-26T10:00:00.000Z", versionPack: pack.version });
    expect(ev.resultado.nivel).toBe("AMARILLO");
    expect(await bandeja.contarPendientes()).toBe(1);
    expect(await historial.listar()).toHaveLength(1);
    expect(Object.keys(ev).sort()).toEqual(["creadaEn", "id", "origen", "respuestas", "resultado", "versionPack"]);
  });

  it("modo promotor: se envía pero no queda en el historial", async () => {
    const { uc, bandeja, historial } = armar(["2026-11-26T10:00:00Z"]);
    const ev = await uc.ejecutar({ contexto: { quienResponde: "promotor" } });
    expect(ev.origen).toBe("PROMOTOR");
    expect(await bandeja.contarPendientes()).toBe(1);
    expect(await historial.listar()).toHaveLength(0);
  });
});

describe("VerHistorial", () => {
  it("lista lo más reciente primero y marca los síntomas nuevos", async () => {
    const { uc, historial } = armar(["2026-10-01T10:00:00Z", "2026-11-26T10:00:00Z"]);
    await uc.ejecutar({ sintomas: { temblor: "si" } });
    await uc.ejecutar({ sintomas: { temblor: "si", hormigueo: "si" } });
    const lista = await new VerHistorial(historial).ejecutar();
    expect(lista.map((e) => e.evaluacion.id)).toEqual(["id-2", "id-1"]);
    expect(lista[0].sintomasNuevos).toEqual(["hormigueo"]);
    expect(lista[1].sintomasNuevos).toEqual(["temblor"]);
  });
});
