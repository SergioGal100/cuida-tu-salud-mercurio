import type { PrismaClient } from "@prisma/client";
import type { VigilanciaRepository } from "@/application/ports/VigilanciaRepository";
import type { Respuestas } from "@/domain/scoring";
import type { AlertaNueva } from "@/domain/vigilancia";

export class VigilanciaRepositoryPrisma implements VigilanciaRepository {
  constructor(private readonly db: PrismaClient) {}

  async filasEntre(desde: Date, hasta: Date) {
    const filas = await this.db.evaluacion.findMany({
      where: { creadaEnDispositivo: { gte: desde, lte: hasta } },
      select: { municipioCodigo: true, nivel: true, urgente: true, origen: true, creadaEnDispositivo: true, respuestas: true },
    });
    return filas.map((f) => ({
      municipioCodigo: f.municipioCodigo,
      nivel: f.nivel,
      urgente: f.urgente,
      origen: f.origen,
      creadaEn: f.creadaEnDispositivo.toISOString(),
      respuestas: f.respuestas as Respuestas,
    }));
  }

  async reemplazarAlertasAbiertas(alertas: AlertaNueva[]) {
    await this.db.$transaction([
      this.db.alerta.updateMany({ where: { estado: "ABIERTA" }, data: { estado: "CERRADA" } }),
      this.db.alerta.createMany({
        data: alertas.map((a) => ({ ...a, desde: new Date(a.desde), hasta: new Date(a.hasta) })),
      }),
    ]);
  }

  async alertasAbiertas() {
    const filas = await this.db.alerta.findMany({ where: { estado: "ABIERTA" }, orderBy: { conteo: "desc" } });
    return filas.map((a) => ({
      id: a.id,
      municipioCodigo: a.municipioCodigo,
      regla: a.regla,
      desde: a.desde.toISOString(),
      hasta: a.hasta.toISOString(),
      conteo: a.conteo,
      creadaEn: a.creadaEn.toISOString(),
    }));
  }
}
