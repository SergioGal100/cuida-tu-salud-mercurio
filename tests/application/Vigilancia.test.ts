import { describe, expect, it } from "vitest";
import { CalcularAlertas, ResumenVigilancia } from "@/application/use-cases/servidor/Vigilancia";
import type { FilaVigilancia } from "@/domain/vigilancia";
import { contentPack as pack } from "@/infrastructure/content/contenido";
import { VigilanciaEnMemoria } from "@/infrastructure/memoria/EnMemoria";

const HOY = new Date("2026-11-26T12:00:00Z");
const reloj = { ahora: () => HOY };
const municipios = [{ codigo: "A", nombre: "Uno", latCentro: -15, lonCentro: -68 }];
const rojo = (dias: number): FilaVigilancia => ({
  municipioCodigo: "A",
  nivel: "ROJO",
  urgente: false,
  origen: "AUTO",
  creadaEn: new Date(HOY.getTime() - dias * 86_400_000).toISOString(),
  respuestas: {},
});

describe("CalcularAlertas + ResumenVigilancia", () => {
  it("recalcular reemplaza las alertas abiertas y el resumen las refleja", async () => {
    const repo = new VigilanciaEnMemoria(Array.from({ length: pack.vigilancia.alerta.minimoRojos }, () => rojo(1)));
    const deps = { pack, municipios, repo, reloj };

    const antes = await new ResumenVigilancia(deps).ejecutar({ dias: 30, origen: "todos" });
    expect(antes.resumen.kpis.municipiosEnAlerta).toBe(0);

    const alertas = await new CalcularAlertas(deps).ejecutar();
    expect(alertas).toHaveLength(1);

    const despues = await new ResumenVigilancia(deps).ejecutar({ dias: 30, origen: "todos" });
    expect(despues.resumen.kpis.municipiosEnAlerta).toBe(1);
    expect(despues.alertas[0].municipioCodigo).toBe("A");

    repo.filas = [];
    expect(await new CalcularAlertas(deps).ejecutar()).toEqual([]);
    expect(await repo.alertasAbiertas()).toEqual([]);
  });

  it("la serie semanal mira 12 semanas aunque el periodo sea de 7 días", async () => {
    const repo = new VigilanciaEnMemoria([rojo(1), rojo(50)]);
    const { resumen } = await new ResumenVigilancia({ pack, municipios, repo, reloj }).ejecutar({ dias: 7, origen: "todos" });
    expect(resumen.kpis.tests).toBe(1);
    expect(resumen.serieSemanal.reduce((s, x) => s + x.conteo, 0)).toBe(2);
  });
});
