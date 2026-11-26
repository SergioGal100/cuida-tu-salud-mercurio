import { describe, expect, it } from "vitest";
import type { CambiosFicha, ConsultaRepository, FiltrosCasos } from "@/application/ports/ConsultaRepository";
import { CargarLaboratorio, GuardarFicha, ListarCasos } from "@/application/use-cases/servidor/Consultas";
import { RegistrarConsulta } from "@/application/use-cases/servidor/RegistrarConsulta";
import type { Consulta, LaboratorioRegistrado } from "@/domain/consulta/Consulta";
import type { NivelId } from "@/domain/contenido/ContentPack";
import type { EvaluacionRecibida } from "@/domain/evaluacion/EvaluacionRecibida";
import { contentPack as pack } from "@/infrastructure/content/contenido";

class RepoEnMemoria implements ConsultaRepository {
  consultas = new Map<string, Consulta & { usuarioId: string; municipio: string | null }>();
  private n = 0;
  async crearConEvaluacion(d: { evaluacion: EvaluacionRecibida; establecimientoId: string; usuarioId: string }) {
    const id = `c-${++this.n}`;
    this.consultas.set(id, {
      id, evaluacionId: d.evaluacion.id, establecimientoId: d.establecimientoId, usuarioId: d.usuarioId,
      fecha: d.evaluacion.creadaEnDispositivo, respuestas: d.evaluacion.respuestas,
      resultadoEntrevista: d.evaluacion.resultado, examen: {}, conducta: null,
      nivelFinal: d.evaluacion.resultado.nivel, estado: "ABIERTA", laboratorios: [], municipio: d.evaluacion.municipioCodigo,
    });
    return id;
  }
  async obtener(id: string, est: string) {
    const c = this.consultas.get(id);
    return c && c.establecimientoId === est ? c : null;
  }
  async actualizarFicha(id: string, est: string, cambios: CambiosFicha) {
    const c = await this.obtener(id, est);
    if (!c) return false;
    Object.assign(c, Object.fromEntries(Object.entries(cambios).filter(([, v]) => v !== undefined)));
    return true;
  }
  async agregarLaboratorio(id: string, lab: Omit<LaboratorioRegistrado, "id" | "creadoEn">, nivelFinal: NivelId) {
    const c = this.consultas.get(id)!;
    c.laboratorios.unshift({ ...lab, id: "l", creadoEn: "" });
    c.nivelFinal = nivelFinal;
  }
  async listar(est: string, f: FiltrosCasos) {
    return [...this.consultas.values()]
      .filter((c) => c.establecimientoId === est && (!f.nivel || c.nivelFinal === f.nivel) && (!f.estado || c.estado === f.estado))
      .map((c) => ({ id: c.id, fecha: c.fecha, municipioCodigo: c.municipio, nivelFinal: c.nivelFinal, urgente: false, estado: c.estado, tieneLaboratorio: c.laboratorios.length > 0 }));
  }
}

const POSTA_A = { usuarioId: "u1", establecimientoId: "est-A" };
const POSTA_B = { usuarioId: "u2", establecimientoId: "est-B" };
const reloj = { ahora: () => new Date("2026-11-26T12:00:00Z") };

function armar() {
  const repo = new RepoEnMemoria();
  const registrar = new RegistrarConsulta({
    pack, municipiosValidos: new Set(["DEMO-01"]), repo, reloj, generadorId: { nuevo: () => "ev-1" },
  });
  return { repo, registrar, cargar: new CargarLaboratorio({ pack, repo, reloj }), ficha: new GuardarFicha(repo), listar: new ListarCasos(repo) };
}

// Caso 15 de casos.json: entrevista AMARILLO (30) + orina alta ⇒ ROJO.
const entrevistaCaso15 = {
  contexto: { municipio: "DEMO-01", embarazoLactancia: "no", ninosEnCasa: "no" },
  quema: "quema_aire_libre_sin_proteccion", manipulacion: "epp_inadecuado", tiempo: "mas_de_2_anios", pescado: "casi_nunca",
  alarmaAguda: "no",
};

describe("consultas en la posta", () => {
  it("registra la entrevista como evaluación POSTA con el nivel del motor", async () => {
    const { repo, registrar } = armar();
    const id = await registrar.ejecutar(entrevistaCaso15, POSTA_A);
    expect(repo.consultas.get(id)).toMatchObject({ nivelFinal: "AMARILLO", establecimientoId: "est-A", municipio: "DEMO-01" });
  });

  it("cargar laboratorio alto recalcula y sube a ROJO", async () => {
    const { repo, registrar, cargar } = armar();
    const id = await registrar.ejecutar(entrevistaCaso15, POSTA_A);
    const r = await cargar.ejecutar(id, { muestra: "ORINA", unidad: "ug/g_creatinina", valor: 25, fechaToma: "2026-11-20", laboratorio: null }, POSTA_A);
    expect(r).toMatchObject({ ok: true, resultado: { nivel: "ROJO", nivelLaboratorio: "ROJO", reglas: ["laboratorio"] } });
    expect(repo.consultas.get(id)?.nivelFinal).toBe("ROJO");
  });

  it("laboratorio vencido no cambia el nivel y avisa", async () => {
    const { registrar, cargar } = armar();
    const id = await registrar.ejecutar(entrevistaCaso15, POSTA_A);
    const r = await cargar.ejecutar(id, { muestra: "ORINA", unidad: "ug/g_creatinina", valor: 25, fechaToma: "2026-07-01", laboratorio: null }, POSTA_A);
    expect(r).toMatchObject({ ok: true, resultado: { nivel: "AMARILLO", advertencias: ["laboratorio_vencido"] } });
  });

  it("otro establecimiento no puede ver, editar ni cargar laboratorio", async () => {
    const { registrar, cargar, ficha, listar } = armar();
    const id = await registrar.ejecutar(entrevistaCaso15, POSTA_A);
    expect(await cargar.ejecutar(id, { muestra: "ORINA", unidad: "ug/L", valor: 1, fechaToma: "2026-11-20", laboratorio: null }, POSTA_B)).toEqual({ ok: false, motivo: "no_encontrada" });
    expect(await ficha.ejecutar(id, { estado: "CERRADA" }, POSTA_B)).toBe(false);
    expect(await listar.ejecutar(POSTA_B)).toEqual([]);
    expect(await listar.ejecutar(POSTA_A)).toHaveLength(1);
  });
});
