/**
 * In-memory cache — implements ICache with TTL support.
 *
 * Strategy pattern: swap for RedisCache, DiskCache, etc. without touching consumers.
 */

import { injectable } from 'inversify';
import type { ICache } from '../../core/interfaces.js';

interface CacheEntry<T> {
  value: T;
  expiresAt: number; // epoch ms
}

@injectable()
export class MemoryCache implements ICache {
  private store = new Map<string, CacheEntry<unknown>>();

  async get<T>(key: string): Promise<T | undefined> {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async has(key: string): Promise<boolean> {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}
