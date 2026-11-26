import { describe, expect, it } from "vitest";
import { evaluar, nivelPorPuntaje } from "@/domain/scoring";
import type { Respuestas } from "@/domain/scoring";
import type { ContentPack, NivelId } from "@/domain/contenido/ContentPack";
import { contentPack } from "@/infrastructure/content/contenido";

const pack = contentPack;
const orden = (n: NivelId) => pack.ordenNiveles.indexOf(n);

/** Todas las combinaciones de exposición y síntomas (sin laboratorio). */
function* todasLasRespuestas(): Generator<Respuestas> {
  const [quema, manipulacion, tiempo, pescado] = pack.exposicion.grupos.map((g) => g.opciones.map((o) => o.id));
  const valores = ["si", "no", "duda"] as const;
  const ids = pack.sintomas.grupos.map((g) => g.id);
  for (const q of quema) for (const m of manipulacion) for (const t of tiempo) for (const p of pescado)
    for (let mask = 0; mask < 3 ** ids.length; mask += 7) {
      const sintomas: Respuestas["sintomas"] = {};
      let k = mask;
      for (const id of ids) { sintomas[id] = valores[k % 3]; k = Math.floor(k / 3); }
      for (const vulnerable of ["si", "no"])
        yield {
          contexto: { embarazoLactancia: vulnerable, ninosEnCasa: "no" },
          quema: q, manipulacion: m, tiempo: t, pescado: p,
          alarmaAguda: "no", sintomas,
        };
    }
}

describe("propiedades del motor", () => {
  it("respeta los topes y las reglas nunca bajan el nivel base", () => {
    let n = 0;
    for (const r of todasLasRespuestas()) {
      const res = evaluar(r, pack);
      expect(res.puntajeExposicion).toBeLessThanOrEqual(pack.exposicion.tope);
      expect(res.puntajeSintomas).toBeLessThanOrEqual(pack.sintomas.tope);
      expect(orden(res.nivel)).toBeGreaterThanOrEqual(orden(nivelPorPuntaje(res.puntaje, pack)));
      n++;
    }
    expect(n).toBeGreaterThan(1000);
  });

  it("respuestas vacías dan VERDE con puntaje 0", () => {
    const res = evaluar({}, pack);
    expect(res).toMatchObject({ puntaje: 0, nivel: "VERDE", urgente: false, reglas: [], muestraSugerida: null });
  });

  it("la alarma aguda no cuenta si no hubo quema", () => {
    const res = evaluar({ quema: "no", alarmaAguda: "si" }, pack);
    expect(res.urgente).toBe(false);
    expect(res.reglas).not.toContain("alerta_aguda");
  });

  it("una regla desactivada en el pack no se aplica", () => {
    const sinRegla: ContentPack = {
      ...pack,
      reglas: pack.reglas.map((r) => (r.id === "quema_cerrada_min_amarillo" ? { ...r, activa: false } : r)),
    };
    const res = evaluar({ quema: "quema_cerrada_sin_retorta" }, sinRegla);
    expect(res.nivel).toBe("VERDE");
    expect(res.reglas).toEqual([]);
  });

  it("falla si el pack trae una regla sin condición en el código", () => {
    const raro: ContentPack = { ...pack, reglas: [...pack.reglas, { ...pack.reglas[0], id: "inventada" }] };
    expect(() => evaluar({}, raro)).toThrow(/inventada/);
  });

  it("con laboratorio exige fechaReferencia", () => {
    expect(() =>
      evaluar({}, pack, { laboratorio: { muestra: "ORINA", unidad: "ug/L", valor: 3, fechaToma: "2026-11-01" } }),
    ).toThrow(/fechaReferencia/);
  });

  it("los motivos salen del pack y nunca dicen envenenamiento ni intoxicado", () => {
    const res = evaluar(
      { quema: "quema_cerrada_sin_retorta", manipulacion: "piel_descubierta", sintomas: { temblor: "si", hormigueo: "si" } },
      pack,
    );
    expect(res.motivos.length).toBeGreaterThan(0);
    for (const m of res.motivos) expect(m.texto).not.toMatch(/envenen|intoxicad|%/i);
  });
});
