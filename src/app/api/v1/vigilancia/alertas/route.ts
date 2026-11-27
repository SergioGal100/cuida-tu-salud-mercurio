import { calcularAlertas, personalActual } from "@/composition/server";

/** Botón "Recalcular alertas": solo epidemiología o administración. */
export async function POST() {
  const personal = await personalActual();
  if (!personal || (personal.rol !== "EPIDEMIOLOGO" && personal.rol !== "ADMIN")) {
    return Response.json({ error: "no_autorizado" }, { status: 401 });
  }
  const alertas = await calcularAlertas.ejecutar();
  return Response.json({ abiertas: alertas.length });
}
