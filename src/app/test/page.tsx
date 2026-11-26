import { TestCliente } from "./TestCliente";

// Ruta estática: sin datos del servidor, para que funcione sin internet.
export const dynamic = "force-static";

export default function PaginaTest() {
  return <TestCliente />;
}
