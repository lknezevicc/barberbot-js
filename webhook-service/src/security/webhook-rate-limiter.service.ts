import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { RedisClient } from './redis.client';

interface Bucket {
  count: number;
  resetAt: number;
}

@Injectable()
export class WebhookRateLimiterService {
  private readonly ipBuckets = new Map<string, Bucket>();
  private readonly userBuckets = new Map<string, Bucket>();

  private readonly ipLimit = Number(process.env.WEBHOOK_RATE_LIMIT_IP_PER_MINUTE ?? 300);
  private readonly userLimit = Number(process.env.WEBHOOK_RATE_LIMIT_USER_PER_MINUTE ?? 20);
  private readonly windowMs = 60_000;

  constructor(private readonly redisClient: RedisClient) {}

  async assertIpAllowed(ip: string): Promise<void> {
    await this.assertAllowed(this.ipBuckets, `ip:${ip}`, this.ipLimit);
  }

  async assertUserAllowed(userId: string): Promise<void> {
    await this.assertAllowed(this.userBuckets, `user:${userId}`, this.userLimit);
  }

  private async assertAllowed(store: Map<string, Bucket>, key: string, limit: number): Promise<void> {
    if (this.redisClient.isEnabled()) {
      const redis = await this.redisClient.getClient();
      const bucketKey = `ratelimit:${key}`;
      const count = await redis.incr(bucketKey);

      if (count === 1) {
        await redis.expire(bucketKey, Math.ceil(this.windowMs / 1000));
      }

      if (count > limit) {
        throw new HttpException('Webhook rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
      }

      return;
    }

    const now = Date.now();
    const existing = store.get(key);

    if (!existing || existing.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + this.windowMs });
      return;
    }

    if (existing.count >= limit) {
      throw new HttpException('Webhook rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }

    existing.count += 1;
  }
}
