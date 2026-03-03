import { BookingIntent, BookingSession } from '@barberbot/common';
import { Injectable, Logger } from '@nestjs/common';
import { IntentService, IntentServiceResult } from './intent.service';
import { OpenAiChatClient } from './openai-chat.client';
import { LLM_SYSTEM_PROMPT } from './prompt.constants';
import { RuleBasedIntentService } from './rule-based-intent.service';

interface LlmPayload {
  intent?: string;
  confidence?: number | null;
  bookingDraft?: {
    serviceType?: string | null;
    preferredDate?: string | null;
    preferredTime?: string | null;
    barber?: string | null;
  };
  reply?: string | null;
}

@Injectable()
export class LlmIntentService implements IntentService {
  private readonly logger = new Logger(LlmIntentService.name);

  constructor(
    private readonly openAiClient: OpenAiChatClient,
    private readonly fallbackIntentService: RuleBasedIntentService,
  ) {}

  async detectIntent(message: string, session: BookingSession): Promise<IntentServiceResult> {
    const userPrompt = this.buildUserPrompt(message, session);
    const raw = await this.openAiClient.complete(LLM_SYSTEM_PROMPT, userPrompt);

    if (!raw) {
      return this.withFallback(session, message, 'openai-disabled-or-error');
    }

    try {
      const payload = JSON.parse(raw) as LlmPayload;
      return this.mapPayload(payload);
    } catch (error) {
      this.logger.warn(`Invalid LLM JSON response: ${raw}`);
      return this.withFallback(session, message, 'invalid-json');
    }
  }

  private buildUserPrompt(message: string, session: BookingSession): string {
    return JSON.stringify(
      {
        task: 'Analyze user message and return strict JSON response according to schema.',
        userMessage: message,
        currentBookingDraft: {
          serviceType: session.draft.serviceType ?? null,
          preferredDate: session.draft.preferredDate ?? null,
          preferredTime: session.draft.preferredTime ?? null,
          barber: session.draft.barber ?? null,
        },
        note:
          'Prefer updating only missing or corrected fields in bookingDraft. Keep unchanged fields as they are when possible.',
      },
      null,
      2,
    );
  }

  private mapPayload(payload: LlmPayload): IntentServiceResult {
    return {
      intent: this.mapIntent(payload.intent),
      confidence: this.normalizeConfidence(payload.confidence),
      extracted: {
        serviceType: payload.bookingDraft?.serviceType ?? undefined,
        preferredDate: payload.bookingDraft?.preferredDate ?? undefined,
        preferredTime: payload.bookingDraft?.preferredTime ?? undefined,
        barber: payload.bookingDraft?.barber ?? undefined,
      },
      reply: payload.reply ?? undefined,
      source: 'llm',
    };
  }

  private normalizeConfidence(value?: number | null): number | undefined {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return undefined;
    }

    if (value >= 0 && value <= 1) {
      return value;
    }

    if (value > 1 && value <= 100) {
      return value / 100;
    }

    return undefined;
  }

  private mapIntent(intent?: string): BookingIntent {
    const normalized = intent?.toUpperCase().trim();
    switch (normalized) {
      case BookingIntent.GREETING:
        return BookingIntent.GREETING;
      case BookingIntent.PROVIDE_SERVICE:
        return BookingIntent.PROVIDE_SERVICE;
      case BookingIntent.PROVIDE_DATE:
        return BookingIntent.PROVIDE_DATE;
      case BookingIntent.PROVIDE_TIME:
        return BookingIntent.PROVIDE_TIME;
      case BookingIntent.CONFIRM_BOOKING:
        return BookingIntent.CONFIRM_BOOKING;
      case BookingIntent.CANCEL_BOOKING:
        return BookingIntent.CANCEL_BOOKING;
      default:
        return BookingIntent.UNKNOWN;
    }
  }

  private async withFallback(
    session: BookingSession,
    message: string,
    reason: string,
  ): Promise<IntentServiceResult> {
    this.logger.warn(`Using rule-based fallback (${reason}) for user ${session.userId}`);
    const result = await this.fallbackIntentService.detectIntent(message, session);
    return { ...result, source: 'rule' };
  }
}
