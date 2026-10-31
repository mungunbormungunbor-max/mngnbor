import type { PlanEditorDraft, PlanEditorItem } from "./types";

/*
 * Stage 1 data source for plan-editor: plan items kept in localStorage.
 * No Supabase here. In Stage 3 this file is the one place to swap for real data.
 *
 * Shared Stage 1 key (named after the `plan_items` table): "daily-plan:plan-items:YYYY-MM-DD".
 */

const STORAGE_PREFIX = "daily-plan:plan-items:";
const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Local calendar date as "YYYY-MM-DD" (matches the `plan_date` column). */
export function toPlanEditorDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Returns the key if it's a real "YYYY-MM-DD" date, otherwise null. */
export function parsePlanEditorDateKey(value: string | null | undefined): string | null {
  if (!value || !DATE_KEY_RE.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d ? value : null;
}

export function planEditorDateFromKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function loadPlanEditorItems(dateKey: string): PlanEditorItem[] {
  const raw = window.localStorage.getItem(STORAGE_PREFIX + dateKey);
  if (raw === null) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PlanEditorItem[]) : [];
  } catch {
    return [];
  }
}

export function savePlanEditorItems(dateKey: string, items: PlanEditorItem[]): void {
  if (items.length === 0) {
    window.localStorage.removeItem(STORAGE_PREFIX + dateKey);
  } else {
    window.localStorage.setItem(STORAGE_PREFIX + dateKey, JSON.stringify(items));
  }
}

export function newPlanEditorId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Splits items into time-sorted "scheduled" and manually ordered "anytime" lists. */
export function splitPlanEditorItems(items: PlanEditorItem[]) {
  const scheduled = items
    .filter((it) => it.startTime)
    .sort((a, b) => a.startTime!.localeCompare(b.startTime!) || a.sortOrder - b.sortOrder);
  const anytime = items.filter((it) => !it.startTime).sort((a, b) => a.sortOrder - b.sortOrder);
  return { scheduled, anytime };
}

export function nextPlanEditorSortOrder(items: PlanEditorItem[]): number {
  return items.reduce((max, it) => Math.max(max, it.sortOrder), -1) + 1;
}

/** Trims a form draft into stored values. Returns null if the title is empty. */
export function cleanPlanEditorDraft(
  draft: PlanEditorDraft,
): Pick<PlanEditorItem, "title" | "startTime" | "note"> | null {
  const title = draft.title.trim();
  if (!title) return null;
  return {
    title,
    startTime: draft.startTime || null,
    note: draft.note.trim() || null,
  };
}

