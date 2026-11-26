import type { Prisma, PrismaClient } from "@prisma/client";
import type { CambiosFicha, ConsultaRepository, FiltrosCasos } from "@/application/ports/ConsultaRepository";
import type { Consulta, ExamenFisico, LaboratorioRegistrado } from "@/domain/consulta/Consulta";
import type { MuestraLaboratorio, NivelId } from "@/domain/contenido/ContentPack";
import type { EvaluacionRecibida } from "@/domain/evaluacion/EvaluacionRecibida";
import type { Respuestas, ResultadoEvaluacion } from "@/domain/scoring";

const fechaIso = (d: Date) => d.toISOString().slice(0, 10);

export class ConsultaRepositoryPrisma implements ConsultaRepository {
  constructor(private readonly db: PrismaClient) {}

  async crearConEvaluacion({
    evaluacion: e,
    establecimientoId,
    usuarioId,
  }: {
    evaluacion: EvaluacionRecibida;
    establecimientoId: string;
    usuarioId: string;
  }) {
    const consulta = await this.db.consulta.create({
      data: {
        establecimiento: { connect: { id: establecimientoId } },
        usuario: { connect: { id: usuarioId } },
        nivelFinal: e.resultado.nivel,
        evaluacion: {
          create: {
            id: e.id,
            origen: e.origen,
            creadaEnDispositivo: new Date(e.creadaEnDispositivo),
            municipio: e.municipioCodigo ? { connect: { codigo: e.municipioCodigo } } : undefined,
            rangoEdad: e.rangoEdad,
            sexo: e.sexo,
            embarazoLactancia: e.embarazoLactancia,
            ninosEnCasa: e.ninosEnCasa,
            respuestas: e.respuestas as Prisma.InputJsonValue,
            puntaje: e.resultado.puntaje,
            nivel: e.resultado.nivel,
            urgente: e.resultado.urgente,
            reglas: e.resultado.reglas,
            resultado: e.resultado as unknown as Prisma.InputJsonValue,
            versionPack: e.versionPack,
            discrepancia: e.discrepancia,
          },
        },
      },
      select: { id: true },
    });
    return consulta.id;
  }

  async obtener(id: string, establecimientoId: string): Promise<Consulta | null> {
    const c = await this.db.consulta.findFirst({
      where: { id, establecimientoId },
      include: { evaluacion: true, laboratorios: { orderBy: { creadoEn: "desc" } } },
    });
    if (!c) return null;
    return {
      id: c.id,
      evaluacionId: c.evaluacionId,
      establecimientoId: c.establecimientoId,
      fecha: c.fecha.toISOString(),
      respuestas: c.evaluacion.respuestas as Respuestas,
      resultadoEntrevista: c.evaluacion.resultado as unknown as ResultadoEvaluacion,
      examen: (c.examen ?? {}) as ExamenFisico,
      conducta: (c.conducta as Consulta["conducta"]) ?? null,
      nivelFinal: c.nivelFinal,
      estado: c.estado,
      laboratorios: c.laboratorios.map(
        (l): LaboratorioRegistrado => ({
          id: l.id,
          muestra: l.muestra as MuestraLaboratorio,
          unidad: l.unidad,
          valor: l.valor,
          fechaToma: fechaIso(l.fechaToma),
          laboratorio: l.laboratorio,
          nivel: l.nivel,
          creadoEn: l.creadoEn.toISOString(),
        }),
      ),
    };
  }

  async actualizarFicha(id: string, establecimientoId: string, cambios: CambiosFicha) {
    const r = await this.db.consulta.updateMany({
      where: { id, establecimientoId },
      data: {
        examen: cambios.examen as Prisma.InputJsonValue | undefined,
        conducta: cambios.conducta,
        estado: cambios.estado,
      },
    });
    return r.count > 0;
  }

  async agregarLaboratorio(
    consultaId: string,
    lab: Omit<LaboratorioRegistrado, "id" | "creadoEn">,
    nivelFinal: NivelId,
  ) {
    await this.db.$transaction([
      this.db.resultadoLaboratorio.create({
        data: {
          consultaId,
          muestra: lab.muestra,
          valor: lab.valor,
          unidad: lab.unidad,
          fechaToma: new Date(`${lab.fechaToma}T00:00:00Z`),
          laboratorio: lab.laboratorio,
          nivel: lab.nivel,
        },
      }),
      this.db.consulta.update({ where: { id: consultaId }, data: { nivelFinal } }),
    ]);
  }

  async listar(establecimientoId: string, filtros: FiltrosCasos) {
    const filas = await this.db.consulta.findMany({
      where: { establecimientoId, estado: filtros.estado, nivelFinal: filtros.nivel },
      orderBy: { fecha: "desc" },
      take: 200,
      select: {
        id: true,
        fecha: true,
        nivelFinal: true,
        estado: true,
        evaluacion: { select: { municipioCodigo: true, urgente: true } },
        _count: { select: { laboratorios: true } },
      },
    });
    return filas.map((f) => ({
      id: f.id,
      fecha: f.fecha.toISOString(),
      municipioCodigo: f.evaluacion.municipioCodigo,
      nivelFinal: f.nivelFinal,
      urgente: f.evaluacion.urgente,
      estado: f.estado,
      tieneLaboratorio: f._count.laboratorios > 0,
    }));
  }
}
