/**
 * Secondary rate limiter — tracks per-event-type concurrency to avoid
 * tripping GitHub's secondary rate limits.
 *
 * Chain of Responsibility: sits before each handler. If the concurrency
 * cap for an event type is hit, the event is deferred (skipped) rather
 * than risking a 429 that poisons the whole app.
 */

import type { ILogger } from '../core/interfaces.js';

interface RateLimitBucket {
  current: number;
  max: number;
  resetAt: number; // epoch ms
}

export class RateLimiter {
  private buckets = new Map<string, RateLimitBucket>();

  constructor(
    private readonly logger: ILogger,
    private readonly defaultMaxConcurrent: number = 10,
  ) {}

  /**
   * Try to acquire a slot for the given event type.
   * Returns true if the handler should proceed, false if it should skip.
   */
  acquire(eventType: string): boolean {
    const bucket = this.getOrCreateBucket(eventType);

    // Reset expired bucket
    if (Date.now() > bucket.resetAt) {
      bucket.current = 0;
      bucket.resetAt = Date.now() + 60_000; // 1-minute window
    }

    if (bucket.current >= bucket.max) {
      this.logger.warn(`Rate limit hit for "${eventType}"`, {
        current: bucket.current,
        max: bucket.max,
      });
      return false;
    }

    bucket.current++;
    return true;
  }

  private getOrCreateBucket(eventType: string): RateLimitBucket {
    if (!this.buckets.has(eventType)) {
      this.buckets.set(eventType, {
        current: 0,
        max: this.defaultMaxConcurrent,
        resetAt: Date.now() + 60_000,
      });
    }
    return this.buckets.get(eventType)!;
  }
}
