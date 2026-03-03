import { Injectable, Logger } from '@nestjs/common';
import { TelegramButtonOption, TelegramGateway } from './telegram.gateway';

@Injectable()
export class TelegramBotApiGateway implements TelegramGateway {
  private readonly logger = new Logger(TelegramBotApiGateway.name);

  async sendMessage(chatId: number, text: string, options?: TelegramButtonOption[][]): Promise<void> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not set; skipping sendMessage');
      return;
    }

    const baseUrl = process.env.TELEGRAM_BASE_URL ?? 'https://api.telegram.org';
    const url = `${baseUrl}/bot${token}/sendMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        reply_markup: options
          ? {
              inline_keyboard: options.map((row) =>
                row.map((button) => ({
                  text: button.text,
                  callback_data: button.callbackData,
                })),
              ),
            }
          : undefined,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.warn(`Telegram sendMessage failed (${response.status}): ${body}`);
    }
  }
}
