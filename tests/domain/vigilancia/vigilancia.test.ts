import { describe, expect, it } from "vitest";
import type { NivelId } from "@/domain/contenido/ContentPack";
import type { OrigenEvaluacion } from "@/domain/evaluacion/Evaluacion";
import { calcularAlertas, resumirVigilancia, suprimir, type FilaVigilancia } from "@/domain/vigilancia";
import { contentPack as pack } from "@/infrastructure/content/contenido";

const HOY = new Date("2026-11-26T12:00:00Z");
const haceDias = (d: number) => new Date(HOY.getTime() - d * 86_400_000).toISOString();
const municipios = [
  { codigo: "A", nombre: "Uno", latCentro: -15, lonCentro: -68 },
  { codigo: "B", nombre: "Dos", latCentro: -16, lonCentro: -67 },
];

function fila(municipio: string | null, nivel: NivelId, extra: Partial<FilaVigilancia> = {}): FilaVigilancia {
  return {
    municipioCodigo: municipio,
    nivel,
    urgente: false,
    origen: "AUTO" as OrigenEvaluacion,
    creadaEn: haceDias(1),
    respuestas: { quema: "no", sintomas: { temblor: "si", hormigueo: "no" } },
    ...extra,
  };
}
const varias = (n: number, f: () => FilaVigilancia) => Array.from({ length: n }, f);

const resumir = (filas: FilaVigilancia[], origen: "todos" | "auto" | "posta" = "todos") =>
  resumirVigilancia(filas, pack, municipios, {
    desde: new Date(HOY.getTime() - 30 * 86_400_000),
    hasta: HOY,
    origen,
    municipiosEnAlerta: new Set(["A"]),
  });

describe("supresión de celdas chicas", () => {
  it("oculta 1 a 4 y muestra 0 y 5", () => {
    expect([0, 1, 4, 5].map((n) => suprimir(n, 5))).toEqual([0, null, null, 5]);
  });

  it("un municipio con menos de 5 tests no muestra conteos ni insignia", () => {
    const r = resumir([...varias(6, () => fila("A", "ROJO")), ...varias(3, () => fila("B", "ROJO"))]);
    const b = r.municipios.find((m) => m.codigo === "B")!;
    expect(b.suprimido).toBe(true);
    expect(b.total).toBeNull();
    expect(b.insignia).toBeNull();
    expect(Object.values(b.porNivel).every((v) => v === null)).toBe(true);
  });

  it("dentro de un municipio publicable, una celda de nivel con 1 a 4 queda en null", () => {
    const r = resumir([...varias(6, () => fila("A", "VERDE")), ...varias(2, () => fila("A", "ROJO"))]);
    const a = r.municipios.find((m) => m.codigo === "A")!;
    expect(a.total).toBe(8);
    expect(a.porNivel.VERDE).toBe(6);
    expect(a.porNivel.ROJO).toBeNull();
    expect(a.conVisita).toBeNull();
  });
});

describe("resumen", () => {
  it("separa autorreportados de verificados en la posta", () => {
    const filas = [...varias(5, () => fila("A", "AMARILLO")), ...varias(5, () => fila("A", "ROJO", { origen: "POSTA" }))];
    expect(resumir(filas).kpis).toMatchObject({ tests: 10, conVisita: 10, verificadosPosta: 5, municipiosEnAlerta: 1 });
    expect(resumir(filas, "auto").kpis.tests).toBe(5);
    expect(resumir(filas, "posta").kpis.verificadosPosta).toBe(5);
  });

  it("cuenta urgentes aparte y deja fuera lo anterior al periodo", () => {
    const filas = [
      ...varias(5, () => fila("A", "ROJO", { urgente: true })),
      ...varias(5, () => fila("A", "VERDE", { creadaEn: haceDias(40) })),
    ];
    const a = resumir(filas).municipios.find((m) => m.codigo === "A")!;
    expect(a.porNivel.URGENTE).toBe(5);
    expect(a.porNivel.VERDE).toBe(0);
  });

  it("cuenta respuestas sí de síntomas y exposiciones con puntos", () => {
    const filas = varias(6, () => fila("A", "AMARILLO", { respuestas: { quema: "no", manipulacion: "piel_descubierta", sintomas: { temblor: "si" } } }));
    const r = resumir(filas);
    expect(r.baseConteos).toBe(6);
    expect(r.sintomas.find((s) => s.id === "temblor")!.conteo).toBe(6);
    expect(r.exposiciones.find((e) => e.id === "quema")!.conteo).toBe(0);
    expect(r.exposiciones.find((e) => e.id === "manipulacion")!.conteo).toBe(6);
  });

  it("la fila de 'Prefiero no decir' no entra al mapa", () => {
    const r = resumir(varias(5, () => fila(null, "VERDE")));
    expect(r.sinMunicipio.total).toBe(5);
    expect(r.municipios.every((m) => m.total === 0)).toBe(true);
  });
});

describe("alertas", () => {
  const validos = new Set(["A", "B"]);
  const { minimoRojos, ventanaDias } = pack.vigilancia.alerta;

  it("alerta cuando se junta el mínimo de ROJO o URGENTE en la ventana", () => {
    const filas = [
      ...varias(minimoRojos - 1, () => fila("A", "ROJO")),
      fila("A", "AMARILLO", { urgente: true }),
      ...varias(minimoRojos - 1, () => fila("B", "ROJO")),
    ];
    const alertas = calcularAlertas(filas, pack, validos, HOY);
    expect(alertas.map((a) => [a.municipioCodigo, a.conteo])).toEqual([["A", minimoRojos]]);
  });

  it("no cuenta lo que quedó fuera de la ventana ni municipios desconocidos", () => {
    const filas = [
      ...varias(minimoRojos, () => fila("A", "ROJO", { creadaEn: haceDias(ventanaDias + 1) })),
      ...varias(minimoRojos, () => fila("Z", "ROJO")),
    ];
    expect(calcularAlertas(filas, pack, validos, HOY)).toEqual([]);
  });
});
