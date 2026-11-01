"use client";

import { useI18n } from "@/lib/i18n/provider";
import { formatPlanEditorTime } from "./plan-editor-data";

type Props = {
  value: string | null;
  onChange: (startTime: string | null) => void;
  /** Accessible name, e.g. "Time for Morning run". */
  label: string;
  /** Accessible name of the clear (×) button. */
  clearLabel: string;
};

/**
 * Tap-to-edit time. A transparent native <input type="time"> covers the pill, so phones open
 * their own time wheel and desktop browsers open the picker. The × clears the time.
 */
export function PlanEditorTimePill({ value, onChange, label, clearLabel }: Props) {
  const { t, locale } = useI18n();
  return (
    <span className="flex shrink-0 items-center gap-1">
      <span
        className={`relative inline-flex items-center rounded-full px-3 py-1.5 text-base tabular-nums transition-colors ${
          value
            ? "bg-black/[0.06] font-semibold dark:bg-white/10"
            : "border border-dashed border-black/25 text-black/55 dark:border-white/30 dark:text-white/60"
        }`}
      >
        {value ? formatPlanEditorTime(value, locale) : t("editor.addTime")}
        <input
          type="time"
          aria-label={label}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          onClick={(e) => {
            try {
              e.currentTarget.showPicker?.();
            } catch {
              // showPicker can throw if not triggered by a user gesture; the input still works.
            }
          }}
          className="plan-editor-time-input absolute inset-0 cursor-pointer opacity-0"
        />
      </span>
      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label={clearLabel}
          className="flex size-8 items-center justify-center rounded-full text-lg text-black/45 active:bg-black/5 dark:text-white/50 dark:active:bg-white/10"
        >
          ×
        </button>
      )}
    </span>
  );
}
