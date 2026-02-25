import { DomainEvent } from "../events/domain-event";

export interface EventPublisher<T extends DomainEvent = DomainEvent> {
  publish(event: T): Promise<void>;
  publishToDlq?(event: T): Promise<void>;
}