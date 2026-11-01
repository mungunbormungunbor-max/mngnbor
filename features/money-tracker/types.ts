export type MoneyTrackerKind = "income" | "expense";

/** One income or expense record. Mirrors the future `money_entries` table. */
export type MoneyTrackerEntry = {
  id: string;
  kind: MoneyTrackerKind;
  /** Always positive; `kind` says whether it is added or subtracted. */
  amount: number;
  /** A category id such as "food" or "salary". */
  category: string;
  note: string | null;
  /** "YYYY-MM-DD" (local date). */
  date: string;
  /** Milliseconds since 1970, used to order records on the same day. */
  createdAt: number;
};

/** What the form hands back: a validated entry without id/createdAt. */
export type MoneyTrackerInput = Pick<MoneyTrackerEntry, "kind" | "amount" | "category" | "note" | "date">;

export type MoneyTrackerCurrency = "MNT" | "USD" | "EUR";

export type MoneyTrackerPrefs = { currency: MoneyTrackerCurrency };

export type MoneyTrackerTotals = { income: number; expense: number; balance: number };
