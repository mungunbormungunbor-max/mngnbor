/*
 * Per-user separation of on-device data.
 *
 * Until plans and money records live in the database, they are kept in this browser's localStorage.
 * Without a scope, two accounts signing in on the same phone would see each other's data. Every
 * storage key therefore goes through `scopeKey`, which prefixes it with the signed-in user's ID.
 * Signed-out (guest) use keeps the original, unprefixed keys.
 */

let activeUserId: string | null = null;

export function setActiveUser(userId: string | null): void {
  activeUserId = userId;
}

export function getActiveUser(): string | null {
  return activeUserId;
}

/** "daily-plan:money-entries" -> "user:<id>:daily-plan:money-entries" for a signed-in user. */
export function scopeKey(key: string): string {
  return activeUserId ? `user:${activeUserId}:${key}` : key;
}
