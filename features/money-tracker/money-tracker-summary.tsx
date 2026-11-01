"use client";

import { useI18n } from "@/lib/i18n/provider";
import { formatMoneyTrackerAmount } from "./money-tracker-data";
import type { MoneyTrackerCurrency, MoneyTrackerTotals } from "./types";

type Props = { totals: MoneyTrackerTotals; currency: MoneyTrackerCurrency };

/** Remaining balance on top, total income and total expenses underneath. */
export function MoneyTrackerSummary({ totals, currency }: Props) {
  const { t, locale } = useI18n();
  const money = (n: number) => formatMoneyTrackerAmount(n, currency, locale);
  const negative = totals.balance < 0;

  return (
    <section aria-label={t("money.balance")} className="flex flex-col gap-2">
      <div
        className={`rounded-3xl px-5 py-4 text-white shadow-lg ${
          negative ? "bg-gradient-to-br from-rose-500 to-orange-400" : "bg-gradient-to-br from-brand-600 to-pink-500"
        }`}
      >
        <p className="text-sm font-medium opacity-85">{t("money.balance")}</p>
        <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums">{money(totals.balance)}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-emerald-500/12 px-4 py-3">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
            <span aria-hidden>↑</span> {t("money.totalIncome")}
          </p>
          <p className="mt-0.5 text-xl font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
            {money(totals.income)}
          </p>
        </div>
        <div className="rounded-2xl bg-rose-500/12 px-4 py-3">
          <p className="text-sm font-medium text-rose-800 dark:text-rose-300">
            <span aria-hidden>↓</span> {t("money.totalExpenses")}
          </p>
          <p className="mt-0.5 text-xl font-bold tabular-nums text-rose-700 dark:text-rose-300">
            {money(totals.expense)}
          </p>
        </div>
      </div>
    </section>
  );
}
