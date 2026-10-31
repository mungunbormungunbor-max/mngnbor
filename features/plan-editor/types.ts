/** One editable plan item. Mirrors the draft `plan_items` columns in docs/plan.md. */
export type PlanEditorItem = {
  id: string;
  title: string;
  note: string | null;
  /** "HH:MM" (24h) or null when the item has no time. */
  startTime: string | null;
  isDone: boolean;
  sortOrder: number;
};

/** Fields the user can edit in the form. */
export type PlanEditorDraft = {
  title: string;
  startTime: string;
  note: string;
};
