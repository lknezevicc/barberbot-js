import { BookingIntent } from '../intents/booking-intent.enum';

export interface BookingDraft {
  serviceType?: string;
  preferredDate?: string;
  preferredTime?: string;
  barber?: string;
}

export interface BookingSession {
  userId: number;
  chatId: number;
  draft: BookingDraft;
  offeredSlots?: string[];
  lastIntent: BookingIntent;
  lockExpiresAt?: string;
  proposedSlot?: string;
  createdAt: string;
  updatedAt: string;
}

export function isBookingDraftComplete(draft: BookingDraft): boolean {
  return Boolean(draft.serviceType && draft.preferredDate && draft.preferredTime && draft.barber);
}

export function missingDraftFields(draft: BookingDraft): Array<keyof BookingDraft> {
  const missing: Array<keyof BookingDraft> = [];

  if (!draft.serviceType) {
    missing.push('serviceType');
  }

  if (!draft.preferredDate) {
    missing.push('preferredDate');
  }

  if (!draft.preferredTime) {
    missing.push('preferredTime');
  }

  if (!draft.barber) {
    missing.push('barber');
  }

  return missing;
}
