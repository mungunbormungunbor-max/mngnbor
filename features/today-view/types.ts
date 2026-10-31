/** One row on the today-view screen. Mirrors the draft `plan_items` columns in docs/plan.md. */
export type TodayViewItem = {
  id: string;
  title: string;
  note: string | null;
  /** "HH:MM" (24h) or null when the item has no time. */
  startTime: string | null;
  isDone: boolean;
  sortOrder: number;
};
