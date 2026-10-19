import { Ticket } from '../../src/domain/entities/Ticket';

describe('Ticket Entity', () => {
  it('should successfully reserve an available ticket', () => {
    const ticket = new Ticket('1', 'event-1', 'AVAILABLE', null, null, new Date(), new Date());
    ticket.reserve('user-1', 15);
    
    expect(ticket.status).toBe('RESERVED');
    expect(ticket.userId).toBe('user-1');
    expect(ticket.reservedUntil?.getTime()).toBeGreaterThan(new Date().getTime());
  });

  it('should throw an error when trying to reserve a sold ticket', () => {
    const ticket = new Ticket('1', 'event-1', 'SOLD', 'user-2', null, new Date(), new Date());
    
    expect(() => ticket.reserve('user-1')).toThrow('Ticket is not available for reservation');
  });

  it('should throw an error when trying to reserve an already reserved ticket', () => {
    const ticket = new Ticket('1', 'event-1', 'RESERVED', 'user-2', new Date(), new Date(), new Date());
    
    expect(() => ticket.reserve('user-1')).toThrow('Ticket is not available for reservation');
  });

  it('should correctly determine if reservation is expired', () => {
    const pastDate = new Date(Date.now() - 60000);
    const futureDate = new Date(Date.now() + 60000);

    const expiredTicket = new Ticket('1', 'event-1', 'RESERVED', 'user-1', pastDate, new Date(), new Date());
    expect(expiredTicket.isReservationExpired()).toBe(true);

    const activeTicket = new Ticket('2', 'event-1', 'RESERVED', 'user-1', futureDate, new Date(), new Date());
    expect(activeTicket.isReservationExpired()).toBe(false);

    const availableTicket = new Ticket('3', 'event-1', 'AVAILABLE', null, null, new Date(), new Date());
    expect(availableTicket.isReservationExpired()).toBe(false);

    const ticketWithoutReservedUntil = new Ticket('4', 'event-1', 'RESERVED', 'user-1', null, new Date(), new Date());
    expect(ticketWithoutReservedUntil.isReservationExpired()).toBe(false);
  });
});