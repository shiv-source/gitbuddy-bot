/**
 * MemoryCache unit tests.
 *
 * Tests TTL-based in-memory cache: set, get (with expiration), has, delete, clear.
 * Uses jest.spyOn(Date, 'now') to control time precisely for TTL assertions.
 */

import { jest, describe, it, beforeEach, expect } from '@jest/globals';
import { MemoryCache } from '../../../src/infrastructure/cache/memory-cache.js';

describe('MemoryCache', () => {
  let cache: MemoryCache;

  beforeEach(() => {
    cache = new MemoryCache();
  });

  // ── Constructor ──────────────────────────────────────────────

  it('creates an empty cache', async () => {
    const result = await cache.get('any-key');
    expect(result).toBeUndefined();
  });

  // ── set ──────────────────────────────────────────────────────

  describe('set', () => {
    it('stores a value with a TTL', async () => {
      await cache.set('key', 'value', 60);
      const result = await cache.get<string>('key');
      expect(result).toBe('value');
    });

    it('stores objects', async () => {
      const obj = { foo: 'bar', num: 42 };
      await cache.set('obj', obj, 60);
      const result = await cache.get<typeof obj>('obj');
      expect(result).toEqual(obj);
    });

    it('stores numbers', async () => {
      await cache.set('num', 99, 60);
      const result = await cache.get<number>('num');
      expect(result).toBe(99);
    });

    it('stores boolean false', async () => {
      await cache.set('flag', false, 60);
      const result = await cache.get<boolean>('flag');
      expect(result).toBe(false);
    });

    it('overwrites an existing key', async () => {
      await cache.set('key', 'first', 60);
      await cache.set('key', 'second', 60);
      const result = await cache.get<string>('key');
      expect(result).toBe('second');
    });
  });

  // ── get ──────────────────────────────────────────────────────

  describe('get', () => {
    it('returns the stored value for a valid key', async () => {
      await cache.set('greeting', 'hello', 60);
      expect(await cache.get<string>('greeting')).toBe('hello');
    });

    it('returns undefined for a missing key', async () => {
      expect(await cache.get('nonexistent')).toBeUndefined();
    });

    it('returns undefined for an expired key', async () => {
      jest.spyOn(Date, 'now').mockReturnValueOnce(1000);
      await cache.set('temp', 'value', 1); // expires at 2000
      jest.spyOn(Date, 'now').mockReturnValueOnce(3000); // past expiry

      const result = await cache.get<string>('temp');
      expect(result).toBeUndefined();
    });

    it('removes the entry when a key is expired on read', async () => {
      jest.spyOn(Date, 'now').mockReturnValueOnce(1000);
      await cache.set('temp', 'value', 1); // expires at 2000
      jest.spyOn(Date, 'now').mockReturnValueOnce(3000); // past expiry

      await cache.get('temp'); // triggers deletion
      const hasAfter = await cache.has('temp');
      expect(hasAfter).toBe(false);
    });

    it('returns undefined for a cache that was cleared', async () => {
      await cache.set('key', 'value', 60);
      await cache.clear();
      expect(await cache.get<string>('key')).toBeUndefined();
    });
  });

  // ── has ──────────────────────────────────────────────────────

  describe('has', () => {
    it('returns true for an existing non-expired key', async () => {
      await cache.set('key', 'value', 60);
      expect(await cache.has('key')).toBe(true);
    });

    it('returns false for a missing key', async () => {
      expect(await cache.has('nonexistent')).toBe(false);
    });

    it('returns false for an expired key', async () => {
      jest.spyOn(Date, 'now').mockReturnValueOnce(1000);
      await cache.set('temp', 'value', 1); // expires at 2000
      jest.spyOn(Date, 'now').mockReturnValueOnce(3000); // past expiry

      expect(await cache.has('temp')).toBe(false);
    });

    it('removes the entry when a key is expired on has check', async () => {
      jest.spyOn(Date, 'now').mockReturnValueOnce(1000);
      await cache.set('temp', 'value', 1); // expires at 2000
      jest.spyOn(Date, 'now').mockReturnValueOnce(3000); // past expiry

      await cache.has('temp'); // triggers deletion
      const hasAfter = await cache.has('temp');
      expect(hasAfter).toBe(false);
    });
  });

  // ── delete ───────────────────────────────────────────────────

  describe('delete', () => {
    it('removes a key from the cache', async () => {
      await cache.set('key', 'value', 60);
      await cache.delete('key');
      expect(await cache.get<string>('key')).toBeUndefined();
    });

    it('does nothing when deleting a non-existent key', async () => {
      // Should not throw
      await expect(cache.delete('nonexistent')).resolves.toBeUndefined();
    });

    it('does not affect other keys', async () => {
      await cache.set('a', 'alpha', 60);
      await cache.set('b', 'beta', 60);
      await cache.delete('a');
      expect(await cache.get<string>('b')).toBe('beta');
    });
  });

  // ── clear ────────────────────────────────────────────────────

  describe('clear', () => {
    it('removes all entries from the cache', async () => {
      await cache.set('a', 'alpha', 60);
      await cache.set('b', 'beta', 60);
      await cache.set('c', 'gamma', 60);
      await cache.clear();
      expect(await cache.get<string>('a')).toBeUndefined();
      expect(await cache.get<string>('b')).toBeUndefined();
      expect(await cache.get<string>('c')).toBeUndefined();
    });

    it('leaves the cache usable after clearing', async () => {
      await cache.set('a', 'alpha', 60);
      await cache.clear();
      await cache.set('b', 'beta', 60);
      expect(await cache.get<string>('b')).toBe('beta');
    });
  });

  // ── Edge cases ───────────────────────────────────────────────

  describe('edge cases', () => {
    it('handles empty string keys', async () => {
      await cache.set('', 'empty-key', 60);
      expect(await cache.get<string>('')).toBe('empty-key');
    });

    it('handles zero TTL (immediate expiry)', async () => {
      jest.spyOn(Date, 'now').mockReturnValueOnce(1000);
      await cache.set('zero', 'value', 0); // expires immediately (now + 0)
      jest.spyOn(Date, 'now').mockReturnValueOnce(2000);

      const result = await cache.get<string>('zero');
      expect(result).toBeUndefined();
    });

    it('handles sequential set and get of different types', async () => {
      await cache.set('str', 'text', 60);
      await cache.set('num', 42, 60);
      await cache.set('bool', true, 60);

      expect(await cache.get<string>('str')).toBe('text');
      expect(await cache.get<number>('num')).toBe(42);
      expect(await cache.get<boolean>('bool')).toBe(true);
    });
  });
});
