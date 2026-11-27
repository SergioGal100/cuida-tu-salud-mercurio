import type { AlertaNueva, FilaVigilancia } from "@/domain/vigilancia";

export interface AlertaAbierta extends AlertaNueva {
  id: string;
  creadaEn: string;
}

/** Lectura agregable de evaluaciones y escritura de alertas (sin datos personales). */
export interface VigilanciaRepository {
  /** Evaluaciones creadas en [desde, hasta]. */
  filasEntre(desde: Date, hasta: Date): Promise<FilaVigilancia[]>;
  /** Cierra las alertas abiertas y deja abiertas solo las nuevas. */
  reemplazarAlertasAbiertas(alertas: AlertaNueva[]): Promise<void>;
  alertasAbiertas(): Promise<AlertaAbierta[]>;
}
