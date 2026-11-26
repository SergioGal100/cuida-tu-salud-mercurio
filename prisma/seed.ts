// Siembra catálogo, posta y usuarios de prueba. Idempotente. Uso: pnpm db:seed
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import municipiosJson from "../content/municipios.json";

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
  console.log(`Municipios: ${municipiosJson.municipios.length} · usuarios de prueba: ${usuarios.length}`);
}

main().finally(() => prisma.$disconnect());
