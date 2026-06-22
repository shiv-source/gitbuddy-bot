/**
 * RateLimiter unit tests.
 *
 * Tests per-event-type concurrency limiting with time-based bucket reset.
 */

import { jest, describe, it, beforeEach, afterEach, expect } from '@jest/globals';
import { RateLimiter } from '../../../src/middleware/rate-limiter.js';
import type { ILogger, ICache } from '../../../src/core/interfaces.js';

function createMockLogger(): jest.Mocked<ILogger> {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

function createMockCache(): jest.Mocked<ICache> {
  return {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    has: jest.fn(),
    clear: jest.fn(),
  };
}

describe('RateLimiter', () => {
  let logger: jest.Mocked<ILogger>;
  let realDateNow: typeof Date.now;

  beforeEach(() => {
    logger = createMockLogger();

    // Freeze Date.now to a fixed timestamp so bucket expiry is predictable
    realDateNow = Date.now;
    jest.spyOn(Date, 'now').mockReturnValue(1_000_000_000_000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ── Properties ────────────────────────────────────────────────

  describe('properties', () => {
    it('has the correct middleware name', () => {
      const limiter = new RateLimiter(logger);
      expect(limiter.name).toBe('rate-limiter');
    });

    it('has the correct priority', () => {
      const limiter = new RateLimiter(logger);
      expect(limiter.priority).toBe(200);
    });
  });

  // ── Constructor ───────────────────────────────────────────────

  describe('constructor', () => {
    it('logs debug message when cache is provided', () => {
      const cache = createMockCache();
      const limiter = new RateLimiter(logger, cache);

      expect(logger.debug).toHaveBeenCalledWith('RateLimiter initialized with cache backend');
    });

    it('does not log debug message when cache is omitted', () => {
      const limiter = new RateLimiter(logger);

      expect(logger.debug).not.toHaveBeenCalled();
    });

    it('accepts custom defaultMaxConcurrent', () => {
      // Create a limiter with max 5 and exhaust it
      const limiter = new RateLimiter(logger, undefined, 5);
      for (let i = 0; i < 5; i++) {
        expect(limiter.acquire('test.event')).toBe(true);
      }
      // 6th call should be rate-limited
      expect(limiter.acquire('test.event')).toBe(false);
    });
  });

  // ── acquire() ─────────────────────────────────────────────────

  describe('acquire', () => {
    it('returns true on first call (creates bucket)', () => {
      const limiter = new RateLimiter(logger);
      expect(limiter.acquire('pull_request.opened')).toBe(true);
    });

    it('returns true within the max concurrent limit', () => {
      const limiter = new RateLimiter(logger);
      for (let i = 0; i < 10; i++) {
        expect(limiter.acquire('issues.opened')).toBe(true);
      }
    });

    it('returns false when bucket is full (current >= max)', () => {
      const limiter = new RateLimiter(logger);

      // Exhaust the default max of 10
      for (let i = 0; i < 10; i++) {
        limiter.acquire('deployment.event');
      }

      expect(limiter.acquire('deployment.event')).toBe(false);
    });

    it('logs warning when rate limit is hit', () => {
      const limiter = new RateLimiter(logger);

      for (let i = 0; i < 10; i++) {
        limiter.acquire('check_run.completed');
      }
      limiter.acquire('check_run.completed');

      expect(logger.warn).toHaveBeenCalledWith(
        'Rate limit hit for "check_run.completed"',
        expect.objectContaining({
          current: 10,
          max: 10,
          cacheBackend: false,
        }),
      );
    });
  });

  // ── Bucket reset ──────────────────────────────────────────────

  describe('bucket reset (time window expiry)', () => {
    it('resets bucket when Date.now() > resetAt', () => {
      // Date.now is frozen at 1_000_000_000_000
      const limiter = new RateLimiter(logger);

      // Exhaust the bucket
      for (let i = 0; i < 10; i++) {
        limiter.acquire('push.event');
      }
      expect(limiter.acquire('push.event')).toBe(false);

      // Advance time past the 60s window (initial was 1_000_000_000_000, add 60_001)
      jest.spyOn(Date, 'now').mockReturnValue(1_000_000_060_001);

      // Bucket should have reset
      expect(limiter.acquire('push.event')).toBe(true);
    });

    it('treats different event types with independent buckets', () => {
      const limiter = new RateLimiter(logger, undefined, 3);

      // Exhaust event type A
      for (let i = 0; i < 3; i++) {
        limiter.acquire('event.a');
      }
      expect(limiter.acquire('event.a')).toBe(false);

      // Event type B should still be under limit
      expect(limiter.acquire('event.b')).toBe(true);
    });
  });

  // ── Cache flag in warnings ────────────────────────────────────

  describe('cache backend flag in warnings', () => {
    it('includes cacheBackend: true in warning when cache is present', () => {
      const cache = createMockCache();
      const limiter = new RateLimiter(logger, cache, 1);

      limiter.acquire('limited.event');
      limiter.acquire('limited.event');

      expect(logger.warn).toHaveBeenCalledWith(
        'Rate limit hit for "limited.event"',
        expect.objectContaining({ cacheBackend: true }),
      );
    });
  });
});
