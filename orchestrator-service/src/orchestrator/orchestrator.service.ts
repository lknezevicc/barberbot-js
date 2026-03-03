import {
  BookingConfirmedEvent,
  BookingIntent,
  BookingSession,
  isBookingDraftComplete,
  missingDraftFields,
  RABBITMQ,
  UserMessageEvent,
} from '@barberbot/common';

import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { IntentService, IntentServiceResult } from '../llm/intent.service';
import { SlotLockService } from '../locks/slot-lock.service';
import { ActionTokenService } from '../security/action-token.service';
import { PromptInjectionGuardService } from '../security/prompt-injection-guard.service';
import type { SessionStore } from '../session/session.store';
import { TelegramButtonOption, type TelegramGateway } from '../telegram/telegram.gateway';
import { BookingEventPublisherService } from './booking-event-publisher.service';
import { SlotSuggestionService } from './slot-suggestion.service';
import { UserSerialExecutorService } from './user-serial-executor.service';

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);
  private readonly lockSeconds = Number(process.env.BOOKING_LOCK_SECONDS ?? 180);
  private readonly sessionTtlSeconds = Number(process.env.SESSION_TTL_SECONDS ?? 900);
  private readonly minLlmConfidence = Number(process.env.LLM_MIN_CONFIDENCE ?? 0.65);

  constructor(
    @Inject('IntentService')
    private readonly intentService: IntentService,
    @Inject('SessionStore')
    private readonly sessionStore: SessionStore,
    @Inject('TelegramGateway')
    private readonly telegramGateway: TelegramGateway,
    private readonly slotLockService: SlotLockService,
    private readonly userSerialExecutor: UserSerialExecutorService,
    private readonly slotSuggestionService: SlotSuggestionService,
    private readonly bookingEventPublisher: BookingEventPublisherService,
    private readonly actionTokenService: ActionTokenService,
    private readonly promptInjectionGuard: PromptInjectionGuardService,
  ) {}

  @RabbitSubscribe({
    exchange: RABBITMQ.exchange,
    routingKey: RABBITMQ.userMessageRoutingKey,
    queue: RABBITMQ.userMessageQueue,
    queueOptions: {
      arguments: {
        'x-single-active-consumer': true,
      },
    },
  })
  async onUserMessage(event: UserMessageEvent): Promise<void> {
    await this.userSerialExecutor.run(String(event.userId), async () => {
      await this.processUserMessage(event);
    });
  }

  private async processUserMessage(event: UserMessageEvent): Promise<void> {
    const session = await this.getOrCreateSession(event);
    await this.sessionStore.refresh(event.userId, this.sessionTtlSeconds);

    if (this.isSlotSelection(event.text)) {
      await this.handleSlotSelection(session, event.text);
      return;
    }

    if (this.promptInjectionGuard.shouldReject(event.text)) {
      await this.telegramGateway.sendMessage(session.chatId, this.promptInjectionGuard.rejectionMessage());
      session.updatedAt = new Date().toISOString();
      await this.sessionStore.set(session, this.sessionTtlSeconds);
      return;
    }

    const intentResult = await this.intentService.detectIntent(event.text, session);

    if (this.shouldAskClarification(intentResult)) {
      session.lastIntent = intentResult.intent;
      session.updatedAt = new Date().toISOString();
      await this.sessionStore.set(session, this.sessionTtlSeconds);

      await this.telegramGateway.sendMessage(
        session.chatId,
        this.buildLowConfidenceReply(intentResult),
      );

      this.logger.warn(
        `Low-confidence LLM result for user ${session.userId}: ${intentResult.confidence}`,
      );
      return;
    }

    this.applyIntentResult(session, intentResult);
    session.updatedAt = new Date().toISOString();

    const reply = await this.buildReply(session, intentResult);

    await this.sessionStore.set(session, this.sessionTtlSeconds);
    await this.telegramGateway.sendMessage(session.chatId, reply.text, reply.options);

    this.logger.log(
      `Processed user ${session.userId} with intent ${intentResult.intent} (${intentResult.source})`,
    );
  }

  private async getOrCreateSession(event: UserMessageEvent): Promise<BookingSession> {
    const existing = await this.sessionStore.get(event.userId);
    if (existing) {
      return existing;
    }

    const now = new Date().toISOString();
    return {
      userId: event.userId,
      chatId: event.chatId,
      draft: {},
      lastIntent: BookingIntent.UNKNOWN,
      createdAt: now,
      updatedAt: now,
    };
  }

  private applyIntentResult(session: BookingSession, intentResult: IntentServiceResult): void {
    session.lastIntent = intentResult.intent;

    if (intentResult.extracted.serviceType) {
      session.draft.serviceType = intentResult.extracted.serviceType;
    }

    if (intentResult.extracted.preferredDate) {
      session.draft.preferredDate = intentResult.extracted.preferredDate;
    }

    if (intentResult.extracted.preferredTime) {
      session.draft.preferredTime = intentResult.extracted.preferredTime;
    }

    if (intentResult.extracted.barber) {
      session.draft.barber = intentResult.extracted.barber;
    }
  }

  private async buildReply(
    session: BookingSession,
    intentResult: IntentServiceResult,
  ): Promise<{ text: string; options?: TelegramButtonOption[][] }> {
    const intent = intentResult.intent;

    if (intent === BookingIntent.CANCEL_BOOKING) {
      if (session.proposedSlot) {
        await this.slotLockService.unlock(session.proposedSlot, String(session.userId));
      }
      session.proposedSlot = undefined;
      session.lockExpiresAt = undefined;
      session.offeredSlots = undefined;
      session.draft = {};
      return { text: 'Rezervacija je otkazana. Ako želiš, možemo krenuti ispočetka.' };
    }

    if (isBookingDraftComplete(session.draft)) {
      if (intent === BookingIntent.CONFIRM_BOOKING && this.isLockActive(session.lockExpiresAt)) {
        return this.confirmBooking(session);
      }

      return this.offerSlots(session);
    }

    if (intentResult.reply?.trim()) {
      return { text: intentResult.reply.trim() };
    }

    const missing = missingDraftFields(session.draft);
    const labels: Record<string, string> = {
      serviceType: 'uslugu (npr. šišanje, šišanje + brada)',
      preferredDate: 'datum termina',
      preferredTime: 'vrijeme termina',
      barber: 'ime frizera (barbera)',
    };

    const fieldsText = missing.map((field) => labels[field]).join(', ');
    return { text: `Odlično, reci mi još: ${fieldsText}.` };
  }

  private async offerSlots(
    session: BookingSession,
  ): Promise<{ text: string; options?: TelegramButtonOption[][] }> {
    if (this.isLockActive(session.lockExpiresAt) && session.proposedSlot) {
      return {
        text: `Termin ${session.proposedSlot} je i dalje rezerviran za tebe. Pošalji potvrdu unutar 3 minute.`,
      };
    }

    return {
      text: 'Našao sam više termina. Odaberi jedan od ponuđenih:',
      options: this.slotSuggestionService.createOptions(session),
    };
  }

  private async confirmBooking(
    session: BookingSession,
  ): Promise<{ text: string; options?: TelegramButtonOption[][] }> {
    const slot = session.proposedSlot;
    const serviceType = session.draft.serviceType;
    const barber = session.draft.barber;

    if (slot) {
      await this.slotLockService.unlock(slot, String(session.userId));

      if (serviceType) {
        await this.bookingEventPublisher.publishBookingConfirmed(
          new BookingConfirmedEvent(
            session.userId,
            session.chatId,
            serviceType,
            slot,
            barber,
            new Date(),
          ),
        );
      }
    }

    session.lockExpiresAt = undefined;
    session.proposedSlot = undefined;
    session.offeredSlots = undefined;
    session.draft = {};

    return { text: `Super, rezervacija za ${slot} je potvrđena i upisana.` };
  }

  private isSlotSelection(text: string): boolean {
    return text.startsWith('a:sl:');
  }

  private async handleSlotSelection(session: BookingSession, text: string): Promise<void> {
    const parsed = this.actionTokenService.verifySlotSelectionToken(text, session.userId);
    if (!parsed) {
      await this.telegramGateway.sendMessage(
        session.chatId,
        'Odabir termina je istekao ili nije valjan. Pošalji ponovo upit za termin.',
      );
      return;
    }

    const slot = session.offeredSlots?.[parsed.slotIndex];
    if (!slot) {
      await this.telegramGateway.sendMessage(
        session.chatId,
        'Ta opcija termina više nije dostupna. Poslat ću nove prijedloge.',
        this.slotSuggestionService.createOptions(session),
      );
      return;
    }

    const locked = await this.slotLockService.tryLock(slot, String(session.userId), this.lockSeconds);
    if (!locked) {
      await this.telegramGateway.sendMessage(
        session.chatId,
        `Termin ${slot} je upravo zauzet. Evo novih opcija:`,
        this.slotSuggestionService.createOptions(session),
      );
      return;
    }

    if (session.proposedSlot && session.proposedSlot !== slot) {
      await this.slotLockService.unlock(session.proposedSlot, String(session.userId));
    }

    session.proposedSlot = slot;
    session.lockExpiresAt = new Date(Date.now() + this.lockSeconds * 1000).toISOString();
    session.updatedAt = new Date().toISOString();

    await this.sessionStore.set(session, this.sessionTtlSeconds);
    await this.telegramGateway.sendMessage(
      session.chatId,
      `Odabrao si termin ${slot}. Držim ga 3 minute. Pošalji "potvrđujem" za finalnu rezervaciju.`,
    );
  }

  private isLockActive(lockExpiresAt?: string): boolean {
    if (!lockExpiresAt) {
      return false;
    }

    return new Date(lockExpiresAt).getTime() > Date.now();
  }

  private shouldAskClarification(intentResult: IntentServiceResult): boolean {
    if (intentResult.source !== 'llm') {
      return false;
    }

    if (typeof intentResult.confidence !== 'number') {
      return false;
    }

    return intentResult.confidence < this.minLlmConfidence;
  }

  private buildLowConfidenceReply(intentResult: IntentServiceResult): string {
    if (intentResult.reply?.trim()) {
      return `Nisam potpuno siguran da sam dobro razumio. ${intentResult.reply.trim()}`;
    }

    return 'Nisam potpuno siguran da sam dobro razumio. Možeš li precizirati uslugu, datum, vrijeme ili barbera?';
  }
}
