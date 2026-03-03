import { BookingSession } from '@barberbot/common';

export interface SessionStore {
  get(userId: number): Promise<BookingSession | null>;
  set(session: BookingSession, ttlSeconds: number): Promise<void>;
  refresh(userId: number, ttlSeconds: number): Promise<void>;
  delete(userId: number): Promise<void>;
}
