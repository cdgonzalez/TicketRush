import { Pool, PoolClient } from 'pg';
import { ReserveTicketUseCase } from '../../src/application/use-cases/ReserveTicketUseCase';
import { ITicketRepository } from '../../src/domain/repositories/ITicketRepository';
import { Ticket } from '../../src/domain/entities/Ticket';

describe('ReserveTicketUseCase', () => {
  let mockClient: jest.Mocked<Partial<PoolClient>>;
  let mockPool: jest.Mocked<Partial<Pool>>;
  let mockRepository: jest.Mocked<ITicketRepository<PoolClient>>;
  let useCase: ReserveTicketUseCase;

  beforeEach(() => {
    mockClient = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn(),
    };

    mockPool = {
      connect: jest.fn().mockResolvedValue(mockClient as PoolClient),
    };

    mockRepository = {
      findAvailableAndLock: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
      releaseExpiredReservations: jest.fn().mockResolvedValue(0),
    };

    useCase = new ReserveTicketUseCase(
      mockRepository as ITicketRepository<PoolClient>,
      mockPool as Pool
    );
  });

  it('should successfully reserve an available ticket in a transaction', async () => {
    const existingTicket = new Ticket(
      'ticket-1',
      'event-100',
      'AVAILABLE',
      null,
      null,
      new Date(),
      new Date()
    );

    mockRepository.findAvailableAndLock.mockResolvedValue(existingTicket);

    const result = await useCase.execute({
      eventId: 'event-100',
      userId: 'user-42',
    });

    expect(mockPool.connect).toHaveBeenCalled();
    expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
    expect(mockRepository.findAvailableAndLock).toHaveBeenCalledWith('event-100', mockClient);
    expect(existingTicket.status).toBe('RESERVED');
    expect(existingTicket.userId).toBe('user-42');
    expect(mockRepository.update).toHaveBeenCalledWith(existingTicket, mockClient);
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    expect(mockClient.release).toHaveBeenCalled();
    expect(result.ticketId).toBe('ticket-1');
    expect(result.reservedUntil).toBeInstanceOf(Date);
  });

  it('should rollback transaction and throw error if no ticket is available', async () => {
    mockRepository.findAvailableAndLock.mockResolvedValue(null);

    await expect(
      useCase.execute({
        eventId: 'event-100',
        userId: 'user-42',
      })
    ).rejects.toThrow('SOLD_OUT');

    expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    expect(mockClient.release).toHaveBeenCalled();
  });

  it('should rollback and release client on unexpected repository error', async () => {
    mockRepository.findAvailableAndLock.mockRejectedValue(new Error('DB_CONN_ERROR'));

    await expect(
      useCase.execute({
        eventId: 'event-100',
        userId: 'user-42',
      })
    ).rejects.toThrow('DB_CONN_ERROR');

    expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    expect(mockClient.release).toHaveBeenCalled();
  });
});

