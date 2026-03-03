import { Injectable } from '@nestjs/common';
import { BookingSession } from '@barberbot/common';
import { TelegramButtonOption } from '../telegram/telegram.gateway';
import { ActionTokenService } from '../security/action-token.service';

@Injectable()
export class SlotSuggestionService {
  constructor(private readonly actionTokenService: ActionTokenService) {}

  createOptions(session: BookingSession): TelegramButtonOption[][] {
    const date = session.draft.preferredDate ?? this.todayIso();
    const baseTime = session.draft.preferredTime ?? '10:00';

    const candidateTimes = this.expandTimes(baseTime, 3);
    const slots = candidateTimes.map((time) => `${date} ${time}`);
    session.offeredSlots = slots;

    return [
      slots.map((slot, slotIndex) => {
        return {
          text: slot,
          callbackData: this.actionTokenService.createSlotSelectionToken(session.userId, slotIndex),
        };
      }),
    ];
  }

  private expandTimes(time: string, count: number): string[] {
    const [hoursRaw, minutesRaw] = time.split(':');
    const hours = Number(hoursRaw);
    const minutes = Number(minutesRaw);

    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
      return ['10:00', '10:30', '11:00'];
    }

    const baseMinutes = hours * 60 + minutes;
    return Array.from({ length: count }, (_, index) => this.formatMinutes(baseMinutes + index * 30));
  }

  private formatMinutes(total: number): string {
    const h = Math.floor(total / 60) % 24;
    const m = total % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  private todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }
}
