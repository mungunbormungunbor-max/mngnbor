"use client";

import type { ReactNode } from "react";
import { setActiveUser } from "./user-scope";

/**
 * Tells the data layer which user is signed in (null = guest). The ID comes from the server layout.
 * It is set while rendering, so it is already in place before any child component reads its data.
 */
export function UserScopeProvider({ userId, children }: { userId: string | null; children: ReactNode }) {
  setActiveUser(userId);
  return children;
}
