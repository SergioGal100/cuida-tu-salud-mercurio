// Raíz de composición del celular: casos de uso con Dexie (IndexedDB) y HTTP.
import type { BandejaSalida } from "@/application/ports/BandejaSalida";
import type { HistorialLocal } from "@/application/ports/HistorialLocal";
import { RealizarTest } from "@/application/use-cases/cliente/RealizarTest";
import { SincronizarPendientes } from "@/application/use-cases/cliente/SincronizarPendientes";
import { VerHistorial } from "@/application/use-cases/cliente/VerHistorial";
import { contentPack } from "@/infrastructure/content/contenido";
import { BandejaDexie } from "@/infrastructure/dexie/BandejaDexie";
import { BaseLocal } from "@/infrastructure/dexie/db";
import { HistorialDexie } from "@/infrastructure/dexie/HistorialDexie";
import { ClienteEnvioHttp } from "@/infrastructure/http/ClienteEnvioHttp";
import { BandejaEnMemoria, HistorialEnMemoria } from "@/infrastructure/memoria/EnMemoria";
import { GeneradorUuid } from "@/infrastructure/sistema/GeneradorUuid";
import { RelojSistema } from "@/infrastructure/sistema/RelojSistema";

export interface CasosDeUsoCliente {
  realizarTest: RealizarTest;
  verHistorial: VerHistorial;
  sincronizar: SincronizarPendientes;
  bandeja: BandejaSalida;
}

let casos: CasosDeUsoCliente | null = null;

/** Se crea al primer uso (en el navegador), nunca al importar. */
export function casosDeUsoCliente(): CasosDeUsoCliente {
  if (casos) return casos;

  let bandeja: BandejaSalida;
  let historial: HistorialLocal;
  if (typeof indexedDB !== "undefined") {
    const db = new BaseLocal();
    bandeja = new BandejaDexie(db);
    historial = new HistorialDexie(db);
  } else {
    // Navegador sin IndexedDB (raro): funciona, pero no guarda al cerrar.
    bandeja = new BandejaEnMemoria();
    historial = new HistorialEnMemoria();
  }

  casos = {
    realizarTest: new RealizarTest({
      pack: contentPack,
      reloj: new RelojSistema(),
      generadorId: new GeneradorUuid(),
      bandeja,
      historial,
    }),
    verHistorial: new VerHistorial(historial),
    sincronizar: new SincronizarPendientes(bandeja, new ClienteEnvioHttp()),
    bandeja,
  };
  return casos;
}
