"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppMenu } from "@/components/app-menu";
import { useI18n } from "@/lib/i18n/provider";
import {
  MONEY_TRACKER_CURRENCIES,
  filterMoneyTrackerEntries,
  getMoneyTrackerTotals,
  groupMoneyTrackerEntries,
  loadMoneyTrackerEntries,
  loadMoneyTrackerPrefs,
  moneyTrackerDateFromKey,
  newMoneyTrackerId,
  saveMoneyTrackerEntries,
  saveMoneyTrackerPrefs,
  shiftMoneyTrackerMonthKey,
  toMoneyTrackerDateKey,
  toMoneyTrackerMonthKey,
} from "./money-tracker-data";
import { MoneyTrackerEntryRow } from "./money-tracker-entry-row";
import { MoneyTrackerForm } from "./money-tracker-form";
import { MoneyTrackerSummary } from "./money-tracker-summary";
import type { MoneyTrackerCurrency, MoneyTrackerEntry, MoneyTrackerInput, MoneyTrackerKind } from "./types";

const UNDO_MS = 5000;

type Period = "month" | "all";
type KindFilter = "all" | MoneyTrackerKind;
type Undo = { entry: MoneyTrackerEntry; n: number };

const FILTERS: { value: KindFilter; label: "money.filterAll" | "money.kindIncome" | "money.kindExpense" }[] = [
  { value: "all", label: "money.filterAll" },
  { value: "income", label: "money.kindIncome" },
  { value: "expense", label: "money.kindExpense" },
];

const ARROW =
  "flex size-10 shrink-0 items-center justify-center rounded-full text-xl transition-colors active:bg-black/5 dark:active:bg-white/10";

