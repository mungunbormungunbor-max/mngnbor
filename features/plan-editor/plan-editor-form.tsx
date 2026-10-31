"use client";

import { useState, type FormEvent } from "react";
import type { PlanEditorDraft } from "./types";

type Props = {
  initial?: PlanEditorDraft;
  submitLabel: string;
  onSubmit: (draft: PlanEditorDraft) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
  /** Clear the fields after a successful submit (used by the "add" form). */
  resetOnSubmit?: boolean;
};

const EMPTY: PlanEditorDraft = { title: "", startTime: "", note: "" };

const inputClass =
  "w-full rounded-xl border border-black/15 bg-transparent px-3 py-3 text-lg outline-none transition-colors focus:border-emerald-600 dark:border-white/20 dark:focus:border-emerald-500";

export function PlanEditorForm({
  initial = EMPTY,
  submitLabel,
  onSubmit,
  onCancel,
  autoFocus,
  resetOnSubmit,
}: Props) {
  const [draft, setDraft] = useState<PlanEditorDraft>(initial);
  const canSubmit = draft.title.trim().length > 0;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(draft);
    if (resetOnSubmit) setDraft(EMPTY);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="text"
        aria-label="Title"
        placeholder="What do you need to do?"
        required
        maxLength={120}
        autoFocus={autoFocus}
        value={draft.title}
        onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        className={`${inputClass} font-semibold`}
      />
      <div className="flex gap-3">
        <label className="flex w-40 shrink-0 flex-col gap-1 text-sm font-medium text-black/60 dark:text-white/60">
          Time (optional)
          <input
            type="time"
            value={draft.startTime}
            onChange={(e) => setDraft({ ...draft, startTime: e.target.value })}
            className={`${inputClass} text-black dark:text-white [color-scheme:light_dark]`}
          />
        </label>
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm font-medium text-black/60 dark:text-white/60">
          Note (optional)
          <input
            type="text"
            maxLength={200}
            value={draft.note}
            onChange={(e) => setDraft({ ...draft, note: e.target.value })}
            className={`${inputClass} text-black dark:text-white`}
          />
        </label>
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex-1 rounded-xl bg-foreground px-4 py-3 text-lg font-semibold text-background transition-opacity active:opacity-80 disabled:opacity-40"
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-black/15 px-4 py-3 text-lg font-semibold dark:border-white/20"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
