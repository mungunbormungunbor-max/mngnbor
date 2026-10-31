"use client";

import { useRef, useState, type FormEvent } from "react";
import type { PlanEditorDraft } from "./types";
import {
  PLAN_EDITOR_QUICK_TIMES,
  formatPlanEditorTime,
  parsePlanEditorSmartTitle,
  planEditorInOneHour,
} from "./plan-editor-data";

type Props = {
  initial?: PlanEditorDraft;
  submitLabel: string;
  onSubmit: (draft: PlanEditorDraft) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
  /** Clear the fields after a successful submit (used by the "add" form). */
  resetOnSubmit?: boolean;
  /** Recognise times typed into the title ("Gym at 7pm") and show suggestion chips (add form). */
  smart?: boolean;
  /** Previously used titles, offered as one-tap chips when `smart` is on. */
  suggestions?: string[];
};

const EMPTY: PlanEditorDraft = { title: "", startTime: "", note: "" };

const inputClass =
  "w-full rounded-xl border border-black/15 bg-transparent px-3 py-3 text-lg outline-none transition-colors focus:border-emerald-600 dark:border-white/20 dark:focus:border-emerald-500";

const chipClass =
  "plan-editor-chip shrink-0 rounded-full border px-3 py-1.5 text-sm font-semibold whitespace-nowrap";
const chipOff = "border-black/15 dark:border-white/20";
const chipOn = "border-emerald-600 bg-emerald-600 text-white";

export function PlanEditorForm({
  initial = EMPTY,
  submitLabel,
  onSubmit,
  onCancel,
  autoFocus,
  resetOnSubmit,
  smart,
  suggestions = [],
}: Props) {
  const [draft, setDraft] = useState<PlanEditorDraft>(initial);
  const [ignoreSmart, setIgnoreSmart] = useState(false);
  const [shaking, setShaking] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  const detected = smart && !ignoreSmart && !draft.startTime ? parsePlanEditorSmartTitle(draft.title) : null;

  const query = draft.title.trim().toLowerCase();
  const shownSuggestions = smart
    ? suggestions
        .filter((s) => s.toLowerCase() !== query && (query === "" || s.toLowerCase().includes(query)))
        .slice(0, 4)
    : [];

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!draft.title.trim()) {
      setShaking(true);
      navigator.vibrate?.([30, 40, 30]);
      titleRef.current?.focus();
      return;
    }
    const final = detected ? { ...draft, title: detected.title, startTime: detected.startTime } : draft;
    onSubmit(final);
    if (resetOnSubmit) {
      setDraft(EMPTY);
      setIgnoreSmart(false);
      titleRef.current?.focus();
    }
  }

  function setTime(startTime: string) {
    setDraft((d) => ({ ...d, startTime: d.startTime === startTime ? "" : startTime }));
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
      <div>
        <input
          ref={titleRef}
          type="text"
          aria-label="Title"
          placeholder={smart ? "What to do? e.g. Gym at 7pm" : "What do you need to do?"}
          maxLength={120}
          autoFocus={autoFocus}
          value={draft.title}
          onChange={(e) => {
            setDraft({ ...draft, title: e.target.value });
            if (shaking) setShaking(false);
          }}
          onAnimationEnd={() => setShaking(false)}
          aria-invalid={shaking}
          className={`${inputClass} font-semibold ${shaking ? "plan-editor-shake border-red-500 dark:border-red-500" : ""}`}
        />
        {detected && (
          <p className="plan-editor-banner mt-2 flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
            <span aria-hidden>⏰</span>
            <span className="min-w-0 truncate">
              Will schedule “{detected.title}” at {formatPlanEditorTime(detected.startTime)}
            </span>
            <button
              type="button"
              onClick={() => setIgnoreSmart(true)}
              aria-label="Don't detect the time"
              className="ml-auto shrink-0 rounded-full px-2 text-lg leading-none text-black/45 active:bg-black/5 dark:text-white/50"
            >
              ×
            </button>
          </p>
        )}
        {shownSuggestions.length > 0 && (
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1" aria-label="Suggestions">
            {shownSuggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setDraft({ ...draft, title: s });
                  setIgnoreSmart(false);
                  titleRef.current?.focus();
                }}
                className={`${chipClass} ${chipOff} max-w-48 truncate`}
              >
                ↺ {s}
              </button>
            ))}
          </div>
        )}
      </div>

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

      <div className="flex flex-wrap gap-2" aria-label="Quick times">
        {PLAN_EDITOR_QUICK_TIMES.map((t) => (
          <button
            key={t.value}
            type="button"
            aria-pressed={draft.startTime === t.value}
            onClick={() => setTime(t.value)}
            className={`${chipClass} ${draft.startTime === t.value ? chipOn : chipOff}`}
          >
            {t.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            const t = planEditorInOneHour(new Date());
            if (t) setTime(t);
          }}
          className={`${chipClass} ${chipOff}`}
        >
          In 1 hour
        </button>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          className="flex-1 rounded-xl bg-foreground px-4 py-3 text-lg font-semibold text-background transition-opacity active:opacity-80"
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
