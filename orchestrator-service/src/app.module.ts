import { Module } from '@nestjs/common';
import { RabbitModule } from '@barberbot/common';
import { OrchestratorService } from './orchestrator/orchestrator.service';
import { RuleBasedIntentService } from './llm/rule-based-intent.service';
import { LlmIntentService } from './llm/llm-intent.service';
import { OpenAiChatClient } from './llm/openai-chat.client';
import { InMemorySessionStore } from './session/in-memory-session.store';
import { RedisSessionStore } from './session/redis-session.store';
import { TelegramBotGatewayLogger } from './telegram/telegram-bot.gateway';
import { TelegramBotApiGateway } from './telegram/telegram-bot-api.gateway';
import { RedisClient } from './redis/redis.client';
import { SlotLockService } from './locks/slot-lock.service';
import { UserSerialExecutorService } from './orchestrator/user-serial-executor.service';
import { SlotSuggestionService } from './orchestrator/slot-suggestion.service';
import { BookingEventPublisherService } from './orchestrator/booking-event-publisher.service';
import { ActionTokenService } from './security/action-token.service';
import { PromptInjectionGuardService } from './security/prompt-injection-guard.service';

@Module({
  imports: [RabbitModule],
  providers: [
    OrchestratorService,
    OpenAiChatClient,
    RedisClient,
    SlotLockService,
    UserSerialExecutorService,
    SlotSuggestionService,
    BookingEventPublisherService,
    ActionTokenService,
    PromptInjectionGuardService,
    RuleBasedIntentService,
    {
      provide: 'IntentService',
      useClass: LlmIntentService,
    },
    {
      provide: 'SessionStore',
      useFactory: (redisClient: RedisClient) => {
        return redisClient.isEnabled() ? new RedisSessionStore(redisClient) : new InMemorySessionStore();
      },
      inject: [RedisClient],
    },
    {
      provide: 'TelegramGateway',
      useFactory: () => {
        return process.env.TELEGRAM_BOT_TOKEN ? new TelegramBotApiGateway() : new TelegramBotGatewayLogger();
      },
    },
  ],
})
export class AppModule {}
