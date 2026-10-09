export type TicketStatus = "AVAILABLE" | "RESERVED" | "SOLD";

export class Ticket {
  constructor(
    public readonly id: string,
    public readonly eventId: string,
    public status: TicketStatus,
    public userId: string | null = null,
    public reservedUntil: Date | null = null,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  public reserve(userId: string, durationMinutes: number = 15): void {
    if (this.status !== "AVAILABLE") {
      throw new Error("Ticket is not available for reservation");
    }
    this.status = "RESERVED";
    this.userId = userId;

    const expiration = new Date();
    expiration.setMinutes(expiration.getMinutes() + durationMinutes);
    this.reservedUntil = expiration;
    this.updatedAt = new Date();
  }

  public isReservationExpired(): boolean {
    if (this.status !== "RESERVED" || !this.reservedUntil) return false;
    return new Date() > this.reservedUntil;
  }
}
