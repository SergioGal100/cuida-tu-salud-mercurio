import type { Atencion } from "@/domain/consulta/Consulta";
import type { ContentPack } from "@/domain/contenido/ContentPack";
import { MUNICIPIO_NO_DICE } from "@/domain/contenido/Municipio";
import { limpiarRespuestas } from "@/domain/evaluacion/flujo";
import { evaluar } from "@/domain/scoring";
import type { Respuestas } from "@/domain/scoring";
import type { ConsultaRepository } from "../../ports/ConsultaRepository";
import type { GeneradorId } from "../../ports/GeneradorId";
import type { Reloj } from "../../ports/Reloj";

/** El médico hace el cuestionario en modo entrevista: evaluación POSTA + consulta. */
export class RegistrarConsulta {
  constructor(
    private readonly deps: {
      pack: ContentPack;
      municipiosValidos: Set<string>;
      repo: ConsultaRepository;
      reloj: Reloj;
      generadorId: GeneradorId;
    },
  ) {}

  async ejecutar(respuestasCrudas: Respuestas, atencion: Atencion): Promise<string> {
    const { pack, municipiosValidos, repo, reloj, generadorId } = this.deps;
    const respuestas = limpiarRespuestas(pack, respuestasCrudas);
    const resultado = evaluar(respuestas, pack);
    const ctx = respuestas.contexto ?? {};
    const municipio = ctx.municipio;
    return repo.crearConEvaluacion({
      evaluacion: {
        id: generadorId.nuevo(),
        origen: "POSTA",
        creadaEnDispositivo: reloj.ahora().toISOString(),
        municipioCodigo:
          municipio && municipio !== MUNICIPIO_NO_DICE && municipiosValidos.has(municipio) ? municipio : null,
        rangoEdad: ctx.rangoEdad ?? null,
        sexo: ctx.sexo ?? null,
        embarazoLactancia: ctx.embarazoLactancia ?? null,
        ninosEnCasa: ctx.ninosEnCasa ?? null,
        respuestas,
        resultado,
        versionPack: pack.version,
        discrepancia: false,
      },
      ...atencion,
    });
  }
}
