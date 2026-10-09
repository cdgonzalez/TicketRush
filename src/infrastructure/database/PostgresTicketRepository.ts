import { Pool, PoolClient } from "pg";
import { ITicketRepository } from "../../domain/repositories/ITicketRepository";
import { Ticket } from "../../domain/entities/Ticket";

export class PostgresTicketRepository implements ITicketRepository<PoolClient> {
  constructor(private readonly pool: Pool) {}

  // Se ejecuta dentro de un callback para garantizar que el SELECT y UPDATE
  // compartan el mismo PoolClient (misma transacción).
  async findAvailableAndLock(
    eventId: string,
    client?: PoolClient,
  ): Promise<Ticket | null> {
    const executor = client ?? this.pool;
    const query = `
      SELECT id, event_id, status, user_id, reserved_until, created_at, updated_at 
      FROM tickets 
      WHERE event_id = $1 AND status = 'AVAILABLE' 
      LIMIT 1 
      FOR UPDATE SKIP LOCKED
    `;
    const result = await executor.query(query, [eventId]);

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return new Ticket(
      row.id,
      row.event_id,
      row.status,
      row.user_id,
      row.reserved_until,
      row.created_at,
      row.updated_at,
    );
  }

  async update(ticket: Ticket, client?: PoolClient): Promise<void> {
    const executor = client ?? this.pool;
    const query = `
      UPDATE tickets 
      SET status = $1, user_id = $2, reserved_until = $3, updated_at = NOW() 
      WHERE id = $4
    `;
    await executor.query(query, [
      ticket.status,
      ticket.userId,
      ticket.reservedUntil,
      ticket.id,
    ]);
  }

  async releaseExpiredReservations(client?: PoolClient): Promise<number> {
    const executor = client ?? this.pool;
    const query = `
      UPDATE tickets 
      SET status = 'AVAILABLE', user_id = NULL, reserved_until = NULL, updated_at = NOW() 
      WHERE status = 'RESERVED' AND reserved_until < NOW()
    `;
    const result = await executor.query(query);
    return result.rowCount ?? 0;
  }
}
