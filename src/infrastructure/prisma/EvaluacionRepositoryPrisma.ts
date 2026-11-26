import type { Prisma, PrismaClient } from "@prisma/client";
import type { EvaluacionRepository } from "@/application/ports/EvaluacionRepository";
import type { EvaluacionRecibida } from "@/domain/evaluacion/EvaluacionRecibida";

export class EvaluacionRepositoryPrisma implements EvaluacionRepository {
  constructor(private readonly db: PrismaClient) {}

  async idsExistentes(ids: string[]) {
    const filas = await this.db.evaluacion.findMany({ where: { id: { in: ids } }, select: { id: true } });
    return new Set(filas.map((f) => f.id));
  }

  async guardarVarias(evaluaciones: EvaluacionRecibida[]) {
    if (evaluaciones.length === 0) return [];
    const filas = await this.db.evaluacion.createManyAndReturn({
      data: evaluaciones.map((e) => ({
        id: e.id,
        origen: e.origen,
        creadaEnDispositivo: new Date(e.creadaEnDispositivo),
        municipioCodigo: e.municipioCodigo,
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
      })),
      skipDuplicates: true,
      select: { id: true },
    });
    return filas.map((f) => f.id);
  }
}
