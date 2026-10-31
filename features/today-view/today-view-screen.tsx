"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { TodayViewItem } from "./types";
import {
  getTodayViewGreeting,
  getTodayViewStatuses,
  loadTodayViewItems,
  saveTodayViewItems,
  sortTodayViewItems,
  toTodayViewDateKey,
} from "./today-view-data";
import { TodayViewItemRow } from "./today-view-item-row";
import { TodayViewEmpty } from "./today-view-empty";
import { CELEBRATION_MS, TodayViewCelebration } from "./today-view-celebration";
import "./today-view.css";

type Loaded = { dateKey: string; items: TodayViewItem[] };

export function TodayViewScreen() {
  // "Today" depends on the phone's clock and timezone, so it is read on the client only.
  const [now, setNow] = useState<Date | null>(null);
  const [plan, setPlan] = useState<Loaded | null>(null);
  const [celebrating, setCelebrating] = useState(false);

  useEffect(() => {
    function refresh() {
      const date = new Date();
      const dateKey = toTodayViewDateKey(date);
      setNow(date);
      // Reload items only when the day changed (e.g. app reopened after midnight).
      setPlan((prev) =>
        prev?.dateKey === dateKey ? prev : { dateKey, items: loadTodayViewItems(dateKey) },
      );
    }
    refresh();
    // Keep "Now / Next" badges current while the screen stays open.
    const timer = window.setInterval(refresh, 60_000);
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  useEffect(() => {
    if (!celebrating) return;
    const t = window.setTimeout(() => setCelebrating(false), CELEBRATION_MS);
    return () => window.clearTimeout(t);
  }, [celebrating]);

  function toggleDone(id: string) {
    if (!plan) return;
    const wasAllDone = plan.items.length > 0 && plan.items.every((it) => it.isDone);
    const items = plan.items.map((it) => (it.id === id ? { ...it, isDone: !it.isDone } : it));
    saveTodayViewItems(plan.dateKey, items);
    setPlan({ ...plan, items });
    if (!wasAllDone && items.every((it) => it.isDone)) {
      setCelebrating(true);
      navigator.vibrate?.([20, 60, 20]);
    }
  }

  const sorted = plan ? sortTodayViewItems(plan.items) : [];
  const statuses = now ? getTodayViewStatuses(sorted, now) : new Map();
  const doneCount = sorted.filter((it) => it.isDone).length;
  const percent = sorted.length ? Math.round((doneCount / sorted.length) * 100) : 0;
  const allDone = sorted.length > 0 && doneCount === sorted.length;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <header className="mb-4 px-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-lg font-medium text-black/60 dark:text-white/60">
              {now
                ? `${getTodayViewGreeting(now)} · ${now.toLocaleDateString(undefined, { weekday: "long" })}`
                : " "}
            </p>
            <h1 className="text-4xl font-bold tracking-tight">
              {now ? now.toLocaleDateString(undefined, { month: "long", day: "numeric" }) : "Today"}
            </h1>
          </div>
          <Link
            href="/plan-editor"
            className="mt-2 shrink-0 rounded-full border border-black/15 px-4 py-2 text-base font-semibold transition-colors active:bg-black/5 dark:border-white/20 dark:active:bg-white/10"
          >
            Edit
          </Link>
        </div>

        {sorted.length > 0 && (
          <div className="mt-3">
            <div className="mb-1 flex justify-between text-base text-black/60 dark:text-white/60">
              <span>{allDone ? "Everything done 🎉" : `${doneCount} of ${sorted.length} done`}</span>
              <span className="tabular-nums">{percent}%</span>
            </div>
            <div
              role="progressbar"
              aria-label="Today's progress"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/15"
            >
              <div
                className={`h-full rounded-full bg-emerald-600 today-view-progress-fill`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        )}
      </header>

      {plan === null ? (
        <div className="flex-1" aria-busy="true" />
      ) : sorted.length === 0 ? (
        <TodayViewEmpty />
      ) : (
        <ul className="flex flex-col gap-1">
          {sorted.map((item, i) => (
            <TodayViewItemRow
              key={item.id}
              item={item}
              index={i}
              status={statuses.get(item.id) ?? null}
              onToggle={toggleDone}
            />
          ))}
        </ul>
      )}

      {celebrating && <TodayViewCelebration />}
    </main>
  );
}
