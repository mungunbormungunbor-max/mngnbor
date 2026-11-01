"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { TEXT_SIZES, haptic, loadControls, saveControls, type Controls, type TextSize } from "@/lib/controls/controls";

const SIZE_LABELS = {
  small: "ctrl.small",
  default: "ctrl.default",
  large: "ctrl.large",
} as const;

/** Preview letter size for each text-size button. */
const SIZE_PREVIEW: Record<TextSize, string> = { small: "text-sm", default: "text-base", large: "text-xl" };

function Switch({ label, on, onChange }: { label: string; on: boolean; onChange: (next: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="flex w-full items-center justify-between gap-3 rounded-xl py-2 text-left text-base font-medium"
    >
      <span>{label}</span>
      <span
        aria-hidden
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? "bg-brand-600" : "bg-black/20 dark:bg-white/25"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : ""}`}
        />
      </span>
    </button>
  );
}

/** Text size, vibration and animation controls, shown inside the ☰ menu. Only mounted while the menu is open. */
export function ControlsPanel() {
  const { t } = useI18n();
  const [controls, setControls] = useState<Controls>(() => loadControls());

  function update(next: Controls) {
    setControls(next);
    saveControls(next);
  }

  return (
    <div className="border-t border-black/10 px-3 pt-3 pb-2 dark:border-white/15">
      <p className="pb-2 text-xs font-semibold tracking-wide text-black/50 uppercase dark:text-white/50">
        {t("ctrl.title")}
      </p>

      <p className="pb-1 text-sm font-medium text-black/60 dark:text-white/60">{t("ctrl.textSize")}</p>
      <div
        role="radiogroup"
        aria-label={t("ctrl.textSize")}
        className="grid grid-cols-3 gap-1 rounded-xl bg-black/[0.06] p-1 dark:bg-white/10"
      >
        {TEXT_SIZES.map((size) => (
          <button
            key={size}
            type="button"
            role="radio"
            aria-checked={controls.textSize === size}
            onClick={() => update({ ...controls, textSize: size })}
            className={`flex flex-col items-center gap-0.5 rounded-lg px-1 py-2 font-semibold transition-colors ${
              controls.textSize === size ? "bg-brand-600 text-white shadow" : "text-black/65 dark:text-white/70"
            }`}
          >
            <span aria-hidden className={`leading-none ${SIZE_PREVIEW[size]}`}>
              Aa
            </span>
            <span className="text-xs">{t(SIZE_LABELS[size])}</span>
          </button>
        ))}
      </div>

      <div className="mt-2">
        <Switch
          label={t("ctrl.haptics")}
          on={controls.haptics}
          onChange={(haptics) => {
            update({ ...controls, haptics });
            // A short buzz right away so the user feels what they just switched on.
            if (haptics) haptic(15);
          }}
        />
        <Switch label={t("ctrl.motion")} on={controls.motion} onChange={(motion) => update({ ...controls, motion })} />
      </div>
    </div>
  );
}
