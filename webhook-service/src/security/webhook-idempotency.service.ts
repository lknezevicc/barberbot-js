import { Injectable } from '@nestjs/common';
import { RedisClient } from './redis.client';

@Injectable()
export class WebhookIdempotencyService {
  private readonly seen = new Map<number, number>();
  private readonly ttlSeconds = Number(process.env.WEBHOOK_IDEMPOTENCY_TTL_SECONDS ?? 300);

  constructor(private readonly redisClient: RedisClient) {}

  async isFirstTime(updateId: number): Promise<boolean> {
    if (!this.redisClient.isEnabled()) {
      const now = Date.now();
      const expiry = this.seen.get(updateId);
      if (expiry && expiry > now) {
        return false;
      }

      this.seen.set(updateId, now + this.ttlSeconds * 1000);
      return true;
    }

    const redis = await this.redisClient.getClient();
    const key = `webhook:update:${updateId}`;
    const result = await redis.set(key, '1', 'EX', this.ttlSeconds, 'NX');
    return result === 'OK';
  }
}
