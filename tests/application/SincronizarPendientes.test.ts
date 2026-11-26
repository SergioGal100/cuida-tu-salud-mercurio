import { describe, expect, it } from "vitest";
import type { ClienteEnvio } from "@/application/ports/ClienteEnvio";
import { SincronizarPendientes } from "@/application/use-cases/cliente/SincronizarPendientes";
import type { Evaluacion } from "@/domain/evaluacion/Evaluacion";
import { BandejaEnMemoria } from "@/infrastructure/memoria/EnMemoria";

const ev = (id: string): Evaluacion => ({
  id, origen: "AUTO", creadaEn: `2026-11-26T10:00:${id.padStart(2, "0")}Z`, versionPack: "x",
  respuestas: {}, resultado: {} as Evaluacion["resultado"],
});

async function bandejaCon(n: number) {
  const b = new BandejaEnMemoria();
  for (let i = 0; i < n; i++) await b.agregar(ev(String(i)));
  return b;
}

describe("SincronizarPendientes", () => {
  it("envía en lotes de 50 y vacía la bandeja", async () => {
    const b = await bandejaCon(120);
    const tamanos: number[] = [];
    const cliente: ClienteEnvio = {
      enviarLote: async (l) => (tamanos.push(l.length), { aceptados: l.map((e) => e.id), repetidos: [] }),
    };
    const r = await new SincronizarPendientes(b, cliente).ejecutar();
    expect(tamanos).toEqual([50, 50, 20]);
    expect(r).toEqual({ enviadas: 120, pendientes: 0, fallo: false });
  });

  it("los repetidos también cuentan como enviados (idempotente)", async () => {
    const b = await bandejaCon(2);
    const cliente: ClienteEnvio = { enviarLote: async () => ({ aceptados: ["0"], repetidos: ["1"] }) };
    expect((await new SincronizarPendientes(b, cliente).ejecutar()).pendientes).toBe(0);
  });

  it("sin red no pierde nada", async () => {
    const b = await bandejaCon(3);
    const cliente: ClienteEnvio = { enviarLote: async () => { throw new TypeError("Failed to fetch"); } };
    expect(await new SincronizarPendientes(b, cliente).ejecutar()).toEqual({ enviadas: 0, pendientes: 3, fallo: true });
  });

  it("dos llamadas simultáneas no duplican el envío", async () => {
    const b = await bandejaCon(1);
    let llamadas = 0;
    const cliente: ClienteEnvio = {
      enviarLote: async (l) => (llamadas++, { aceptados: l.map((e) => e.id), repetidos: [] }),
    };
    const uc = new SincronizarPendientes(b, cliente);
    await Promise.all([uc.ejecutar(), uc.ejecutar()]);
    expect(llamadas).toBe(1);
  });
});
