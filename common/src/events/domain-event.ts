export abstract class DomainEvent {
  abstract readonly eventName: string;
  public readonly occurredAt: Date;

  constructor(occurredAt: Date) {
    this.occurredAt = occurredAt;
  }
}
