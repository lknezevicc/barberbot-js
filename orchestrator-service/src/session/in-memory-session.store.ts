import { BookingSession } from '@barberbot/common';
import { Injectable } from '@nestjs/common';
import { SessionStore } from './session.store';

@Injectable()
export class InMemorySessionStore implements SessionStore {
  private readonly sessions = new Map<number, BookingSession>();
  private readonly timers = new Map<number, NodeJS.Timeout>();

  async get(userId: number): Promise<BookingSession | null> {
    return this.sessions.get(userId) ?? null;
  }

  async set(session: BookingSession, ttlSeconds: number): Promise<void> {
    this.sessions.set(session.userId, session);

    const existingTimer = this.timers.get(session.userId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      this.sessions.delete(session.userId);
      this.timers.delete(session.userId);
    }, ttlSeconds * 1000);

    this.timers.set(session.userId, timer);
  }

  async refresh(userId: number, ttlSeconds: number): Promise<void> {
    const session = this.sessions.get(userId);
    if (!session) {
      return;
    }

    await this.set(session, ttlSeconds);
  }

  async delete(userId: number): Promise<void> {
    this.sessions.delete(userId);

    const existingTimer = this.timers.get(userId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.timers.delete(userId);
    }
  }
}
