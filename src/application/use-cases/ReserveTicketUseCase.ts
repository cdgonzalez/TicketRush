import { Pool, PoolClient } from "pg";
import { ITicketRepository } from "../../domain/repositories/ITicketRepository";
import { ReserveTicketRequest, ReserveTicketResponse } from "./dtos";

export class ReserveTicketUseCase {
  constructor(
    private readonly ticketRepository: ITicketRepository<PoolClient>,
    private readonly dbPool: Pool, // Unit of Work simplificado
  ) {}

  async execute(request: ReserveTicketRequest): Promise<ReserveTicketResponse> {
    const client = await this.dbPool.connect();

    try {
      await client.query("BEGIN");

      const ticket = await this.ticketRepository.findAvailableAndLock(
        request.eventId,
        client,
      );
      if (!ticket) {
        throw new Error("SOLD_OUT");
      }

      ticket.reserve(request.userId);
      await this.ticketRepository.update(ticket, client);

      await client.query("COMMIT");

      return {
        ticketId: ticket.id,
        reservedUntil: ticket.reservedUntil as Date,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
