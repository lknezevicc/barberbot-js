import { BookingConfirmedEvent, RABBITMQ } from '@barberbot/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable, Logger } from '@nestjs/common';
import { SupabaseBookingRepository } from './supabase-booking.repository';

@Injectable()
export class BookingConsumerService {
  private readonly logger = new Logger(BookingConsumerService.name);

  constructor(private readonly repository: SupabaseBookingRepository) {}

  @RabbitSubscribe({
    exchange: RABBITMQ.exchange,
    routingKey: RABBITMQ.bookingConfirmedRoutingKey,
    queue: RABBITMQ.bookingConfirmedQueue,
  })
  async onBookingConfirmed(event: BookingConfirmedEvent): Promise<void> {
    await this.repository.saveConfirmedBooking(event);
    this.logger.log(`Persisted booking for user=${event.userId}, slot=${event.slot}`);
  }
}
