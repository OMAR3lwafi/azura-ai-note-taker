// Minimal KV wrapper (Upstash Redis REST or no-op fallback)

const UPSTASH_URL = Deno.env.get("UPSTASH_REDIS_REST_URL");
const UPSTASH_TOKEN = Deno.env.get("UPSTASH_REDIS_REST_TOKEN");

async function upstashFetch(body: unknown) {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return { result: null };
  const res = await fetch(UPSTASH_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return res.json();
}

export const kv = {
  async get(key: string): Promise<string | null> {
    const out = await upstashFetch({ command: ["GET", key] });
    return (out?.result ?? null) as string | null;
  },
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds && ttlSeconds > 0) {
      await upstashFetch({ command: ["SET", key, value, "EX", String(ttlSeconds)] });
    } else {
      await upstashFetch({ command: ["SET", key, value] });
    }
  },
  async incr(key: string): Promise<number> {
    const out = await upstashFetch({ command: ["INCR", key] });
    return (out?.result ?? 0) as number;
  },
  async expire(key: string, seconds: number): Promise<void> {
    await upstashFetch({ command: ["EXPIRE", key, String(seconds)] });
  },
  async del(key: string): Promise<void> {
    await upstashFetch({ command: ["DEL", key] });
  },
};

// Rate limiting helper using token bucket algorithm
export class RateLimiter {
  constructor(
    private readonly prefix: string,
    private readonly maxRequests: number,
    private readonly windowSeconds: number,
  ) {}

  async checkLimit(identifier: string): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const key = `ratelimit:${this.prefix}:${identifier}`;
    const countKey = `${key}:count`;
    const windowKey = `${key}:window`;

    // Get current window
    const windowStart = await kv.get(windowKey);
    const now = Date.now();
    const currentWindow = Math.floor(now / (this.windowSeconds * 1000));

    if (!windowStart || parseInt(windowStart) !== currentWindow) {
      // New window
      await kv.set(windowKey, String(currentWindow), this.windowSeconds);
      await kv.set(countKey, "1", this.windowSeconds);
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetAt: (currentWindow + 1) * this.windowSeconds * 1000,
      };
    }

    // Increment counter
    const count = await kv.incr(countKey);
    const allowed = count <= this.maxRequests;
    
    return {
      allowed,
      remaining: Math.max(0, this.maxRequests - count),
      resetAt: (currentWindow + 1) * this.windowSeconds * 1000,
    };
  }
};
