import type { MessageKey } from "@/lib/i18n/messages";
import type {
  MoneyTrackerCurrency,
  MoneyTrackerEntry,
  MoneyTrackerKind,
  MoneyTrackerPrefs,
  MoneyTrackerTotals,
} from "./types";

/*
 * Stage 1 data source for money-tracker: records kept in localStorage. No Supabase here.
 * In Stage 3 this file is the one place to swap for real data.
 * Key is named after the future `money_entries` table: "daily-plan:money-entries".
 */

const ENTRIES_KEY = "daily-plan:money-entries";
const PREFS_KEY = "daily-plan:money-prefs";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_AMOUNT = 1_000_000_000_000;

export const MONEY_TRACKER_CURRENCIES: MoneyTrackerCurrency[] = ["MNT", "USD", "EUR"];

export type MoneyTrackerCategory = { id: string; icon: string; label: MessageKey };

export const MONEY_TRACKER_CATEGORIES: Record<MoneyTrackerKind, MoneyTrackerCategory[]> = {
  expense: [
    { id: "food", icon: "🍜", label: "money.cat.food" },
    { id: "transport", icon: "🚌", label: "money.cat.transport" },
    { id: "bills", icon: "💡", label: "money.cat.bills" },
    { id: "shopping", icon: "🛍️", label: "money.cat.shopping" },
    { id: "health", icon: "💊", label: "money.cat.health" },
    { id: "fun", icon: "🎉", label: "money.cat.fun" },
    { id: "other", icon: "📦", label: "money.cat.other" },
  ],
  income: [
    { id: "salary", icon: "💼", label: "money.cat.salary" },
    { id: "business", icon: "🏪", label: "money.cat.business" },
    { id: "gift", icon: "🎁", label: "money.cat.gift" },
    { id: "other", icon: "📦", label: "money.cat.other" },
  ],
};

/** Looks a category up; unknown ids fall back to "other". */
export function getMoneyTrackerCategory(kind: MoneyTrackerKind, id: string): MoneyTrackerCategory {
  const list = MONEY_TRACKER_CATEGORIES[kind];
  return list.find((c) => c.id === id) ?? list[list.length - 1];
}

/* ---------- storage ---------- */

function isEntry(value: unknown): value is MoneyTrackerEntry {
  const e = value as Partial<MoneyTrackerEntry> | null;
  return (
    !!e &&
    typeof e.id === "string" &&
    (e.kind === "income" || e.kind === "expense") &&
    typeof e.amount === "number" &&
    Number.isFinite(e.amount) &&
    e.amount > 0 &&
    typeof e.category === "string" &&
    typeof e.date === "string" &&
    DATE_RE.test(e.date)
  );
}

export function loadMoneyTrackerEntries(): MoneyTrackerEntry[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(ENTRIES_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isEntry).map((e) => ({ ...e, note: e.note ?? null, createdAt: e.createdAt ?? 0 }));
  } catch {
    return [];
  }
}

export function saveMoneyTrackerEntries(entries: MoneyTrackerEntry[]): void {
  window.localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
}

export function loadMoneyTrackerPrefs(defaultCurrency: MoneyTrackerCurrency): MoneyTrackerPrefs {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(PREFS_KEY) ?? "{}");
    return {
      currency: MONEY_TRACKER_CURRENCIES.includes(parsed?.currency) ? parsed.currency : defaultCurrency,
    };
  } catch {
    return { currency: defaultCurrency };
  }
}

export function saveMoneyTrackerPrefs(prefs: MoneyTrackerPrefs): void {
  window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export function newMoneyTrackerId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/* ---------- dates ---------- */

export function toMoneyTrackerDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function moneyTrackerDateFromKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** "2026-10-31" -> "2026-10". */
export function toMoneyTrackerMonthKey(dateKey: string): string {
  return dateKey.slice(0, 7);
}

/** "2026-12" + 1 -> "2027-01". */
export function shiftMoneyTrackerMonthKey(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/* ---------- amounts ---------- */

/** "1,250.50" / "1 250,5" -> 1250.5. Null unless it is a number above 0 (and below a sane limit). */
export function parseMoneyTrackerAmount(text: string): number | null {
  const cleaned = text.trim().replace(/\s/g, "");
  if (!cleaned) return null;
  // A lone comma is a decimal comma ("12,5"); otherwise commas are thousands separators ("1,250").
  const normalised = /^\d+,\d{1,2}$/.test(cleaned) ? cleaned.replace(",", ".") : cleaned.replace(/,/g, "");
  if (!/^\d+(\.\d+)?$/.test(normalised)) return null;
  const value = Math.round(Number(normalised) * 100) / 100;
  return value > 0 && value < MAX_AMOUNT ? value : null;
}

/** "₮12,500" / "$12.50" in the given locale (undefined = the phone's own). */
export function formatMoneyTrackerAmount(amount: number, currency: MoneyTrackerCurrency, locale?: string): string {
  const digits = currency === "MNT" ? 0 : 2;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currencyDisplay: "narrowSymbol",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount);
}

/** Plain number for the edit form: 12500 -> "12500", 12.5 -> "12.5". */
export function amountToMoneyTrackerText(amount: number): string {
  return String(amount);
}

/* ---------- totals and grouping ---------- */

export function getMoneyTrackerTotals(entries: MoneyTrackerEntry[]): MoneyTrackerTotals {
  let income = 0;
  let expense = 0;
  for (const e of entries) {
    if (e.kind === "income") income += e.amount;
    else expense += e.amount;
  }
  // Round once at the end so cents never drift.
  income = Math.round(income * 100) / 100;
  expense = Math.round(expense * 100) / 100;
  return { income, expense, balance: Math.round((income - expense) * 100) / 100 };
}

/** Entries inside one month ("YYYY-MM"), or all of them when `monthKey` is null. */
export function filterMoneyTrackerEntries(entries: MoneyTrackerEntry[], monthKey: string | null): MoneyTrackerEntry[] {
  return monthKey === null ? entries : entries.filter((e) => e.date.startsWith(monthKey));
}

/** Newest day first; within a day, newest record first. */
export function groupMoneyTrackerEntries(entries: MoneyTrackerEntry[]): { date: string; entries: MoneyTrackerEntry[] }[] {
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  const groups: { date: string; entries: MoneyTrackerEntry[] }[] = [];
  for (const entry of sorted) {
    const last = groups[groups.length - 1];
    if (last?.date === entry.date) last.entries.push(entry);
    else groups.push({ date: entry.date, entries: [entry] });
  }
  return groups;
}
