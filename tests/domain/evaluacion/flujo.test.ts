import { describe, expect, it } from "vitest";
import { limpiarRespuestas, pasosDelTest } from "@/domain/evaluacion/flujo";
import { contentPack as pack } from "@/infrastructure/content/contenido";

const tipos = (r: Parameters<typeof pasosDelTest>[1]) => pasosDelTest(pack, r).map((p) => p.tipo);

describe("pasosDelTest", () => {
  it("sin quema no pregunta la alarma aguda", () => {
    const t = tipos({ quema: "no" });
    expect(t).not.toContain("alarmaAguda");
    expect(t.filter((x) => x === "sintoma")).toHaveLength(6);
    expect(t.at(-1)).toBe("resultado");
  });

  it("agrupa edad y sexo en una pantalla y el municipio va aparte", () => {
    const pasos = pasosDelTest(pack, {});
    expect(pasos).toContainEqual({ tipo: "contexto", ids: ["rangoEdad", "sexo"] });
    expect(pasos.filter((p) => p.tipo === "municipio")).toHaveLength(1);
  });

  it("con quema pregunta la alarma justo después de la quema", () => {
    const t = tipos({ quema: "cerca_del_area" });
    expect(t[t.indexOf("alarmaAguda") - 1]).toBe("exposicion");
  });

  it("alarma 'sí' corta el test y va al resultado", () => {
    const t = tipos({ quema: "cerca_del_area", alarmaAguda: "si" });
    expect(t.at(-2)).toBe("alarmaAguda");
    expect(t.at(-1)).toBe("resultado");
    expect(t).not.toContain("sintoma");
  });

  it("el test tiene entre 12 y 18 pantallas de pregunta", () => {
    const preguntas = tipos({ quema: "cerca_del_area", alarmaAguda: "no" }).filter(
      (x) => x !== "confianza" && x !== "resultado",
    );
    expect(preguntas.length).toBeGreaterThanOrEqual(12);
    expect(preguntas.length).toBeLessThanOrEqual(18);
  });
});

describe("limpiarRespuestas", () => {
  it("borra la alarma si después se cambió la quema a 'no'", () => {
    expect(limpiarRespuestas(pack, { quema: "no", alarmaAguda: "si" }).alarmaAguda).toBeUndefined();
  });

  it("con alarma 'sí' descarta lo que no se llegó a preguntar", () => {
    const r = limpiarRespuestas(pack, {
      quema: "cerca_del_area", alarmaAguda: "si", pescado: "mas_de_3_por_semana", sintomas: { temblor: "si" },
    });
    expect(r).toEqual({ quema: "cerca_del_area", alarmaAguda: "si" });
  });
});
