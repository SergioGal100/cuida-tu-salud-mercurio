import { describe, expect, it } from "vitest";
import casosJson from "../../../content/casos.json";
import { evaluar } from "@/domain/scoring";
import type { OpcionesEvaluacion, Respuestas } from "@/domain/scoring";
import { contentPack } from "@/infrastructure/content/contenido";

interface Caso {
  id: string;
  respuestas: Respuestas;
  opciones?: OpcionesEvaluacion;
  esperado: Record<string, unknown>;
}

const casos = casosJson.casos as unknown as Caso[];

describe("evaluar contra content/casos.json", () => {
  it("hay 17 casos", () => {
    expect(casos).toHaveLength(17);
  });

  it.each(casos.map((c) => [c.id, c] as const))("%s", (_id, caso) => {
    const resultado = evaluar(caso.respuestas, contentPack, caso.opciones);
    expect(resultado).toMatchObject(caso.esperado);
  });
});
