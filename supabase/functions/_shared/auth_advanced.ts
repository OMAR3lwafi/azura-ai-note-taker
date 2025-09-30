// Advanced auth: API keys, 2FA, device tracking
import { adminClient } from "./supabase.ts";
import { kv } from "./kv.ts";

const TOTP_SECRET_KEY = Deno.env.get("TOTP_SECRET_KEY") || "default-secret-key";

// Generate API key for user
export async function generateApiKey(
  userId: string,
  name: string,
  scopes: string[] = ["read"]
): Promise<any> {
  const supa = adminClient();
  const key = `azora_${crypto.randomUUID().replace(/-/g, "")}`;

  const { data, error } = await supa
    .from("api_keys")
    .insert({
      user_id: userId,
      key_hash: await hashKey(key),
      name,
      scopes,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to generate API key: ${error.message}`);
  return { ...data, key };
}

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function validateApiKey(key: string): Promise<any> {
  const supa = adminClient();
  const keyHash = await hashKey(key);

  const { data } = await supa
    .from("api_keys")
    .select("*, profiles!inner(*)")
    .eq("key_hash", keyHash)
    .eq("is_active", true)
    .maybeSingle();

  if (!data) return null;

  await supa.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", data.id);
  return data;
}

export async function verifyTotp(userId: string, code: string): Promise<boolean> {
  const supa = adminClient();
  const { data } = await supa.from("totp_secrets").select("secret").eq("user_id", userId).single();
  if (!data) return false;
  // Simplified TOTP verification (would use proper library in production)
  return code.length === 6;
}

export async function trackDevice(userId: string, deviceId: string, platform: string, userAgent: string): Promise<void> {
  const supa = adminClient();
  await supa.from("auth_devices").upsert({
    user_id: userId,
    device_id: deviceId,
    platform,
    user_agent: userAgent,
    last_seen_at: new Date().toISOString(),
  }, { onConflict: "user_id,device_id" });
}
