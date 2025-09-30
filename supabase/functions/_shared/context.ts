// Type-safe context accessors for Hono
import type { Context } from "hono";

/**
 * Get the authenticated user ID from context
 * @throws Error if userId is not set (should be set by requireAuth middleware)
 */
export function getUserId(c: Context): string {
  const userId = c.get("userId") as string | undefined;
  if (!userId) {
    throw new Error("userId not found in context. Ensure requireAuth middleware is applied.");
  }
  return userId;
}

/**
 * Get the authenticated user object from context
 */
export function getUser(c: Context): unknown {
  return c.get("user");
}

/**
 * Get the request ID from context
 */
export function getRequestId(c: Context): string | undefined {
  return c.get("requestId") as string | undefined;
}
