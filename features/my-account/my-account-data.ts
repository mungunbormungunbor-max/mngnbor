import { createClient } from "@/lib/supabase/client";
import type { MyAccountLoaded, MyAccountResult } from "./types";

/*
 * Stage 3 data layer for my-account: talks to Supabase from the browser. The session cookie identifies
 * the user, and row level security (sql/my-account.sql) makes sure they can only touch their own row.
 */

export const MY_ACCOUNT_NAME_MAX = 60;
export const MY_ACCOUNT_PASSWORD_MIN = 8;

export function cleanMyAccountName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

/** The current user and their profile. `null` when nobody is signed in. Throws on a network/server error. */
export async function loadMyAccount(): Promise<MyAccountLoaded | null> {
  const supabase = createClient();
  // getUser() asks the Supabase server to verify the session, unlike getSession() which trusts the cookie.
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    if (error && error.name !== "AuthSessionMissingError") throw error;
    return null;
  }
  const user = data.user;

  const { data: row, error: profileError } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) throw profileError;

  const metaName = typeof user.user_metadata?.display_name === "string" ? user.user_metadata.display_name : "";
  return {
    user: { id: user.id, email: user.email ?? "", createdAt: user.created_at },
    profile: { displayName: row?.display_name ?? metaName },
  };
}

export async function saveMyAccountName(userId: string, displayName: string): Promise<MyAccountResult> {
  const name = cleanMyAccountName(displayName);
  if (name.length > MY_ACCOUNT_NAME_MAX) return { ok: false, error: "invalid" };
  // upsert also covers an account whose profile row was never created.
  const { error } = await createClient().from("profiles").upsert({ id: userId, display_name: name });
  return error ? { ok: false, error: "network" } : { ok: true };
}

export async function changeMyAccountPassword(password: string): Promise<MyAccountResult> {
  if (password.length < MY_ACCOUNT_PASSWORD_MIN) return { ok: false, error: "invalid" };
  const { error } = await createClient().auth.updateUser({ password });
  // Supabase's own message (e.g. "New password should be different") is useful, so pass it on.
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function signOutMyAccount(): Promise<void> {
  await createClient().auth.signOut();
}

/** Removes this user's on-device plans, money records and settings (everything under their scope). */
export function clearMyAccountLocalData(userId: string): void {
  const prefix = `user:${userId}:`;
  for (let i = window.localStorage.length - 1; i >= 0; i--) {
    const key = window.localStorage.key(i);
    if (key?.startsWith(prefix)) window.localStorage.removeItem(key);
  }
}

/** Permanently deletes the account on the server (see delete_my_account in sql/my-account.sql). */
export async function deleteMyAccount(userId: string): Promise<MyAccountResult> {
  const supabase = createClient();
  const { error } = await supabase.rpc("delete_my_account");
  if (error) return { ok: false, error: "network" };
  clearMyAccountLocalData(userId);
  await supabase.auth.signOut();
  return { ok: true };
}
