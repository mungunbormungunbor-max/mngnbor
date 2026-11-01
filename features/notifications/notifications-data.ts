import { scopeKey } from "@/lib/user-scope/user-scope";
import type { NotificationsItem, NotificationsLead, NotificationsPrefs } from "./types";

/*
 * Stage 1 data for notifications: preferences and "already sent" markers live in localStorage.
 * Plan items are read from the shared key (named after the `plan_items` table).
 * In Stage 3 real background push replaces the timer in notifications-scheduler.tsx.
 */

const ITEMS_PREFIX = "daily-plan:plan-items:";
const PREFS_KEY = "daily-plan:notifications-prefs";
const FIRED_PREFIX = "daily-plan:notifications-fired:";

export const NOTIFICATIONS_PREFS_EVENT = "daily-plan:notifications-prefs-changed";
export const NOTIFICATIONS_LEADS: NotificationsLead[] = [0, 5, 10, 30];

/** A reminder still fires if the app wakes up this many minutes after the item's time. */
const LATE_GRACE_MINUTES = 15;

const DEFAULT_PREFS: NotificationsPrefs = { enabled: false, lead: 0 };

export function loadNotificationsPrefs(): NotificationsPrefs {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(scopeKey(PREFS_KEY)) ?? "{}");
    const lead = NOTIFICATIONS_LEADS.includes(parsed?.lead) ? (parsed.lead as NotificationsLead) : DEFAULT_PREFS.lead;
    return { enabled: parsed?.enabled === true, lead };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function saveNotificationsPrefs(prefs: NotificationsPrefs): void {
  window.localStorage.setItem(scopeKey(PREFS_KEY), JSON.stringify(prefs));
  window.dispatchEvent(new Event(NOTIFICATIONS_PREFS_EVENT));
}

export function toNotificationsDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function loadNotificationsItems(dateKey: string): NotificationsItem[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(scopeKey(ITEMS_PREFIX + dateKey)) ?? "[]");
    return Array.isArray(parsed) ? (parsed as NotificationsItem[]) : [];
  } catch {
    return [];
  }
}

/* ---------- "already sent" markers ---------- */

function firedKey(dateKey: string): string {
  return scopeKey(FIRED_PREFIX + dateKey);
}

function markerOf(item: NotificationsItem, lead: NotificationsLead): string {
  // Includes the time so moving an item to a new time reminds again.
  return `${item.id}@${item.startTime}+${lead}`;
}

export function loadNotificationsFired(dateKey: string): Set<string> {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(firedKey(dateKey)) ?? "[]");
    return new Set(Array.isArray(parsed) ? (parsed as string[]) : []);
  } catch {
    return new Set();
  }
}

export function markNotificationsFired(dateKey: string, item: NotificationsItem, lead: NotificationsLead): void {
  const fired = loadNotificationsFired(dateKey);
  fired.add(markerOf(item, lead));
  window.localStorage.setItem(firedKey(dateKey), JSON.stringify([...fired]));
}

/** Drops markers from earlier days so localStorage doesn't grow forever. */
export function pruneNotificationsFired(todayKey: string): void {
  const keep = firedKey(todayKey);
  for (let i = window.localStorage.length - 1; i >= 0; i--) {
    const key = window.localStorage.key(i);
    if (key?.startsWith(scopeKey(FIRED_PREFIX)) && key !== keep) window.localStorage.removeItem(key);
  }
}

/* ---------- which items are due ---------- */

export type NotificationsDue = { item: NotificationsItem; minutesUntil: number };

/**
 * Not-done items with a time whose reminder moment has arrived and that haven't been sent yet.
 * `minutesUntil` is 0 when the item is starting (or already started within the grace window).
 */
export function getDueNotifications(
  items: NotificationsItem[],
  now: Date,
  lead: NotificationsLead,
  fired: Set<string>,
): NotificationsDue[] {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const due: NotificationsDue[] = [];
  for (const item of items) {
    if (item.isDone || !item.startTime) continue;
    const [h, m] = item.startTime.split(":").map(Number);
    const start = h * 60 + m;
    if (nowMin < start - lead || nowMin > start + LATE_GRACE_MINUTES) continue;
    if (fired.has(markerOf(item, lead))) continue;
    due.push({ item, minutesUntil: Math.max(0, start - nowMin) });
  }
  return due;
}
