"use client";

import { useI18n } from "@/lib/i18n/provider";
import { loadTodayViewItems, type TodayViewWeekDay } from "./today-view-data";

type Props = {
  days: TodayViewWeekDay[];
  /** The day whose plan is shown below the strip. */
  selectedKey: string;
  todayKey: string;
  onSelect: (dateKey: string) => void;
  onShiftWeek: (delta: -1 | 1) => void;
};

const ARROW =
  "flex size-9 shrink-0 items-center justify-center rounded-full text-xl transition-colors active:bg-black/5 dark:active:bg-white/10";

/** Monday-to-Sunday day tabs. A dot marks days that have plan items. */
export function TodayViewWeek({ days, selectedKey, todayKey, onSelect, onShiftWeek }: Props) {
  const { t, locale } = useI18n();

  return (
    <div className="mt-3 flex items-center gap-1">
      <button type="button" aria-label={t("today.prevWeek")} onClick={() => onShiftWeek(-1)} className={ARROW}>
        ‹
      </button>
      <div role="tablist" aria-label={t("today.weekLabel")} className="grid flex-1 grid-cols-7 gap-1">
        {days.map(({ dateKey, date }) => {
          const selected = dateKey === selectedKey;
          const isToday = dateKey === todayKey;
          const items = loadTodayViewItems(dateKey);
          const hasItems = items.length > 0;
          const allDone = hasItems && items.every((it) => it.isDone);
          return (
            <button
              key={dateKey}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-current={isToday ? "date" : undefined}
              onClick={() => onSelect(dateKey)}
              className={`flex min-w-0 flex-col items-center gap-0.5 rounded-2xl px-0 py-2 transition-colors ${
                selected
                  ? "bg-foreground text-background"
                  : isToday
                    ? "ring-1 ring-emerald-600/60 active:bg-black/5 dark:active:bg-white/10"
                    : "active:bg-black/5 dark:active:bg-white/10"
              }`}
            >
              <span className={`text-xs font-medium ${selected ? "opacity-80" : "text-black/55 dark:text-white/55"}`}>
                {date.toLocaleDateString(locale, { weekday: "short" })}
              </span>
              <span className="text-lg font-bold tabular-nums">{date.getDate()}</span>
              <span
                aria-hidden
                className={`size-1.5 rounded-full ${
                  !hasItems ? "bg-transparent" : allDone ? "bg-emerald-500" : selected ? "bg-background/70" : "bg-black/35 dark:bg-white/40"
                }`}
              />
            </button>
          );
        })}
      </div>
      <button type="button" aria-label={t("today.nextWeek")} onClick={() => onShiftWeek(1)} className={ARROW}>
        ›
      </button>
    </div>
  );
}
