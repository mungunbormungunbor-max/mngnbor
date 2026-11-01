"use client";

import { useI18n } from "@/lib/i18n/provider";
import { formatMoneyTrackerAmount, getMoneyTrackerCategory } from "./money-tracker-data";
import type { MoneyTrackerCurrency, MoneyTrackerEntry } from "./types";

type Props = {
  entry: MoneyTrackerEntry;
  currency: MoneyTrackerCurrency;
  onEdit: () => void;
};

export function MoneyTrackerEntryRow({ entry, currency, onEdit }: Props) {
  const { t, locale } = useI18n();
  const category = getMoneyTrackerCategory(entry.kind, entry.category);
  const income = entry.kind === "income";

  return (
    <li>
      <button
        type="button"
        onClick={onEdit}
        className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors active:bg-black/5 dark:active:bg-white/10"
      >
        <span
          aria-hidden
          className={`flex size-11 shrink-0 items-center justify-center rounded-full text-xl ${
            income ? "bg-emerald-500/15" : "bg-rose-500/15"
          }`}
        >
          {category.icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-lg font-semibold">{t(category.label)}</span>
          {entry.note && (
            <span className="block truncate text-sm text-black/55 dark:text-white/55">{entry.note}</span>
          )}
        </span>
        <span
          className={`shrink-0 text-lg font-bold tabular-nums ${
            income ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
          }`}
        >
          {income ? "+" : "−"}
          {formatMoneyTrackerAmount(entry.amount, currency, locale)}
        </span>
      </button>
    </li>
  );
}
