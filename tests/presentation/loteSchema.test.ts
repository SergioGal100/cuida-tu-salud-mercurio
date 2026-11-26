import { describe, expect, it } from "vitest";
import { aLoteDominio } from "@/presentation/schemas/loteSchema";

const valida = {
  id: "0f8fad5b-d9cb-469f-a165-70867728950e", origen: "AUTO", creadaEn: "2026-11-26T10:00:00.000Z",
  versionPack: "1.0.0-demo", respuestas: { contexto: { municipio: "DEMO-01" }, quema: "no", sintomas: { temblor: "duda" } },
};

describe("loteSchema", () => {
  it("acepta un lote válido", () => {
    expect(aLoteDominio({ evaluaciones: [valida] })).toHaveLength(1);
  });
  it.each([
    ["un campo extra como nombre", { ...valida, nombre: "Juan" }],
    ["texto libre en una respuesta", { ...valida, respuestas: { quema: "Juan Pérez 7654321" } }],
    ["un campo extra en contexto", { ...valida, respuestas: { contexto: { carnet: "123" } } }],
    ["origen POSTA por la vía pública", { ...valida, origen: "POSTA" }],
    ["id que no es UUID", { ...valida, id: "1" }],
  ])("rechaza %s", (_n, ev) => {
    expect(() => aLoteDominio({ evaluaciones: [ev] })).toThrow();
  });
  it("rechaza más de 50", () => {
    expect(() => aLoteDominio({ evaluaciones: Array(51).fill(valida) })).toThrow();
  });
});
