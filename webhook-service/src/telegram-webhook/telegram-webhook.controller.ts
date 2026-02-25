import { Body, Controller, HttpCode, Logger, Post } from '@nestjs/common';
import { TelegramUpdateDto } from '@barberbot/common'
import { IngestionService } from '../ingestion/ingestion.service';
import { TelegramUpdateMapper } from '../mapper/telegram-update.mapper';

@Controller('telegram')
export class TelegramWebhookController {

  private readonly logger = new Logger(TelegramWebhookController.name);

  constructor(
    private readonly ingestionService: IngestionService,
    private readonly mapper: TelegramUpdateMapper
  ) {}

  @Post('/webhook')
  @HttpCode(200)
  async handleTelegramUpdate(@Body() update: TelegramUpdateDto): Promise<void> {
    this.logger.log(`Received Telegram update: ${JSON.stringify(update)}`);

    const event = this.mapper.toUserMessageEvent(update);
    await this.ingestionService.ingestTelegramUpdate(event);
  }
  
}
