import { Injectable, Logger } from '@nestjs/common';
import { TelegramButtonOption, TelegramGateway } from './telegram.gateway';

@Injectable()
export class TelegramBotGatewayLogger implements TelegramGateway {
  private readonly logger = new Logger(TelegramBotGatewayLogger.name);

  async sendMessage(chatId: number, text: string, options?: TelegramButtonOption[][]): Promise<void> {
    this.logger.log(`[telegram][chat=${chatId}] ${text}`);
    if (options?.length) {
      this.logger.log(`[telegram][chat=${chatId}] options=${JSON.stringify(options)}`);
    }
  }
}
