// Siembra catálogo, posta, usuarios de prueba y ~300 evaluaciones simuladas. Idempotente. Uso: pnpm db:seed
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import packJson from "../content/content_pack.json";
import municipiosJson from "../content/municipios.json";
import type { ContentPack } from "../src/domain/contenido/ContentPack";
import { generarSimulacion, VERSION_SIMULADA } from "./simulacion";

const prisma = new PrismaClient();

const ESTABLECIMIENTO_DEMO = "00000000-0000-4000-8000-000000000001";
const CONTRASENA_DEMO = "demo1234";

async function main() {
  for (const m of municipiosJson.municipios) {
    const datos = { nombre: m.nombre, departamento: m.departamento, latCentro: m.latCentro, lonCentro: m.lonCentro };
    await prisma.municipio.upsert({ where: { codigo: m.codigo }, create: { codigo: m.codigo, ...datos }, update: datos });
  }

  await prisma.establecimiento.upsert({
    where: { id: ESTABLECIMIENTO_DEMO },
    create: { id: ESTABLECIMIENTO_DEMO, nombre: "Posta de prueba Río Dorado", municipioCodigo: "DEMO-01", nivelAtencion: "Primer nivel" },
    update: {},
  });

  const passwordHash = await bcrypt.hash(CONTRASENA_DEMO, 10);
  const usuarios = [
    { email: "medico@demo.bo", rol: "MEDICO" as const, establecimientoId: ESTABLECIMIENTO_DEMO },
    { email: "epi@demo.bo", rol: "EPIDEMIOLOGO" as const, establecimientoId: null },
    { email: "admin@demo.bo", rol: "ADMIN" as const, establecimientoId: ESTABLECIMIENTO_DEMO },
  ];
  for (const u of usuarios) {
    await prisma.usuario.upsert({ where: { email: u.email }, create: { ...u, passwordHash }, update: { ...u, passwordHash, activo: true } });
  }
  // Evaluaciones simuladas para la vigilancia: se rehacen en cada seed con fechas
  // relativas a hoy (solo las simuladas sin consulta; nada real se toca).
  const borradas = await prisma.evaluacion.deleteMany({ where: { versionPack: VERSION_SIMULADA, consulta: null } });
  const simuladas = generarSimulacion(packJson as unknown as ContentPack, new Date());
  await prisma.evaluacion.createMany({
    data: simuladas.map((e) => ({
      id: e.id,
      origen: e.origen,
      creadaEnDispositivo: e.creadaEn,
      recibidaEn: e.creadaEn,
      municipioCodigo: e.municipioCodigo,
      rangoEdad: e.respuestas.contexto?.rangoEdad ?? null,
      sexo: e.respuestas.contexto?.sexo ?? null,
      embarazoLactancia: e.respuestas.contexto?.embarazoLactancia ?? null,
      ninosEnCasa: e.respuestas.contexto?.ninosEnCasa ?? null,
      respuestas: e.respuestas as Prisma.InputJsonValue,
      puntaje: e.resultado.puntaje,
      nivel: e.resultado.nivel,
      urgente: e.resultado.urgente,
      reglas: e.resultado.reglas,
      resultado: e.resultado as unknown as Prisma.InputJsonValue,
      versionPack: VERSION_SIMULADA,
    })),
    skipDuplicates: true,
  });
  console.log(`Evaluaciones simuladas: ${simuladas.length} (reemplazan ${borradas.count})`);

  console.log(`Municipios: ${municipiosJson.municipios.length} · usuarios de prueba: ${usuarios.length}`);
}

main().finally(() => prisma.$disconnect());
