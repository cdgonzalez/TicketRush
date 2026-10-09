import { Ticket } from "../entities/Ticket";

export interface ITicketRepository<TContext = any> {
  /**
   * Busca un boleto disponible y aplica un bloqueo pesimista (FOR UPDATE SKIP LOCKED).
   * Si no hay boletos, retorna null.
   */
  findAvailableAndLock(
    eventId: string,
    context?: TContext,
  ): Promise<Ticket | null>;

  /**
   * Persiste los cambios del boleto (ej. cambio de estado a RESERVED).
   */
  update(ticket: Ticket, context?: TContext): Promise<void>;

  /**
   * Libera los boletos cuya reserva haya expirado.
   */
  releaseExpiredReservations(context?: TContext): Promise<number>;
}
