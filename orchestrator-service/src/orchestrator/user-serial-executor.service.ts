import { Injectable } from '@nestjs/common';

@Injectable()
export class UserSerialExecutorService {
  private readonly chains = new Map<string, Promise<unknown>>();

  async run<T>(userKey: string, task: () => Promise<T>): Promise<T> {
    const previous = this.chains.get(userKey) ?? Promise.resolve();

    const current = previous
      .catch(() => undefined)
      .then(task);

    this.chains.set(userKey, current);

    try {
      return await current;
    } finally {
      if (this.chains.get(userKey) === current) {
        this.chains.delete(userKey);
      }
    }
  }
}
