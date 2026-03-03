import { Module } from '@nestjs/common';
import { TelegramWebhookController } from './telegram-webhook/telegram-webhook.controller';
import { IngestionService } from './ingestion/ingestion.service';
import { TelegramUpdateMapper } from './mapper/telegram-update.mapper';
import { UserEventPublisher } from './publisher/user-event-publisher.service';
import { RabbitModule } from '@barberbot/common';
import { TelegramWebhookSecurityService } from './security/telegram-webhook-security.service';
import { WebhookRateLimiterService } from './security/webhook-rate-limiter.service';
import { WebhookIdempotencyService } from './security/webhook-idempotency.service';
import { RedisClient } from './security/redis.client';

@Module({
  imports: [RabbitModule],
  controllers: [TelegramWebhookController],
  providers: [
    IngestionService,
    TelegramUpdateMapper,
    RedisClient,
    TelegramWebhookSecurityService,
    WebhookRateLimiterService,
    WebhookIdempotencyService,
    {
      provide: 'UserEventPublisher',
      useClass: UserEventPublisher,
    },
  ],
})
export class AppModule {}