/** "07:00" -> "7:00 AM" in the user's locale. */
export function formatPlanEditorTime(startTime: string): string {
  const [h, m] = startTime.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/* ---------- date helpers ---------- */

/** "2026-10-30" + 1 -> "2026-10-31" (handles month/year ends). */
export function shiftPlanEditorDateKey(dateKey: string, deltaDays: number): string {
  const d = planEditorDateFromKey(dateKey);
  d.setDate(d.getDate() + deltaDays);
  return toPlanEditorDateKey(d);
}

/* ---------- smart quick-add ---------- */

export type PlanEditorSmartParse = {
  /** Title with the time words removed ("Gym"). */
  title: string;
  /** "HH:MM" (24h). */
  startTime: string;
  /** The text that was recognised ("at 7pm"). */
  matched: string;
};

function toHHMM(h: number, m: number): string {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Finds a time inside free text: "Gym at 7pm", "Call mom 6:30 pm", "Stand-up at 09:30", "Lunch at noon".
 * Returns null when there is no time, or when removing it would leave an empty title.
 */
export function parsePlanEditorSmartTitle(raw: string): PlanEditorSmartParse | null {
  const text = raw.trim();
  if (!text) return null;

  let found: { index: number; length: number; startTime: string } | null = null;

  const twelveHour = /\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i.exec(text);
  if (twelveHour) {
    const hour = Number(twelveHour[1]);
    const minute = Number(twelveHour[2] ?? 0);
    if (hour >= 1 && hour <= 12 && minute < 60) {
      const pm = twelveHour[3].toLowerCase() === "pm";
      const h24 = (hour % 12) + (pm ? 12 : 0);
      found = { index: twelveHour.index, length: twelveHour[0].length, startTime: toHHMM(h24, minute) };
    }
  }

  if (!found) {
    const twentyFour = /\b(?:at\s+)?([01]?\d|2[0-3]):([0-5]\d)\b/i.exec(text);
    if (twentyFour) {
      found = {
        index: twentyFour.index,
        length: twentyFour[0].length,
        startTime: toHHMM(Number(twentyFour[1]), Number(twentyFour[2])),
      };
    }
  }

  if (!found) {
    const noon = /\b(?:at\s+)?noon\b/i.exec(text);
    if (noon) found = { index: noon.index, length: noon[0].length, startTime: "12:00" };
  }

  if (!found) return null;

  const matched = text.slice(found.index, found.index + found.length);
  const title = (text.slice(0, found.index) + " " + text.slice(found.index + found.length))
    .replace(/\s+/g, " ")
    .replace(/^[\s,;:@-]+|[\s,;:@-]+$/g, "")
    .trim();
  if (!title) return null;
  return { title, startTime: found.startTime, matched };
}

/* ---------- quick time chips ---------- */

export const PLAN_EDITOR_QUICK_TIMES: { label: string; value: string }[] = [
  { label: "Morning", value: "08:00" },
  { label: "Noon", value: "12:00" },
  { label: "Afternoon", value: "15:00" },
  { label: "Evening", value: "19:00" },
];

/** One hour from now, rounded up to the next 5 minutes. Null if that would pass midnight. */
export function planEditorInOneHour(now: Date): string | null {
  const total = now.getHours() * 60 + now.getMinutes() + 60;
  const rounded = Math.ceil(total / 5) * 5;
  if (rounded >= 24 * 60) return null;
  return toHHMM(Math.floor(rounded / 60), rounded % 60);
}

/* ---------- history-based helpers ---------- */

/** Titles used in the last `days` days (including the viewed day), most frequent first. */
export function loadRecentPlanEditorTitles(fromKey: string, days = 14): string[] {
  const counts = new Map<string, { title: string; count: number; recent: number }>();
  for (let i = 0; i < days; i++) {
    const items = loadPlanEditorItems(shiftPlanEditorDateKey(fromKey, -i));
    for (const it of items) {
      const k = it.title.trim().toLowerCase();
      if (!k) continue;
      const entry = counts.get(k);
      if (entry) entry.count += 1;
      else counts.set(k, { title: it.title.trim(), count: 1, recent: i });
    }
  }
  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.recent - b.recent)
    .map((e) => e.title)
    .slice(0, 30);
}

/** Not-done items from the day before `dateKey`. */
export function loadUnfinishedFromPreviousDay(dateKey: string): PlanEditorItem[] {
  return loadPlanEditorItems(shiftPlanEditorDateKey(dateKey, -1)).filter((it) => !it.isDone);
}

const CARRY_DISMISSED_PREFIX = "daily-plan:plan-editor-carry-dismissed:";

export function isPlanEditorCarryDismissed(dateKey: string): boolean {
  return window.localStorage.getItem(CARRY_DISMISSED_PREFIX + dateKey) === "1";
}

export function dismissPlanEditorCarry(dateKey: string): void {
  window.localStorage.setItem(CARRY_DISMISSED_PREFIX + dateKey, "1");
}

/** Items that share a start time with another item: id -> title of the first other item. */
export function findPlanEditorTimeConflicts(items: PlanEditorItem[]): Map<string, string> {
  const byTime = new Map<string, PlanEditorItem[]>();
  for (const it of items) {
    if (!it.startTime) continue;
    byTime.set(it.startTime, [...(byTime.get(it.startTime) ?? []), it]);
  }
  const conflicts = new Map<string, string>();
  for (const group of byTime.values()) {
    if (group.length < 2) continue;
    for (const it of group) conflicts.set(it.id, group.find((o) => o.id !== it.id)!.title);
  }
  return conflicts;
}
