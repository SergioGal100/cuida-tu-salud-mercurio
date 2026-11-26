import type { ContentPack } from "@/domain/contenido/ContentPack";
import { origenDesdeRespuestas, type Evaluacion } from "@/domain/evaluacion/Evaluacion";
import { limpiarRespuestas } from "@/domain/evaluacion/flujo";
import { evaluar } from "@/domain/scoring";
import type { Respuestas } from "@/domain/scoring";
import type { BandejaSalida } from "../../ports/BandejaSalida";
import type { GeneradorId } from "../../ports/GeneradorId";
import type { HistorialLocal } from "../../ports/HistorialLocal";
import type { Reloj } from "../../ports/Reloj";

export interface DependenciasRealizarTest {
  pack: ContentPack;
  reloj: Reloj;
  generadorId: GeneradorId;
  bandeja: BandejaSalida;
  historial: HistorialLocal;
}

/**
 * Evalúa el test, lo deja en la bandeja de salida (se envía solo y sin nombre)
 * y, salvo en modo promotor, lo guarda en el historial del celular.
 */
export class RealizarTest {
  constructor(private readonly deps: DependenciasRealizarTest) {}

  async ejecutar(respuestasCrudas: Respuestas): Promise<Evaluacion> {
    const { pack, reloj, generadorId, bandeja, historial } = this.deps;
    const respuestas = limpiarRespuestas(pack, respuestasCrudas);
    const evaluacion: Evaluacion = {
      id: generadorId.nuevo(),
      origen: origenDesdeRespuestas(respuestas),
      creadaEn: reloj.ahora().toISOString(),
      versionPack: pack.version,
      respuestas,
      resultado: evaluar(respuestas, pack),
    };

    await bandeja.agregar(evaluacion);
    if (evaluacion.origen !== "PROMOTOR") await historial.guardar(evaluacion);
    return evaluacion;
  }
}
