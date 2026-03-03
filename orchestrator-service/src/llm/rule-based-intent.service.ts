import { BookingIntent, BookingSession } from '@barberbot/common';
import { Injectable } from '@nestjs/common';
import { IntentService, IntentServiceResult } from './intent.service';

@Injectable()
export class RuleBasedIntentService implements IntentService {
  async detectIntent(message: string, _session: BookingSession): Promise<IntentServiceResult> {
    const normalized = message.toLowerCase();

    if (/(otkaži|cancel|stop)/.test(normalized)) {
      return {
        intent: BookingIntent.CANCEL_BOOKING,
        extracted: {},
        reply: 'U redu, otkazujem trenutni proces rezervacije.',
        source: 'rule',
      };
    }

    if (/(potvrđujem|potvrdjujem|confirm|da može)/.test(normalized)) {
      return {
        intent: BookingIntent.CONFIRM_BOOKING,
        extracted: {},
        source: 'rule',
      };
    }

    const extracted: IntentServiceResult['extracted'] = {};

    if (/(brada)/.test(normalized) && /(šiš|sis)/.test(normalized)) {
      extracted.serviceType = 'šišanje + brada';
    } else if (/(brada)/.test(normalized)) {
      extracted.serviceType = 'brada';
    } else if (/(šiš|sis)/.test(normalized)) {
      extracted.serviceType = 'šišanje';
    }

    const dateMatch = normalized.match(/\b\d{1,2}\.\d{1,2}\.\d{2,4}\b/);
    if (dateMatch?.[0]) {
      extracted.preferredDate = dateMatch[0];
    }

    const timeMatch = normalized.match(/\b([01]?\d|2[0-3]):[0-5]\d\b/);
    if (timeMatch?.[0]) {
      extracted.preferredTime = timeMatch[0];
    }

    const barberMatch = normalized.match(/(?:kod|barber|frizer)\s+([a-zčćžšđ]+)/i);
    if (barberMatch?.[1]) {
      extracted.barber = barberMatch[1];
    }

    let intent = BookingIntent.UNKNOWN;
    if (extracted.serviceType) {
      intent = BookingIntent.PROVIDE_SERVICE;
    }
    if (extracted.preferredDate) {
      intent = BookingIntent.PROVIDE_DATE;
    }
    if (extracted.preferredTime) {
      intent = BookingIntent.PROVIDE_TIME;
    }
    if (intent === BookingIntent.UNKNOWN && /(bok|pozdrav|hello|hej)/.test(normalized)) {
      intent = BookingIntent.GREETING;
    }

    const reply = intent === BookingIntent.GREETING
      ? 'Bok! Napiši što želiš rezervirati i okvirno kada.'
      : undefined;

    return { intent, extracted, reply, source: 'rule' };
  }
}
