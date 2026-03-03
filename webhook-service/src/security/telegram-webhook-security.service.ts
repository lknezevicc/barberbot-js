import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';

@Injectable()
export class TelegramWebhookSecurityService {
  private readonly expectedSecret: string | null;

  constructor() {
    const configuredSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    const allowInsecure = process.env.ALLOW_INSECURE_WEBHOOK_SECRET === 'true';

    if (!configuredSecret && !allowInsecure) {
      throw new Error(
        'Missing TELEGRAM_WEBHOOK_SECRET. Refusing to start. ' +
          'For local-only testing, set ALLOW_INSECURE_WEBHOOK_SECRET=true.',
      );
    }

    this.expectedSecret = configuredSecret ?? null;
  }

  isWebhookEnabled(): boolean {
    return process.env.APP_ENABLED !== 'false';
  }

  assertWebhookEnabled(): void {
    if (!this.isWebhookEnabled()) {
      throw new HttpException('', HttpStatus.NO_CONTENT);
    }
  }

  assertSecretToken(secretToken?: string): void {
    if (!this.expectedSecret) {
      return;
    }

    if (!secretToken) {
      throw new UnauthorizedException('Missing Telegram webhook secret');
    }

    const actualBuffer = Buffer.from(secretToken);
    const expectedBuffer = Buffer.from(this.expectedSecret);

    if (
      actualBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(actualBuffer, expectedBuffer)
    ) {
      throw new UnauthorizedException('Invalid Telegram webhook secret');
    }
  }
}
