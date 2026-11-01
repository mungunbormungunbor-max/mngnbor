import { cache } from "react";
import { createClient } from "./server";
import { isSupabaseConfigured } from "./env";

/**
 * The signed-in user's unique ID (a UUID), or null for guests / before Supabase is connected.
 * `getClaims()` verifies the session token's signature, so this is safe to trust for the ID.
 * Memoised per request.
 */
export const getServerUserId = cache(async (): Promise<string | null> => {
  if (!isSupabaseConfigured) return null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    return typeof data?.claims?.sub === "string" ? data.claims.sub : null;
  } catch {
    return null;
  }
});
