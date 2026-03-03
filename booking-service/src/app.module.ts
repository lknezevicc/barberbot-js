import { Module } from '@nestjs/common';
import { RabbitModule } from '@barberbot/common';
import { BookingConsumerService } from './booking/booking-consumer.service';
import { SupabaseBookingRepository } from './booking/supabase-booking.repository';

@Module({
  imports: [RabbitModule],
  providers: [BookingConsumerService, SupabaseBookingRepository],
})
export class AppModule {}
