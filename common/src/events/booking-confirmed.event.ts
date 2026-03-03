import { DomainEvent } from './domain-event';

export class BookingConfirmedEvent extends DomainEvent {
  eventName = 'booking.confirmed';

  constructor(
    public readonly userId: number,
    public readonly chatId: number,
    public readonly serviceType: string,
    public readonly slot: string,
    public readonly barber?: string,
    occurredAt: Date = new Date(),
  ) {
    super(occurredAt);
  }
}
