import { BookingIntent, BookingSession } from '@barberbot/common';

export interface IntentServiceResult {
  intent: BookingIntent;
  confidence?: number;
  extracted: {
    serviceType?: string;
    preferredDate?: string;
    preferredTime?: string;
    barber?: string;
  };
  reply?: string;
  source: 'llm' | 'rule';
}

export interface IntentService {
  detectIntent(message: string, session: BookingSession): Promise<IntentServiceResult>;
}
