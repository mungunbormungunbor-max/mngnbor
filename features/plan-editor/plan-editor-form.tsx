"use client";
import { haptic } from "@/lib/controls/controls";

import { useRef, useState, type FormEvent } from "react";
import { useI18n } from "@/lib/i18n/provider";
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
  "w-full rounded-xl border border-black/15 bg-transparent px-3 py-3 text-lg outline-none transition-colors focus:border-brand-600 dark:border-white/20 dark:focus:border-brand-500";

/** Smaller inputs for the secondary fields (time, note); `min-w-0` lets native pickers shrink to fit. */
const compactInputClass =
  "block h-11 w-full min-w-0 max-w-full rounded-xl border border-black/15 bg-transparent px-2.5 text-base outline-none transition-colors focus:border-brand-600 dark:border-white/20 dark:focus:border-brand-500";

const chipClass =
  "plan-editor-chip shrink-0 rounded-full border px-3 py-1.5 text-sm font-semibold whitespace-nowrap";
const chipOff = "border-black/15 dark:border-white/20";
const chipOn = "border-brand-600 bg-brand-600 text-white";

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
  const { t, locale } = useI18n();
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
      haptic([30, 40, 30]);
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
          aria-label={t("editor.fieldTitle")}
          placeholder={smart ? t("editor.placeholderSmart") : t("editor.placeholder")}
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
          <p className="plan-editor-banner mt-2 flex items-center gap-2 text-sm font-medium text-brand-700 dark:text-brand-400">
            <span aria-hidden>⏰</span>
            <span className="min-w-0 truncate">
              {t("editor.willSchedule", {
                title: detected.title,
                time: formatPlanEditorTime(detected.startTime, locale),
              })}
            </span>
            <button
              type="button"
              onClick={() => setIgnoreSmart(true)}
              aria-label={t("editor.noDetect")}
              className="ml-auto shrink-0 rounded-full px-2 text-lg leading-none text-black/45 active:bg-black/5 dark:text-white/50"
            >
              ×
            </button>
          </p>
        )}
        {shownSuggestions.length > 0 && (
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1" aria-label={t("editor.suggestions")}>
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

      {/* Two columns that share the width (time narrower); stacked on very narrow phones. */}
      <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-black/60 dark:text-white/60">
          <span className="truncate">{t("editor.timeOptional")}</span>
          <input
            type="time"
            value={draft.startTime}
            onChange={(e) => setDraft({ ...draft, startTime: e.target.value })}
            className={`${compactInputClass} text-black dark:text-white`}
          />
        </label>
        <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-black/60 dark:text-white/60">
          <span className="truncate">{t("editor.noteOptional")}</span>
          <input
            type="text"
            maxLength={200}
            value={draft.note}
            onChange={(e) => setDraft({ ...draft, note: e.target.value })}
            className={`${compactInputClass} text-black dark:text-white`}
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2" aria-label={t("editor.quickTimes")}>
        {PLAN_EDITOR_QUICK_TIMES.map((q) => (
          <button
            key={q.value}
            type="button"
            aria-pressed={draft.startTime === q.value}
            onClick={() => setTime(q.value)}
            className={`${chipClass} ${draft.startTime === q.value ? chipOn : chipOff}`}
          >
            {t(q.label)}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            const inOneHour = planEditorInOneHour(new Date());
            if (inOneHour) setTime(inOneHour);
          }}
          className={`${chipClass} ${chipOff}`}
        >
          {t("editor.inOneHour")}
        </button>
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
            {t("editor.cancel")}
          </button>
        )}
      </div>
    </form>
  );
}
