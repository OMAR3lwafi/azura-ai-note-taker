/**
 * Distributed lock implementation using Redis
 * Based on: PRPs-agentic-eng/PRPs/ai_docs/upstash_kv_patterns.md
 */

import { Redis } from "https://deno.land/x/upstash_redis@v1.28.2/mod.ts";

const redis = Redis.fromEnv();

/**
 * Distributed lock for preventing concurrent operations
 */
export class DistributedLock {
  private redis: Redis;
  private key: string;
  private ttl: number;

  constructor(key: string, ttl: number = 30) {
    this.redis = redis;
    this.key = `lock:${key}`;
    this.ttl = ttl;
  }

  /**
   * Try to acquire the lock
   * Returns lock token if successful, null if lock is already held
   */
  async acquire(): Promise<string | null> {
    const token = crypto.randomUUID();
    const acquired = await this.redis.set(this.key, token, {
      ex: this.ttl,
      nx: true, // Only set if not exists
    });

    return acquired ? token : null;
  }

  /**
   * Release the lock (only if we own it)
   */
  async release(token: string): Promise<void> {
    // Lua script for atomic check-and-delete
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;

    await this.redis.eval(script, [this.key], [token]);
  }

  /**
   * Extend the lock TTL (only if we own it)
   */
  async extend(token: string, ttl: number): Promise<boolean> {
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("expire", KEYS[1], ARGV[2])
      else
        return 0
      end
    `;

    const result = await this.redis.eval(script, [this.key], [token, ttl]);
    return result === 1;
  }
}

/**
 * Execute function with distributed lock
 * Automatically acquires and releases lock
 */
export async function withLock<T>(
  lockKey: string,
  fn: () => Promise<T>,
  options: { ttl?: number; throwOnLocked?: boolean } = {}
): Promise<T> {
  const { ttl = 30, throwOnLocked = true } = options;
  const lock = new DistributedLock(lockKey, ttl);

  const token = await lock.acquire();

  if (!token) {
    if (throwOnLocked) {
      throw new Error(`Operation already in progress: ${lockKey}`);
    }
    // Return null or default value when lock cannot be acquired
    return null as T;
  }

  try {
    return await fn();
  } finally {
    await lock.release(token);
  }
}

/**
 * Cache wrapper with distributed lock (prevents cache stampede)
 */
export async function cachedWithLock<T>(
  cacheKey: string,
  fn: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  // Try to get from cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached as string);
  }

  // Use lock to prevent multiple concurrent executions
  return await withLock(
    `cache:${cacheKey}`,
    async () => {
      // Double-check cache (might have been populated while waiting for lock)
      const cachedAfterLock = await redis.get(cacheKey);
      if (cachedAfterLock) {
        return JSON.parse(cachedAfterLock as string);
      }

      // Execute function and cache result
      const result = await fn();
      await redis.setex(cacheKey, ttl, JSON.stringify(result));
      return result;
    },
    { ttl: 10, throwOnLocked: false }
  );
}
