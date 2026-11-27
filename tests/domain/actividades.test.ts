import { describe, expect, it } from "vitest";
import {
  distanciaAEspiral,
  esSecuenciaCorrecta,
  mediana,
  parametrosEspiral,
  puntosEspiral,
  resumirAlternancia,
  resumirEspiral,
  resumirMemoria,
  resumirReaccion,
} from "@/domain/actividades";

describe("memoria", () => {
  it("compara el orden exacto", () => {
    expect(esSecuenciaCorrecta([1, 4, 2], [1, 4, 2])).toBe(true);
    expect(esSecuenciaCorrecta([1, 4, 2], [4, 1, 2])).toBe(false);
    expect(esSecuenciaCorrecta([1, 4, 2], [1, 4])).toBe(false);
  });
  it("cuenta correctas y la secuencia más larga bien repetida", () => {
    expect(
      resumirMemoria([
        { longitud: 3, correcta: true },
        { longitud: 4, correcta: true },
        { longitud: 5, correcta: false },
      ]),
    ).toEqual({ correctas: 2, total: 3, maxLongitud: 4 });
  });
});

describe("reacción", () => {
  it("usa la mediana (no se deja llevar por un intento lento)", () => {
    expect(mediana([300, 320, 2000])).toBe(320);
    expect(mediana([300, 400])).toBe(350);
    expect(resumirReaccion([310, 290, 900, 305, 300], 1)).toEqual({ medianaMs: 305, validos: 5, anticipaciones: 1 });
  });
});

describe("alternancia", () => {
  it("cuenta alternados y repetidos", () => {
    expect(resumirAlternancia(["A", "B", "A", "A", "B"], 10)).toEqual({ segundos: 10, alternados: 4, repetidos: 1 });
    expect(resumirAlternancia([], 10)).toEqual({ segundos: 10, alternados: 0, repetidos: 0 });
  });
});

describe("espiral", () => {
  it("un trazo sobre la línea tiene distancia casi cero", () => {
    const trazo = puntosEspiral(3, 60).map(([x, y], i) => ({ x, y, t: i * 10 }));
    const r = resumirEspiral(trazo, 3);
    expect(r.distanciaMedia).toBeLessThan(0.5);
    expect(r.duracionMs).toBe((trazo.length - 1) * 10);
  });
  it("un punto corrido hacia afuera mide la distancia al brazo más cercano", () => {
    const { centro, b } = parametrosEspiral(3);
    // En ángulo 0, los brazos están en r = 0, 2πb, 4πb...
    const r = 2 * Math.PI * b + 5;
    expect(distanciaAEspiral(centro + r, centro, 3)).toBeCloseTo(5, 5);
  });
});
