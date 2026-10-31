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

/** One-line "what's next" summary under the date. Null when nothing timed is left. */
export function getTodayViewNextUp(
  sortedItems: TodayViewItem[],
  statuses: Map<string, TodayViewItemStatus>,
  now: Date,
): { item: TodayViewItem; text: string; isNow: boolean } | null {
  const item = sortedItems.find((it) => {
    const s = statuses.get(it.id);
    return s === "now" || s === "next";
  });
  if (!item?.startTime) return null;
  const diff = minutesOf(item.startTime) - (now.getHours() * 60 + now.getMinutes());
  if (diff <= 0) return { item, text: "happening now", isNow: true };
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  const text = h === 0 ? `in ${m} min` : m === 0 ? `in ${h} h` : `in ${h} h ${m} min`;
  return { item, text, isNow: false };
}

/**
 * Consecutive days (ending today or yesterday) on which every planned item was done.
 * Today only counts once it's fully done, so an unfinished today doesn't break the streak.
 */
export function getTodayViewStreak(today: Date): number {
  let streak = 0;
  const day = new Date(today);
  for (let i = 0; i < 366; i++) {
    const items = loadTodayViewItems(toTodayViewDateKey(day));
    const complete = items.length > 0 && items.every((it) => it.isDone);
    if (complete) streak++;
    else if (i > 0) break; // today unfinished: keep counting from yesterday
    day.setDate(day.getDate() - 1);
  }
  return streak;
}

/* ---------- streak points ---------- */

export const TODAY_VIEW_POINTS_PER_ITEM = 10;
export const TODAY_VIEW_STREAK_BONUS = 5;

const POINTS_PREFIX = "daily-plan:today-view-points:";

/** Points a day is worth: 10 per done item, plus 5 x streak days when everything is done. */
export function computeTodayViewDayPoints(items: TodayViewItem[], streak: number): number {
  const done = items.filter((it) => it.isDone).length;
  const allDone = items.length > 0 && done === items.length;
  return done * TODAY_VIEW_POINTS_PER_ITEM + (allDone ? streak * TODAY_VIEW_STREAK_BONUS : 0);
}

/** Streak bonus alone, for the "+15 streak bonus" label. */
export function getTodayViewStreakBonus(streak: number): number {
  return streak * TODAY_VIEW_STREAK_BONUS;
}

/**
 * Points are kept per day (not as a running total), so un-ticking an item takes its points back
 * and toggling can't farm them. Deleting items in plan-editor doesn't erase points already earned.
 */
export function saveTodayViewDayPoints(dateKey: string, points: number): void {
  if (points <= 0) window.localStorage.removeItem(POINTS_PREFIX + dateKey);
  else window.localStorage.setItem(POINTS_PREFIX + dateKey, String(points));
}

export function hasTodayViewDayPoints(dateKey: string): boolean {
  return window.localStorage.getItem(POINTS_PREFIX + dateKey) !== null;
}

export function loadTodayViewTotalPoints(): number {
  let total = 0;
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (!key?.startsWith(POINTS_PREFIX)) continue;
    const n = Number(window.localStorage.getItem(key));
    if (Number.isFinite(n) && n > 0) total += n;
  }
  return total;
}

/** A small rank that gives the points something to work towards. */
export function getTodayViewLevel(points: number): { name: string; next: number | null } {
  const levels = [
    { name: "Starter", min: 0 },
    { name: "Planner", min: 100 },
    { name: "Achiever", min: 300 },
    { name: "Pro", min: 700 },
    { name: "Legend", min: 1500 },
  ];
  let idx = 0;
  levels.forEach((l, i) => {
    if (points >= l.min) idx = i;
  });
  return { name: levels[idx].name, next: levels[idx + 1]?.min ?? null };
}

/* ---------- display preferences (today-view only) ---------- */

const PREFS_KEY = "daily-plan:today-view-prefs";

export type TodayViewPrefs = { hideDone: boolean };

export function loadTodayViewPrefs(): TodayViewPrefs {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(PREFS_KEY) ?? "{}");
    return { hideDone: parsed?.hideDone === true };
  } catch {
    return { hideDone: false };
  }
}

export function saveTodayViewPrefs(prefs: TodayViewPrefs): void {
  window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

/* ---------- look & feel ---------- */

export type TodayViewSky = { icon: string; glow: string };

/** Header glow + icon that follow the time of day. */
export function getTodayViewSky(now: Date): TodayViewSky {
  const h = now.getHours();
  if (h >= 5 && h < 8) return { icon: "🌅", glow: "from-orange-300/45 via-pink-300/25" };
  if (h >= 8 && h < 17) return { icon: "☀️", glow: "from-sky-300/45 via-amber-200/25" };
  if (h >= 17 && h < 20) return { icon: "🌇", glow: "from-orange-400/40 via-purple-400/25" };
  return { icon: "🌙", glow: "from-indigo-500/40 via-violet-500/20" };
}

const CELEBRATION_MESSAGES = [
  "All done for today! 🎉",
  "Clean sweep! ✨",
  "Nailed it! 🙌",
  "Day conquered! 🏆",
  "Nothing left. Enjoy! 🌈",
];

export function pickTodayViewCelebration(): string {
  return CELEBRATION_MESSAGES[Math.floor(Math.random() * CELEBRATION_MESSAGES.length)];
}

/** "07:00" -> "7:00 AM" in the user's locale. */
export function formatTodayViewTime(startTime: string): string {
  const [h, m] = startTime.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
