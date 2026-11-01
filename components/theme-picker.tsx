"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { THEME_MODES, loadThemeMode, saveThemeMode, type ThemeMode } from "@/lib/theme/theme";

const LABELS = {
  light: "theme.light",
  dark: "theme.dark",
  system: "theme.system",
} as const;

const ICONS: Record<ThemeMode, string> = { light: "☀️", dark: "🌙", system: "📱" };

/** Light / Dark / System switch, shown inside the ☰ menu. Only mounted while the menu is open. */
export function ThemePicker() {
  const { t } = useI18n();
  const [mode, setMode] = useState<ThemeMode>(() => loadThemeMode());

  return (
    <div className="border-t border-black/10 px-3 pt-3 pb-3 dark:border-white/15">
      <p className="pb-2 text-xs font-semibold tracking-wide text-black/50 uppercase dark:text-white/50">
        {t("theme.title")}
      </p>
      <div role="radiogroup" aria-label={t("theme.title")} className="grid grid-cols-3 gap-1 rounded-xl bg-black/[0.06] p-1 dark:bg-white/10">
        {THEME_MODES.map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={mode === m}
            onClick={() => {
              setMode(m);
              saveThemeMode(m);
            }}
            className={`flex flex-col items-center gap-0.5 rounded-lg px-1 py-2 text-sm font-semibold transition-colors ${
              mode === m ? "bg-brand-600 text-white shadow" : "text-black/65 dark:text-white/70"
            }`}
          >
            <span aria-hidden className="text-base leading-none">
              {ICONS[m]}
            </span>
            {t(LABELS[m])}
          </button>
        ))}
      </div>
    </div>
  );
}
