import "server-only";
import { RecibirLote } from "@/application/use-cases/servidor/RecibirLote";
import { contentPack, municipios } from "@/infrastructure/content/contenido";
import { prisma } from "@/infrastructure/prisma/cliente";
import { EvaluacionRepositoryPrisma } from "@/infrastructure/prisma/EvaluacionRepositoryPrisma";

// Raíz de composición del servidor: casos de uso con Prisma.
export const recibirLote = new RecibirLote({
  pack: contentPack,
  municipiosValidos: new Set(municipios.map((m) => m.codigo)),
  repo: new EvaluacionRepositoryPrisma(prisma),
});
