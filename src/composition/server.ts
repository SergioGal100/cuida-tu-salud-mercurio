import "server-only";
import { RecibirLote } from "@/application/use-cases/servidor/RecibirLote";
import { RegistrarConsulta } from "@/application/use-cases/servidor/RegistrarConsulta";
import {
  CargarLaboratorio,
  GuardarFicha,
  ListarCasos,
  VerConsulta,
} from "@/application/use-cases/servidor/Consultas";
import { contentPack, municipios } from "@/infrastructure/content/contenido";
import { prisma } from "@/infrastructure/prisma/cliente";
import { ConsultaRepositoryPrisma } from "@/infrastructure/prisma/ConsultaRepositoryPrisma";
import { EvaluacionRepositoryPrisma } from "@/infrastructure/prisma/EvaluacionRepositoryPrisma";
import { GeneradorUuid } from "@/infrastructure/sistema/GeneradorUuid";
import { RelojSistema } from "@/infrastructure/sistema/RelojSistema";

export { handlers, signIn, signOut, personalActual, atencionActual } from "@/infrastructure/auth/auth";
export { contentPack, municipios } from "@/infrastructure/content/contenido";
export type { PersonalSesion, RolPersonal } from "@/infrastructure/auth/auth";

// Raíz de composición del servidor: casos de uso con Prisma.
const municipiosValidos = new Set(municipios.map((m) => m.codigo));
const reloj = new RelojSistema();
const consultas = new ConsultaRepositoryPrisma(prisma);

export const recibirLote = new RecibirLote({
  pack: contentPack,
  municipiosValidos,
  repo: new EvaluacionRepositoryPrisma(prisma),
});

export const registrarConsulta = new RegistrarConsulta({
  pack: contentPack,
  municipiosValidos,
  repo: consultas,
  reloj,
  generadorId: new GeneradorUuid(),
});
export const guardarFicha = new GuardarFicha(consultas);
export const cargarLaboratorio = new CargarLaboratorio({ pack: contentPack, repo: consultas, reloj });
export const listarCasos = new ListarCasos(consultas);
export const verConsulta = new VerConsulta(consultas);