export function MoneyTrackerScreen() {
  const { t, lang, locale } = useI18n();
  // Everything below depends on localStorage and the phone's clock, so it is read on the client only.
  const [entries, setEntries] = useState<MoneyTrackerEntry[] | null>(null);
  const [currency, setCurrency] = useState<MoneyTrackerCurrency>("MNT");
  const [todayKey, setTodayKey] = useState("");
  const [monthKey, setMonthKey] = useState("");
  const [period, setPeriod] = useState<Period>("month");
  const [filter, setFilter] = useState<KindFilter>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [undo, setUndo] = useState<Undo | null>(null);

  useEffect(() => {
    const today = toMoneyTrackerDateKey(new Date());
    /* eslint-disable react-hooks/set-state-in-effect -- client-only localStorage and clock reads */
    setTodayKey(today);
    setMonthKey(toMoneyTrackerMonthKey(today));
    setCurrency(loadMoneyTrackerPrefs(lang === "mn" ? "MNT" : "USD").currency);
    setEntries(loadMoneyTrackerEntries());
    /* eslint-enable react-hooks/set-state-in-effect */
    // The default currency depends on the language only the first time; later it is the saved choice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!undo) return;
    const timer = window.setTimeout(() => setUndo(null), UNDO_MS);
    return () => window.clearTimeout(timer);
  }, [undo]);

  function commit(next: MoneyTrackerEntry[]) {
    saveMoneyTrackerEntries(next);
    setEntries(next);
  }

  function addEntry(input: MoneyTrackerInput) {
    if (!entries) return;
    navigator.vibrate?.(10);
    commit([...entries, { ...input, id: newMoneyTrackerId(), createdAt: Date.now() }]);
    // Jump to the month the record landed in, so it is never added "out of sight".
    if (period === "month") setMonthKey(toMoneyTrackerMonthKey(input.date));
  }

  function saveEntry(id: string, input: MoneyTrackerInput) {
    if (!entries) return;
    commit(entries.map((e) => (e.id === id ? { ...e, ...input } : e)));
    setEditingId(null);
    if (period === "month") setMonthKey(toMoneyTrackerMonthKey(input.date));
  }

  function deleteEntry(id: string) {
    if (!entries) return;
    const entry = entries.find((e) => e.id === id);
    if (!entry) return;
    navigator.vibrate?.(15);
    commit(entries.filter((e) => e.id !== id));
    setEditingId(null);
    setUndo((u) => ({ entry, n: (u?.n ?? 0) + 1 }));
  }

  function runUndo() {
    if (!entries || !undo) return;
    commit([...entries, undo.entry]);
    setUndo(null);
  }

  function changeCurrency(next: MoneyTrackerCurrency) {
    setCurrency(next);
    saveMoneyTrackerPrefs({ currency: next });
  }

  const inPeriod = entries ? filterMoneyTrackerEntries(entries, period === "month" ? monthKey : null) : [];
  // Totals always cover the whole period; the Income/Expense filter only narrows the list below.
  const totals = getMoneyTrackerTotals(inPeriod);
  const shown = filter === "all" ? inPeriod : inPeriod.filter((e) => e.kind === filter);
  const groups = groupMoneyTrackerEntries(shown);

  const monthLabel = monthKey
    ? moneyTrackerDateFromKey(`${monthKey}-01`).toLocaleDateString(locale, { month: "long", year: "numeric" })
    : " ";

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(6rem,env(safe-area-inset-bottom))]">
      <header className="mb-4 flex items-center gap-3">
        <Link
          href="/today-view"
          aria-label={t("money.back")}
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-black/15 text-xl active:bg-black/5 dark:border-white/20 dark:active:bg-white/10"
        >
          ←
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-3xl font-bold tracking-tight">{t("money.title")}</h1>
        <AppMenu className="shrink-0" />
      </header>

      <div className="mb-3 flex items-center gap-2">
        <div role="radiogroup" className="grid flex-1 grid-cols-2 gap-1 rounded-xl bg-black/[0.06] p-1 dark:bg-white/10">
          {(["month", "all"] as const).map((p) => (
            <button
              key={p}
              type="button"
              role="radio"
              aria-checked={period === p}
              onClick={() => setPeriod(p)}
              className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
                period === p ? "bg-brand-600 text-white shadow" : "text-black/65 dark:text-white/70"
              }`}
            >
              {p === "month" ? t("money.periodMonth") : t("money.periodAll")}
            </button>
          ))}
        </div>
        <select
          aria-label={t("money.currency")}
          value={currency}
          onChange={(e) => changeCurrency(e.target.value as MoneyTrackerCurrency)}
          className="rounded-xl border border-black/15 bg-transparent px-2 py-2.5 text-sm font-semibold dark:border-white/20"
        >
          {MONEY_TRACKER_CURRENCIES.map((c) => (
            <option key={c} value={c} className="text-black">
              {c}
            </option>
          ))}
        </select>
      </div>

      {period === "month" && (
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            aria-label={t("money.prevMonth")}
            onClick={() => setMonthKey(shiftMoneyTrackerMonthKey(monthKey, -1))}
            className={ARROW}
          >
            ‹
          </button>
          <p className="text-lg font-semibold capitalize">{monthLabel}</p>
          <button
            type="button"
            aria-label={t("money.nextMonth")}
            onClick={() => setMonthKey(shiftMoneyTrackerMonthKey(monthKey, 1))}
            className={ARROW}
          >
            ›
          </button>
        </div>
      )}

      <MoneyTrackerSummary totals={totals} currency={currency} />

      {entries && (
        <section
          aria-label={t("money.addTitle")}
          className="mt-5 rounded-2xl bg-black/[0.03] p-3 dark:bg-white/[0.06]"
        >
          <h2 className="mb-2 px-1 text-sm font-semibold tracking-wide text-black/55 uppercase dark:text-white/55">
            {t("money.addTitle")}
          </h2>
          <MoneyTrackerForm defaultDate={todayKey} submitLabel={t("money.add")} onSubmit={addEntry} />
        </section>
      )}

      {entries && (
        <div role="radiogroup" className="mt-5 flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              role="radio"
              aria-checked={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${
                filter === f.value ? "border-brand-600 bg-brand-600 text-white" : "border-black/15 dark:border-white/20"
              }`}
            >
              {t(f.label)}
            </button>
          ))}
        </div>
      )}

      {entries && groups.length === 0 && (
        <p className="py-10 text-center text-lg text-black/55 dark:text-white/55">{t("money.empty")}</p>
      )}

      {groups.map((group) => (
        <section key={group.date} className="mt-4">
          <h3 className="mb-1 px-3 text-sm font-semibold tracking-wide text-black/55 uppercase dark:text-white/55">
            {moneyTrackerDateFromKey(group.date).toLocaleDateString(locale, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </h3>
          <ul className="flex flex-col">
            {group.entries.map((entry) =>
              editingId === entry.id ? (
                <li key={entry.id} className="rounded-2xl border border-brand-600/40 p-3">
                  <MoneyTrackerForm
                    autoFocus
                    entry={entry}
                    defaultDate={todayKey}
                    submitLabel={t("money.save")}
                    onSubmit={(input) => saveEntry(entry.id, input)}
                    onCancel={() => setEditingId(null)}
                    onDelete={() => deleteEntry(entry.id)}
                  />
                </li>
              ) : (
                <MoneyTrackerEntryRow
                  key={entry.id}
                  entry={entry}
                  currency={currency}
                  onEdit={() => setEditingId(entry.id)}
                />
              ),
            )}
          </ul>
        </section>
      ))}

      {shown.length > 0 && (
        <p className="mt-6 px-3 text-sm text-black/45 dark:text-white/45">{t("money.hint")}</p>
      )}

      {undo && (
        <div
          key={undo.n}
          role="status"
          className="fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-between gap-3 rounded-2xl bg-brand-700 py-2 pr-2 pl-4 text-white shadow-lg"
        >
          <span className="truncate">{t("money.deleted")}</span>
          <button
            type="button"
            onClick={runUndo}
            className="shrink-0 rounded-xl px-4 py-2 font-bold text-amber-200 active:bg-white/10"
          >
            {t("money.undo")}
          </button>
        </div>
      )}
    </main>
  );
}
