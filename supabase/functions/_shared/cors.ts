// Simple CORS middleware for Edge Functions
import type { MiddlewareHandler } from "hono";

const allowed = Deno.env.get("CORS_ORIGIN") ?? "*";

export const cors: MiddlewareHandler = async (c, next) => {
  if (c.req.method === "OPTIONS") {
    c.header("Access-Control-Allow-Origin", allowed);
    c.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    c.header("Access-Control-Allow-Headers", "Authorization,Content-Type,X-Request-Id");
    c.header("Access-Control-Max-Age", "86400");
    return c.body(null, 204);
  }
  await next();
  c.header("Access-Control-Allow-Origin", allowed);
  c.header("Vary", "Origin");
};
