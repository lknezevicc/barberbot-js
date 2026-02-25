import { DomainEvent } from "./domain-event";

export class UserMessageEvent extends DomainEvent {
  eventName = "user.message";

  constructor(
    public readonly userId: number,
    public readonly chatId: number,
    public readonly text: string,
    occurredAt: Date,
  ) {
    super(occurredAt);
  }
}
