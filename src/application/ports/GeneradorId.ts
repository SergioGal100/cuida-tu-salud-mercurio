/** Genera ids únicos (UUID). Se inyecta para que domain/application sean puros. */
export interface GeneradorId {
  nuevo(): string;
}
