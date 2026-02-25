import { Module } from '@nestjs/common';
import { TelegramWebhookController } from './telegram-webhook/telegram-webhook.controller';
import { IngestionService } from './ingestion/ingestion.service';
import { TelegramUpdateMapper } from './mapper/telegram-update.mapper';
import { UserEventPublisher } from './publisher/user-event-publisher.service';
import { RabbitModule } from '@barberbot/common';

@Module({
  imports: [RabbitModule],
  controllers: [TelegramWebhookController],
  providers: [
    IngestionService, 
    TelegramUpdateMapper,
    {
      provide: 'UserEventPublisher',
      useClass: UserEventPublisher,
    }
  ],
})
export class AppModule {}
