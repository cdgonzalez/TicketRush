import { Given, When, Then, Before } from '@cucumber/cucumber';
import assert from 'assert';
import { Ticket } from '../../src/domain/entities/Ticket';
import { ReserveTicketUseCase } from '../../src/application/use-cases/ReserveTicketUseCase';
import { ITicketRepository } from '../../src/domain/repositories/ITicketRepository';
import { Pool, PoolClient } from 'pg';
import { ReserveTicketResponse } from '../../src/application/use-cases/dtos';

class InMemoryTicketRepository implements ITicketRepository<PoolClient> {
  public tickets: Ticket[] = [];
  public lockedCount = 0;
  public persistedUpdates = 0;

  async findAvailableAndLock(eventId: string, _client?: PoolClient): Promise<Ticket | null> {
    const ticket = this.tickets.find((t) => t.eventId === eventId && t.status === 'AVAILABLE');
    if (ticket) {
      this.lockedCount++;
      return ticket;
    }
    return null;
  }

  async update(ticket: Ticket, _client?: PoolClient): Promise<void> {
    const idx = this.tickets.findIndex((t) => t.id === ticket.id);
    if (idx !== -1) {
      this.tickets[idx] = ticket;
      this.persistedUpdates++;
    }
  }

  async releaseExpiredReservations(_client?: PoolClient): Promise<number> {
    return 0;
  }
}

let repository: InMemoryTicketRepository;
let useCase: ReserveTicketUseCase;
let currentUser: string | null = null;
let reservationResponse: ReserveTicketResponse | null = null;
let reservationError: Error | null = null;
let reservedTicket: Ticket | null = null;

const dummyPool = {
  connect: async () =>
    ({
      query: async () => ({ rows: [] }),
      release: () => {},
    }) as unknown as PoolClient,
} as unknown as Pool;

Before(() => {
  repository = new InMemoryTicketRepository();
  useCase = new ReserveTicketUseCase(repository, dummyPool);
  currentUser = null;
  reservationResponse = null;
  reservationError = null;
  reservedTicket = null;
});

Given('an event with ID {string} has available tickets', function (eventId: string) {
  repository.tickets.push(
    new Ticket('ticket-101', eventId, 'AVAILABLE', null, null, new Date(), new Date())
  );
});

Given('the user {string} is authenticated', function (userId: string) {
  currentUser = userId;
});

Given('an event with ID {string} has {int} available tickets', function (_eventId: string, count: number) {
  assert.strictEqual(count, 0);
  repository.tickets = [];
});

When('the user requests to reserve a ticket for {string}', async function (eventId: string) {
  assert.ok(currentUser, 'User should be authenticated');
  try {
    reservationResponse = await useCase.execute({
      eventId,
      userId: currentUser,
    });
    reservedTicket = repository.tickets.find((t) => t.id === reservationResponse?.ticketId) || null;
  } catch (err: any) {
    reservationError = err;
  }
});

When(
  'the user {string} requests to reserve a ticket for {string}',
  async function (userId: string, eventId: string) {
    try {
      reservationResponse = await useCase.execute({
        eventId,
        userId,
      });
      reservedTicket = repository.tickets.find((t) => t.id === reservationResponse?.ticketId) || null;
    } catch (err: any) {
      reservationError = err;
    }
  }
);

Then('the system should lock {int} available ticket', function (count: number) {
  assert.strictEqual(repository.lockedCount, count);
});

Then('the ticket status should change to {string}', function (expectedStatus: string) {
  assert.ok(reservedTicket, 'Expected a reserved ticket');
  assert.strictEqual(reservedTicket.status, expectedStatus);
});

Then('the ticket should be reserved for {int} minutes', function (durationMinutes: number) {
  assert.ok(reservedTicket?.reservedUntil, 'reservedUntil should be set');
  const durationMs = reservedTicket.reservedUntil.getTime() - Date.now();
  const minutes = Math.round(durationMs / 60000);
  assert.strictEqual(minutes, durationMinutes);
});

Then('the system should return the reservation details', function () {
  assert.ok(reservationResponse, 'Expected reservation response');
  assert.ok(reservationResponse.ticketId);
  assert.ok(reservationResponse.reservedUntil);
});

Then('the system should throw an {string} error', function (errorMessage: string) {
  assert.ok(reservationError, 'Expected an error to be thrown');
  if (errorMessage.toLowerCase().includes('sold out')) {
    assert.strictEqual(reservationError.message, 'SOLD_OUT');
  } else {
    assert.ok(reservationError.message.includes(errorMessage));
  }
});

Then('no changes should be persisted to the database', function () {
  assert.strictEqual(repository.persistedUpdates, 0);
});

