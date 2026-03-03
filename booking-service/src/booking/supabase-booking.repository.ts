import { BookingConfirmedEvent } from '@barberbot/common';
import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseBookingRepository {
  private readonly logger = new Logger(SupabaseBookingRepository.name);
  private readonly client: SupabaseClient | null;
  private readonly tableName = process.env.SUPABASE_BOOKINGS_TABLE ?? 'bookings';

  constructor() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      this.client = null;
      this.logger.warn('Supabase env vars are missing; booking persistence disabled');
      return;
    }

    this.client = createClient(url, key);
  }

  async saveConfirmedBooking(event: BookingConfirmedEvent): Promise<void> {
    if (!this.client) {
      this.logger.warn(`Skipping persist for user=${event.userId}, slot=${event.slot}`);
      return;
    }

    const confirmedAt = this.resolveConfirmedAt(event.occurredAt);

    const payload = {
      user_id: event.userId,
      chat_id: event.chatId,
      service_type: event.serviceType,
      slot: event.slot,
      barber: event.barber ?? null,
      confirmed_at: confirmedAt,
    };

    const { error } = await this.client.from(this.tableName).insert(payload);
    if (error) {
      throw new Error(`Supabase insert failed: ${error.message}`);
    }
  }

  private resolveConfirmedAt(value: unknown): string {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toISOString();
    }

    if (typeof value === 'string') {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }

    this.logger.warn('Invalid or missing occurredAt in booking event, using current timestamp');
    return new Date().toISOString();
  }
}
