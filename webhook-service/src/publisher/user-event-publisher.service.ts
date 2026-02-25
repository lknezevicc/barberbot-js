import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventPublisher, RABBITMQ, retry, UserMessageEvent } from '@barberbot/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class UserEventPublisher implements EventPublisher {

  private readonly logger = new Logger(UserEventPublisher.name);

  constructor(
    @Inject('RABBIT_CONFIG')
    private readonly config: typeof RABBITMQ,
    private readonly amqp: AmqpConnection
  ) {}

  async publish(event: UserMessageEvent): Promise<void> {
    try {
      await retry(
        () => this.amqp.publish(
          this.config.exchange,
          this.config.userMessageRoutingKey, 
          event
        ),
      );

      this.logger.log(`Published event ${event.eventName} for user ${event.userId}`);
    } catch (err) {
      this.logger.error('Failed to publish, pushing to DLQ', err);
      await this.publishToDlq(event);
    }
  }

  async publishToDlq(event: UserMessageEvent): Promise<void> {
    const dlqRoutingKey = `${this.config.userMessageRoutingKey}${this.config.dlqSuffix}`;
    try {
      await this.amqp.publish(
        this.config.exchange,
        dlqRoutingKey,
        event
      );
      this.logger.log(`Published event "${event.eventName}" for user ${event.userId} to DLQ "${dlqRoutingKey}"`);
    } catch (err) {
      this.logger.error(`Failed to publish event "${event.eventName}" to DLQ "${dlqRoutingKey}"`, err);
    }
  }

}
