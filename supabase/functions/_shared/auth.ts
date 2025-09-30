// Auth middleware: validates Supabase JWT, API keys, and injects user context
import type { MiddlewareHandler } from "hono";
import { getUserFromToken } from "../_shared/supabase.ts";
import { validateApiKey, verifyTotp, trackDevice } from "../_shared/auth_advanced.ts";
import { setUser } from "../_shared/sentry.ts";

// Main auth middleware supporting JWT and API keys
export const requireAuth: MiddlewareHandler = async (c, next) => {
  const auth = c.req.header("authorization") ?? c.req.header("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return c.json({ code: "unauthorized", message: "Missing or invalid Authorization header" }, 401);
  }
  
  const token = auth.substring(7);
  
  // Try API key first
  if (token.startsWith("azora_")) {
    const keyData = await validateApiKey(token);
    if (!keyData) {
      return c.json({ code: "unauthorized", message: "Invalid API key" }, 401);
    }
    
    // Store user info from API key
    // deno-lint-ignore no-explicit-any
    (c as any).set("user", keyData.profiles);
    // deno-lint-ignore no-explicit-any
    (c as any).set("userId", keyData.user_id);
    // deno-lint-ignore no-explicit-any
    (c as any).set("authMethod", "api_key");
    // deno-lint-ignore no-explicit-any
    (c as any).set("scopes", keyData.scopes);
    await next();
    return;
  }
  
  // Otherwise validate JWT
  const { data, error } = await getUserFromToken(token);
  if (error || !data?.user) {
    return c.json({ code: "unauthorized", message: "Invalid token" }, 401);
  }
  
  // Track device if headers present
  const deviceId = c.req.header("X-Device-ID");
  const platform = c.req.header("X-Platform");
  const userAgent = c.req.header("User-Agent");
  if (deviceId && platform && userAgent) {
    trackDevice(data.user.id, deviceId, platform, userAgent).catch((err) =>
      console.error("Device tracking failed:", err)
    );
  }
  
  // Store user info on context
  // deno-lint-ignore no-explicit-any
  (c as any).set("user", data.user);
  // deno-lint-ignore no-explicit-any
  (c as any).set("userId", data.user.id);
  // deno-lint-ignore no-explicit-any
  (c as any).set("authMethod", "jwt");
  
  // Set Sentry user context for error tracking
  setUser(data.user.id, data.user.email);
  
  await next();
};

// Scope enforcement middleware
export function requireScope(scope: string): MiddlewareHandler {
  return async (c, next) => {
    // deno-lint-ignore no-explicit-any
    const authMethod = (c as any).get("authMethod");
    if (authMethod !== "api_key") {
      // JWT users have all scopes
      await next();
      return;
    }
    
    // deno-lint-ignore no-explicit-any
    const scopes = (c as any).get("scopes") as string[];
    if (!scopes || !scopes.includes(scope)) {
      return c.json({ code: "forbidden", message: `Missing required scope: ${scope}` }, 403);
    }
    await next();
  };
}

// 2FA verification middleware
export const require2FA: MiddlewareHandler = async (c, next) => {
  // deno-lint-ignore no-explicit-any
  const userId = (c as any).get("userId") as string;
  const totpCode = c.req.header("X-TOTP-Code");
  
  if (!totpCode) {
    return c.json({ code: "2fa_required", message: "2FA verification required" }, 401);
  }
  
  const isValid = await verifyTotp(userId, totpCode);
  if (!isValid) {
    return c.json({ code: "2fa_invalid", message: "Invalid 2FA code" }, 401);
  }
  
  await next();
};
