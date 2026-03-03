import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisClient implements OnModuleDestroy {
  private readonly logger = new Logger(RedisClient.name);
  private readonly client: Redis | null;

  constructor() {
    const url = process.env.REDIS_URL;
    if (!url) {
      this.client = null;
      return;
    }

    this.client = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 2,
    });

    this.client.on('error', (err) => {
      this.logger.warn(`Redis error: ${String(err)}`);
    });
  }

  isEnabled(): boolean {
    return Boolean(this.client);
  }

  async getClient(): Promise<Redis> {
    if (!this.client) {
      throw new Error('Redis is not enabled. Set REDIS_URL.');
    }

    if (this.client.status === 'wait') {
      await this.client.connect();
    }

    return this.client;
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await this.client.quit();
    } catch {
      this.client.disconnect();
    }
  }
}
