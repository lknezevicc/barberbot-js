import {
  Body,
  Controller,
  Headers,
  Ip,
  HttpCode,
  Logger,
  Post,
  ServiceUnavailableException,
} from '@nestjs/common';
import { TelegramUpdateDto } from '@barberbot/common'
import { IngestionService } from '../ingestion/ingestion.service';
import { TelegramUpdateMapper } from '../mapper/telegram-update.mapper';
import { TelegramWebhookSecurityService } from '../security/telegram-webhook-security.service';
import { WebhookIdempotencyService } from '../security/webhook-idempotency.service';
import { WebhookRateLimiterService } from '../security/webhook-rate-limiter.service';

@Controller('telegram')
export class TelegramWebhookController {

  private readonly logger = new Logger(TelegramWebhookController.name);

  constructor(
    private readonly ingestionService: IngestionService,
    private readonly mapper: TelegramUpdateMapper,
    private readonly webhookSecurity: TelegramWebhookSecurityService,
    private readonly rateLimiter: WebhookRateLimiterService,
    private readonly idempotency: WebhookIdempotencyService,
  ) {}

  @Post('/webhook')
  @HttpCode(200)
  async handleTelegramUpdate(
    @Body() update: TelegramUpdateDto,
    @Headers('x-telegram-bot-api-secret-token') secretToken?: string,
    @Ip() ip?: string,
  ): Promise<void> {
    this.webhookSecurity.assertWebhookEnabled();
    this.webhookSecurity.assertSecretToken(secretToken);
    await this.rateLimiter.assertIpAllowed(ip ?? 'unknown');

    const userId =
      update.message?.from.id ??
      update.callback_query?.from.id ??
      update.inline_query?.from.id;
    if (userId) {
      await this.rateLimiter.assertUserAllowed(String(userId));
    }

    const firstTime = await this.idempotency.isFirstTime(update.update_id);
    if (!firstTime) {
      this.logger.debug(`Ignoring duplicate telegram update_id=${update.update_id}`);
      return;
    }

    this.logger.log(`Received Telegram update: ${JSON.stringify(update)}`);

    try {
      const event = this.mapper.toUserMessageEvent(update);
      await this.ingestionService.ingestTelegramUpdate(event);
    } catch (error) {
      this.logger.warn(
        `Failed to ingest telegram updateId=${update.update_id}: ${String(error)}`,
      );
      throw new ServiceUnavailableException('Temporary ingestion issue');
    }
  }
  
}
