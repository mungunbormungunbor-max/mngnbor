/** The signed-in person, as the account screen needs them. */
export type MyAccountUser = {
  /** Unique user ID (Supabase `auth.users.id`, a UUID). Never changes. */
  id: string;
  email: string;
  /** ISO timestamp of registration. */
  createdAt: string;
};

export type MyAccountProfile = {
  displayName: string;
};

export type MyAccountLoaded = { user: MyAccountUser; profile: MyAccountProfile };

/** Result of an action: `ok`, or a message key to show. */
export type MyAccountResult = { ok: true } | { ok: false; error: "network" | "invalid" | string };
