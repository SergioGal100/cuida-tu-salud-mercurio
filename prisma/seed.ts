// Siembra el catálogo de municipios (datos de prueba). Uso: pnpm db:seed
import { PrismaClient } from "@prisma/client";
import municipiosJson from "../content/municipios.json";

const prisma = new PrismaClient();

async function main() {
  for (const m of municipiosJson.municipios) {
    const datos = { nombre: m.nombre, departamento: m.departamento, latCentro: m.latCentro, lonCentro: m.lonCentro };
    await prisma.municipio.upsert({ where: { codigo: m.codigo }, create: { codigo: m.codigo, ...datos }, update: datos });
  }
  console.log(`Municipios: ${municipiosJson.municipios.length}`);
}

main().finally(() => prisma.$disconnect());
