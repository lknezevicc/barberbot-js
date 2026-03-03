import { BookingConfirmedEvent, RABBITMQ } from '@barberbot/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class BookingEventPublisherService {
  private readonly logger = new Logger(BookingEventPublisherService.name);

  constructor(private readonly amqp: AmqpConnection) {}

  async publishBookingConfirmed(event: BookingConfirmedEvent): Promise<void> {
    await this.amqp.publish(
      RABBITMQ.exchange,
      RABBITMQ.bookingConfirmedRoutingKey,
      event,
    );

    this.logger.log(`Published booking.confirmed for user=${event.userId}, slot=${event.slot}`);
  }
}
