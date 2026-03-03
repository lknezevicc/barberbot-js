import { BookingSession } from '@barberbot/common';
import { Injectable } from '@nestjs/common';
import { RedisClient } from '../redis/redis.client';
import { SessionStore } from './session.store';

@Injectable()
export class RedisSessionStore implements SessionStore {
  constructor(private readonly redisClient: RedisClient) {}

  private key(userId: number): string {
    return `session:user:${userId}`;
  }

  async get(userId: number): Promise<BookingSession | null> {
    const redis = await this.redisClient.getClient();
    const json = await redis.get(this.key(userId));
    if (!json) {
      return null;
    }

    return JSON.parse(json) as BookingSession;
  }

  async set(session: BookingSession, ttlSeconds: number): Promise<void> {
    const redis = await this.redisClient.getClient();
    await redis.set(this.key(session.userId), JSON.stringify(session), 'EX', ttlSeconds);
  }

  async refresh(userId: number, ttlSeconds: number): Promise<void> {
    const redis = await this.redisClient.getClient();
    await redis.expire(this.key(userId), ttlSeconds);
  }

  async delete(userId: number): Promise<void> {
    const redis = await this.redisClient.getClient();
    await redis.del(this.key(userId));
  }
}
