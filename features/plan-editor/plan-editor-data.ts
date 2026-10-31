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
