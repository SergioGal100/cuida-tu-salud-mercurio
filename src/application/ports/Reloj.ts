/** Fuente de la hora actual. Se inyecta para que domain/application sean puros. */
export interface Reloj {
  ahora(): Date;
}
