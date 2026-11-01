"use client";
import { haptic } from "@/lib/controls/controls";

import { useRef, useState, type FormEvent } from "react";
import { useI18n } from "@/lib/i18n/provider";
import {
  MONEY_TRACKER_CATEGORIES,
  amountToMoneyTrackerText,
  parseMoneyTrackerAmount,
} from "./money-tracker-data";
import type { MoneyTrackerEntry, MoneyTrackerInput, MoneyTrackerKind } from "./types";

type Props = {
  /** The record being edited; omit for the "add" form. */
  entry?: MoneyTrackerEntry;
  /** Date a new record starts with (today). */
  defaultDate: string;
  submitLabel: string;
  onSubmit: (input: MoneyTrackerInput) => void;
  onCancel?: () => void;
  onDelete?: () => void;
  autoFocus?: boolean;
};

const inputClass =
  "w-full rounded-xl border border-black/15 bg-transparent px-3 py-3 text-lg outline-none transition-colors focus:border-brand-600 dark:border-white/20 dark:focus:border-brand-400";

/** Smaller inputs for the secondary fields (date, note); `min-w-0` lets native pickers shrink to fit. */
const compactInputClass =
  "block h-11 w-full min-w-0 max-w-full rounded-xl border border-black/15 bg-transparent px-2.5 text-base outline-none transition-colors focus:border-brand-600 dark:border-white/20 dark:focus:border-brand-400";

const KINDS: { kind: MoneyTrackerKind; label: "money.kindIncome" | "money.kindExpense" }[] = [
  { kind: "income", label: "money.kindIncome" },
  { kind: "expense", label: "money.kindExpense" },
];

export function MoneyTrackerForm({ entry, defaultDate, submitLabel, onSubmit, onCancel, onDelete, autoFocus }: Props) {
  const { t } = useI18n();
  const [kind, setKind] = useState<MoneyTrackerKind>(entry?.kind ?? "expense");
  const [amount, setAmount] = useState(entry ? amountToMoneyTrackerText(entry.amount) : "");
  const [category, setCategory] = useState(entry?.category ?? "food");
  const [note, setNote] = useState(entry?.note ?? "");
  const [date, setDate] = useState(entry?.date ?? defaultDate);
  const [invalid, setInvalid] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);

  const categories = MONEY_TRACKER_CATEGORIES[kind];

  function changeKind(next: MoneyTrackerKind) {
    setKind(next);
    // Keep the category if the other kind has it too ("other"); otherwise pick that kind's first one.
    if (!MONEY_TRACKER_CATEGORIES[next].some((c) => c.id === category)) {
      setCategory(MONEY_TRACKER_CATEGORIES[next][0].id);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const value = parseMoneyTrackerAmount(amount);
    if (value === null) {
      setInvalid(true);
      haptic([30, 40, 30]);
      amountRef.current?.focus();
      return;
    }
    onSubmit({ kind, amount: value, category, note: note.trim() || null, date: date || defaultDate });
    if (!entry) {
      // Keep kind, category and date so several records in a row are quick; clear what is unique.
      setAmount("");
      setNote("");
      setInvalid(false);
      amountRef.current?.focus();
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
      <div role="radiogroup" className="grid grid-cols-2 gap-1 rounded-xl bg-black/[0.06] p-1 dark:bg-white/10">
        {KINDS.map((k) => (
          <button
            key={k.kind}
            type="button"
            role="radio"
            aria-checked={kind === k.kind}
            onClick={() => changeKind(k.kind)}
            className={`rounded-lg py-2.5 text-base font-semibold transition-colors ${
              kind === k.kind
                ? k.kind === "income"
                  ? "bg-emerald-600 text-white shadow"
                  : "bg-rose-500 text-white shadow"
                : "text-black/65 dark:text-white/70"
            }`}
          >
            {t(k.label)}
          </button>
        ))}
      </div>

      <label className="flex flex-col gap-1 text-sm font-medium text-black/60 dark:text-white/60">
        {t("money.amount")}
        <input
          ref={amountRef}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          autoFocus={autoFocus}
          placeholder="0"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            if (invalid) setInvalid(false);
          }}
          aria-invalid={invalid}
          className={`${inputClass} text-2xl font-bold tabular-nums text-black dark:text-white ${
            invalid ? "border-red-500 dark:border-red-500" : ""
          }`}
        />
        {invalid && (
          <span role="alert" className="text-sm font-semibold text-red-600 dark:text-red-400">
            {t("money.amountError")}
          </span>
        )}
      </label>

      <div>
        <p className="mb-1 text-sm font-medium text-black/60 dark:text-white/60">{t("money.category")}</p>
        <div role="radiogroup" aria-label={t("money.category")} className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={category === c.id}
              onClick={() => setCategory(c.id)}
              className={`rounded-full border px-3 py-1.5 text-sm font-semibold whitespace-nowrap ${
                category === c.id ? "border-brand-600 bg-brand-600 text-white" : "border-black/15 dark:border-white/20"
              }`}
            >
              <span aria-hidden>{c.icon}</span> {t(c.label)}
            </button>
          ))}
        </div>
      </div>

      {/* Two columns that share the width (date narrower); stacked on very narrow phones. */}
      <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-black/60 dark:text-white/60">
          <span className="truncate">{t("money.date")}</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={`${compactInputClass} text-black dark:text-white`}
          />
        </label>
        <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-black/60 dark:text-white/60">
          <span className="truncate">{t("money.note")}</span>
          <input
            type="text"
            maxLength={120}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={`${compactInputClass} text-black dark:text-white`}
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          className="min-w-[8rem] flex-1 rounded-xl bg-brand-600 px-4 py-3 text-lg font-semibold text-white transition-opacity active:opacity-80"
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="shrink-0 rounded-xl border border-black/15 px-4 py-3 text-base font-semibold whitespace-nowrap dark:border-white/20"
          >
            {t("money.cancel")}
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="shrink-0 rounded-xl border border-red-500/40 px-4 py-3 text-base font-semibold whitespace-nowrap text-red-600 dark:text-red-400"
          >
            {t("money.delete")}
          </button>
        )}
      </div>
    </form>
  );
}
