import type { TodayViewItem } from "./types";

/*
 * Stage 1 data source for today-view: plan items kept in localStorage.
 * No Supabase here. In Stage 3 this file is the one place to swap for real data.
 *
 * The key is named after the `plan_items` table (not a feature) so every feature's
 * Stage 1 mock reads the same per-day list. Format: "daily-plan:plan-items:YYYY-MM-DD".
 */

const STORAGE_PREFIX = "daily-plan:plan-items:";

/** Local calendar date as "YYYY-MM-DD" (matches the `plan_date` column). */
export function toTodayViewDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function loadTodayViewItems(dateKey: string): TodayViewItem[] {
  const raw = window.localStorage.getItem(STORAGE_PREFIX + dateKey);
  if (raw === null) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TodayViewItem[]) : [];
  } catch {
    return [];
  }
}

export function saveTodayViewItems(dateKey: string, items: TodayViewItem[]): void {
  window.localStorage.setItem(STORAGE_PREFIX + dateKey, JSON.stringify(items));
}

/** Timed items first, by time; then untimed items in their saved order. */
export function sortTodayViewItems(items: TodayViewItem[]): TodayViewItem[] {
  return [...items].sort((a, b) => {
    if (a.startTime && b.startTime) {
      return a.startTime.localeCompare(b.startTime) || a.sortOrder - b.sortOrder;
    }
    if (a.startTime) return -1;
    if (b.startTime) return 1;
    return a.sortOrder - b.sortOrder;
  });
}

/** An item counts as "Now" from its start time until this many minutes later. */
const NOW_WINDOW_MINUTES = 30;

function minutesOf(startTime: string): number {
  const [h, m] = startTime.split(":").map(Number);
  return h * 60 + m;
}

export type TodayViewItemStatus = "now" | "next" | "missed" | null;

/**
 * Status badges for the glanceable list:
 * - "now":    not done, started within the last 30 minutes (only the first such item)
 * - "next":   the first upcoming not-done item, when nothing is "now"
 * - "missed": not done and started more than 30 minutes ago
 */
export function getTodayViewStatuses(
  sortedItems: TodayViewItem[],
  now: Date,
): Map<string, TodayViewItemStatus> {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const statuses = new Map<string, TodayViewItemStatus>();
  let highlighted = false;

  for (const item of sortedItems) {
    if (item.isDone || !item.startTime) continue;
    const start = minutesOf(item.startTime);
    if (start < nowMin - NOW_WINDOW_MINUTES) {
      statuses.set(item.id, "missed");
    } else if (!highlighted) {
      statuses.set(item.id, start <= nowMin ? "now" : "next");
      highlighted = true;
    }
  }
  return statuses;
}

export function getTodayViewGreeting(now: Date): string {
  const h = now.getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/** "07:00" -> "7:00 AM" in the user's locale. */
export function formatTodayViewTime(startTime: string): string {
  const [h, m] = startTime.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
