import { Injectable, Logger } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';

@Injectable()
export class ActionTokenService {
  private readonly logger = new Logger(ActionTokenService.name);
  private readonly secret: string;
  private readonly ttlSeconds = Number(process.env.ACTION_TOKEN_TTL_SECONDS ?? 600);

  constructor() {
    const configuredSecret = process.env.TELEGRAM_ACTION_TOKEN_SECRET;
    const allowInsecure = process.env.ALLOW_INSECURE_ACTION_TOKENS === 'true';

    if (!configuredSecret && !allowInsecure) {
      throw new Error(
        'Missing TELEGRAM_ACTION_TOKEN_SECRET. Refusing to start. ' +
          'For local-only testing, set ALLOW_INSECURE_ACTION_TOKENS=true.',
      );
    }

    if (!configuredSecret && allowInsecure) {
      this.secret = 'dev-action-secret-change-me';
      this.logger.warn(
        'Running with insecure action-token fallback secret (local/testing mode).',
      );
      return;
    }

    this.secret = configuredSecret!;
  }

  createSlotSelectionToken(userId: number, slotIndex: number): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = `${userId}:${slotIndex}:${timestamp}`;
    const sig = this.sign(payload).slice(0, 16);
    return `a:sl:${slotIndex}:${timestamp}:${sig}`;
  }

  verifySlotSelectionToken(token: string, userId: number): { slotIndex: number } | null {
    const parts = token.split(':');
    if (parts.length !== 5 || parts[0] !== 'a' || parts[1] !== 'sl') {
      return null;
    }

    const slotIndex = Number(parts[2]);
    const timestamp = Number(parts[3]);
    const signature = parts[4];

    if (!Number.isInteger(slotIndex) || slotIndex < 0 || !Number.isInteger(timestamp)) {
      return null;
    }

    const age = Math.floor(Date.now() / 1000) - timestamp;
    if (age < 0 || age > this.ttlSeconds) {
      return null;
    }

    const payload = `${userId}:${slotIndex}:${timestamp}`;
    const expected = this.sign(payload).slice(0, 16);

    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);

    if (
      actualBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(actualBuffer, expectedBuffer)
    ) {
      return null;
    }

    return { slotIndex };
  }

  private sign(payload: string): string {
    return createHmac('sha256', this.secret).update(payload).digest('base64url');
  }
}
