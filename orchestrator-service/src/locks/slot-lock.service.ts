import { Injectable, Logger } from '@nestjs/common';
import { RedisClient } from '../redis/redis.client';

@Injectable()
export class SlotLockService {
  private readonly logger = new Logger(SlotLockService.name);

  constructor(private readonly redisClient: RedisClient) {}

  private lockKey(slot: string): string {
    return `lock:slot:${slot}`;
  }

  async tryLock(slot: string, owner: string, ttlSeconds: number): Promise<boolean> {
    if (!this.redisClient.isEnabled()) {
      return true;
    }

    const redis = await this.redisClient.getClient();
    const result = await redis.set(this.lockKey(slot), owner, 'EX', ttlSeconds, 'NX');
    return result === 'OK';
  }

  async unlock(slot: string, owner: string): Promise<void> {
    if (!this.redisClient.isEnabled()) {
      return;
    }

    const redis = await this.redisClient.getClient();
    const key = this.lockKey(slot);

    const script = `
      if redis.call('GET', KEYS[1]) == ARGV[1] then
        return redis.call('DEL', KEYS[1])
      else
        return 0
      end
    `;

    try {
      await redis.eval(script, 1, key, owner);
    } catch (e) {
      this.logger.warn(`Failed to unlock slot=${slot}: ${String(e)}`);
    }
  }
}
