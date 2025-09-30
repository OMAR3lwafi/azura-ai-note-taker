// Structured logging + request id middleware
import type { MiddlewareHandler } from "hono";

export const withRequestId: MiddlewareHandler = async (c, next) => {
  const rid = c.req.header("X-Request-Id") || crypto.randomUUID();
  // deno-lint-ignore no-explicit-any
  (c as any).set("requestId", rid);
  const start = Date.now();
  await next();
  const userId = (c as unknown as { get: (k: string) => unknown }).get?.("userId") as string | undefined;
  const latency = Date.now() - start;
  console.log(
    JSON.stringify({
      level: "info",
      requestId: rid,
      userId,
      method: c.req.method,
      path: c.req.path,
      status: c.res.status,
      latency_ms: latency,
    }),
  );
};
