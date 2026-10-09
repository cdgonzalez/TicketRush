export interface ReserveTicketRequest {
  eventId: string;
  userId: string;
}

export interface ReserveTicketResponse {
  ticketId: string;
  reservedUntil: Date;
}
