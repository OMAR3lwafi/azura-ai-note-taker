// STT token issuance helper using KV as short-lived token store
import { kv } from "../_shared/kv.ts";

const TTL_SECONDS = 90;

export async function issueSttToken(userId: string) {
  const provider = Deno.env.get("STT_PROVIDER") ?? "mock";
  const token = crypto.randomUUID();
  const payload = {
    userId,
    provider,
    issuedAt: Date.now(),
    expiresAt: Date.now() + TTL_SECONDS * 1000,
  };
  await kv.set(`stt:token:${token}`, JSON.stringify(payload), TTL_SECONDS);
  return { token, provider, expiresIn: TTL_SECONDS };
}
