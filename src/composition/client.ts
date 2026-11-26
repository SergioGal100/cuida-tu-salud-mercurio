// Raíz de composición del celular. Arma los casos de uso con sus adaptadores.
// Paso 3: bandeja e historial en memoria. Paso 4: se cambian por Dexie.
import { RealizarTest } from "@/application/use-cases/cliente/RealizarTest";
import { VerHistorial } from "@/application/use-cases/cliente/VerHistorial";
import { contentPack } from "@/infrastructure/content/contenido";
import { BandejaEnMemoria, HistorialEnMemoria } from "@/infrastructure/memoria/EnMemoria";
import { GeneradorUuid } from "@/infrastructure/sistema/GeneradorUuid";
import { RelojSistema } from "@/infrastructure/sistema/RelojSistema";

export interface CasosDeUsoCliente {
  realizarTest: RealizarTest;
  verHistorial: VerHistorial;
}

let casos: CasosDeUsoCliente | null = null;

/** Se crea al primer uso (en el navegador), nunca al importar. */
export function casosDeUsoCliente(): CasosDeUsoCliente {
  if (!casos) {
    const bandeja = new BandejaEnMemoria();
    const historial = new HistorialEnMemoria();
    casos = {
      realizarTest: new RealizarTest({
        pack: contentPack,
        reloj: new RelojSistema(),
        generadorId: new GeneradorUuid(),
        bandeja,
        historial,
      }),
      verHistorial: new VerHistorial(historial),
    };
  }
  return casos;
}
