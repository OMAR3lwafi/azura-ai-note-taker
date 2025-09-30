/**
 * Rate limiting implementation using Upstash Redis
 * Based on: PRPs-agentic-eng/PRPs/ai_docs/upstash_kv_patterns.md
 */

import { Ratelimit } from "https://esm.sh/@upstash/ratelimit@1.0.0";
import { Redis } from "https://deno.land/x/upstash_redis@v1.28.2/mod.ts";

// Initialize Redis client from environment
const redis = Redis.fromEnv();

/**
 * Auth endpoints rate limiter
 * 5 requests per minute per IP (prevents brute force)
 */
export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  analytics: true,
  prefix: "@azora/auth",
});

/**
 * AI endpoints rate limiter  
 * 10 requests per minute per user (prevents abuse)
 */
export const aiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "60 s"),
  analytics: true,
  prefix: "@azora/ai",
});

/**
 * Meeting operations rate limiter
 * 20 requests per minute per user (general operations)
 */
export const meetingRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "60 s"),
  analytics: true,
  prefix: "@azora/meetings",
});

/**
 * Export operations rate limiter
 * 5 exports per minute per user (resource intensive)
 */
export const exportRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"),
  analytics: true,
  prefix: "@azora/export",
});

/**
 * Search operations rate limiter
 * 30 searches per minute per user (frequent operation)
 */
export const searchRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "60 s"),
  analytics: true,
  prefix: "@azora/search",
});

/**
 * Multi-tier rate limiters for different plan levels
 */
export const tieredRateLimits = {
  free: {
    ai: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "60 s"),
      analytics: true,
      prefix: "@azora/free/ai",
    }),
    meetings: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "60 s"),
      analytics: true,
      prefix: "@azora/free/meetings",
    }),
  },
  pro: {
    ai: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "60 s"),
      analytics: true,
      prefix: "@azora/pro/ai",
    }),
    meetings: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(200, "60 s"),
      analytics: true,
      prefix: "@azora/pro/meetings",
    }),
  },
};

/**
 * Helper function to check rate limit and return appropriate response
 */
export async function checkRateLimit(
  limiter: Ratelimit,
  identifier: string
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const result = await limiter.limit(identifier);
  return result;
}

/**
 * Get rate limiter based on user plan
 */
export function getRateLimiterForPlan(
  plan: "free" | "pro" = "free",
  resource: "ai" | "meetings"
): Ratelimit {
  return tieredRateLimits[plan][resource];
}
