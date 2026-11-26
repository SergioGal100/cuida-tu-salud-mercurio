import type {
  Consulta,
  Conducta,
  EstadoConsulta,
  ExamenFisico,
  LaboratorioRegistrado,
  ResumenConsulta,
} from "@/domain/consulta/Consulta";
import type { NivelId } from "@/domain/contenido/ContentPack";
import type { EvaluacionRecibida } from "@/domain/evaluacion/EvaluacionRecibida";

export interface FiltrosCasos {
  estado?: EstadoConsulta;
  nivel?: NivelId;
}

export interface CambiosFicha {
  examen?: ExamenFisico;
  conducta?: Conducta | null;
  estado?: EstadoConsulta;
}

/** Toda lectura y escritura filtra por establecimiento: un médico solo ve los suyos. */
export interface ConsultaRepository {
  crearConEvaluacion(datos: {
    evaluacion: EvaluacionRecibida;
    establecimientoId: string;
    usuarioId: string;
  }): Promise<string>;
  obtener(id: string, establecimientoId: string): Promise<Consulta | null>;
  actualizarFicha(id: string, establecimientoId: string, cambios: CambiosFicha): Promise<boolean>;
  agregarLaboratorio(
    consultaId: string,
    lab: Omit<LaboratorioRegistrado, "id" | "creadoEn">,
    nivelFinal: NivelId,
  ): Promise<void>;
  listar(establecimientoId: string, filtros: FiltrosCasos): Promise<ResumenConsulta[]>;
}
