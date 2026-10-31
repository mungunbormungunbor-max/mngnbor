"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { TodayViewItem } from "./types";
import {
  computeTodayViewDayPoints,
  getTodayViewGreeting,
  getTodayViewLevel,
  getTodayViewNextUp,
  getTodayViewSky,
  getTodayViewStatuses,
  getTodayViewStreak,
  getTodayViewStreakBonus,
  hasTodayViewDayPoints,
  loadTodayViewItems,
  loadTodayViewPrefs,
  loadTodayViewTotalPoints,
  pickTodayViewCelebration,
  saveTodayViewDayPoints,
  saveTodayViewItems,
  saveTodayViewPrefs,
  sortTodayViewItems,
  toTodayViewDateKey,
  type TodayViewPrefs,
} from "./today-view-data";
import { TodayViewItemRow } from "./today-view-item-row";
import { TodayViewEmpty } from "./today-view-empty";
import { CELEBRATION_MS, TodayViewCelebration } from "./today-view-celebration";
import { useTodayViewCountUp } from "./use-today-view-count-up";
import "./today-view.css";

type Loaded = { dateKey: string; items: TodayViewItem[] };

export function TodayViewScreen() {
  // "Today" depends on the phone's clock and timezone, so it is read on the client only.
  const [now, setNow] = useState<Date | null>(null);
  const [plan, setPlan] = useState<Loaded | null>(null);
  const [prefs, setPrefs] = useState<TodayViewPrefs>({ hideDone: false });
  const [streak, setStreak] = useState(0);
  const [celebration, setCelebration] = useState<string | null>(null);
  const [points, setPoints] = useState(0);
  const [gain, setGain] = useState<{ n: number; amount: number; bonus: number } | null>(null);
  const scrolledRef = useRef(false);

  useEffect(() => {
    function refresh() {
      const date = new Date();
      const dateKey = toTodayViewDateKey(date);
      const currentStreak = getTodayViewStreak(date);
      setNow(date);
      // Reload items only when the day changed (e.g. app reopened after midnight).
      setPlan((prev) =>
        prev?.dateKey === dateKey ? prev : { dateKey, items: loadTodayViewItems(dateKey) },
      );
      setStreak(currentStreak);
      // Items ticked before points existed still count: record today once if nothing is saved yet.
      if (!hasTodayViewDayPoints(dateKey)) {
        saveTodayViewDayPoints(
          dateKey,
          computeTodayViewDayPoints(loadTodayViewItems(dateKey), currentStreak),
        );
      }
      setPoints(loadTodayViewTotalPoints());
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only prefs read
    setPrefs(loadTodayViewPrefs());
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
    if (!gain) return;
    const t = window.setTimeout(() => setGain(null), 1500);
    return () => window.clearTimeout(t);
  }, [gain]);

  useEffect(() => {
    if (!celebration) return;
    const t = window.setTimeout(() => setCelebration(null), CELEBRATION_MS);
    return () => window.clearTimeout(t);
  }, [celebration]);

  function toggleDone(id: string) {
    if (!plan) return;
    const wasAllDone = plan.items.length > 0 && plan.items.every((it) => it.isDone);
    const items = plan.items.map((it) => (it.id === id ? { ...it, isDone: !it.isDone } : it));
    saveTodayViewItems(plan.dateKey, items);
    setPlan({ ...plan, items });
    const newStreak = now ? getTodayViewStreak(now) : streak;
    setStreak(newStreak);

    // Points for today are recomputed from the items, so un-ticking takes them back.
    const before = loadTodayViewTotalPoints();
    saveTodayViewDayPoints(plan.dateKey, computeTodayViewDayPoints(items, newStreak));
    const after = loadTodayViewTotalPoints();
    setPoints(after);

    const finishedDay = !wasAllDone && items.every((it) => it.isDone);
    if (after > before) {
      setGain((g) => ({
        n: (g?.n ?? 0) + 1,
        amount: after - before,
        bonus: finishedDay ? getTodayViewStreakBonus(newStreak) : 0,
      }));
    }
    if (finishedDay) {
      setCelebration(pickTodayViewCelebration());
      navigator.vibrate?.([20, 60, 20]);
    }
  }

  function toggleHideDone() {
    const next = { ...prefs, hideDone: !prefs.hideDone };
    setPrefs(next);
    saveTodayViewPrefs(next);
  }

  const sorted = plan ? sortTodayViewItems(plan.items) : [];
  const statuses = now ? getTodayViewStatuses(sorted, now) : new Map();
  const nextUp = now ? getTodayViewNextUp(sorted, statuses, now) : null;
  const doneCount = sorted.filter((it) => it.isDone).length;
  const remaining = sorted.length - doneCount;
  const percent = sorted.length ? Math.round((doneCount / sorted.length) * 100) : 0;
  const shownPercent = useTodayViewCountUp(percent);
  const shownPoints = useTodayViewCountUp(points, 600);
  const level = getTodayViewLevel(points);
  const allDone = sorted.length > 0 && remaining === 0;
  // If today is unfinished the streak counts from yesterday, so finishing today adds one more day.
  const bonusToday = getTodayViewStreakBonus(allDone ? streak : streak + 1);
  const visible = prefs.hideDone ? sorted.filter((it) => !it.isDone) : sorted;
  const sky = now ? getTodayViewSky(now) : null;

  // Remaining count on the installed app icon and in the tab title.
  useEffect(() => {
    if (!plan) return;
    document.title = remaining > 0 ? `(${remaining}) Today · Daily Plan` : "Today · Daily Plan";
    const nav = navigator as Navigator & {
      setAppBadge?: (n?: number) => Promise<void>;
      clearAppBadge?: () => Promise<void>;
    };
    (remaining > 0 ? nav.setAppBadge?.(remaining) : nav.clearAppBadge?.())?.catch(() => {});
  }, [plan, remaining]);

  // On first load, bring the current item into view so a long day opens where you are.
  const focusId = nextUp?.item.id;
  useEffect(() => {
    if (scrolledRef.current || !focusId) return;
    scrolledRef.current = true;
    const el = document.querySelector(`[data-item-id="${CSS.escape(focusId)}"]`);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el?.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
  }, [focusId]);

  return (
    <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col overflow-x-clip px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      {sky && (
        <div
          aria-hidden
          className={`today-view-glow pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-[130%] -translate-x-1/2 rounded-full bg-gradient-to-b ${sky.glow} to-transparent blur-3xl`}
        />
      )}

      <header className="mb-4 px-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-lg font-medium text-black/60 dark:text-white/60">
              {now
                ? `${getTodayViewGreeting(now)} · ${now.toLocaleDateString(undefined, { weekday: "long" })}`
                : " "}
            </p>
            <h1 className="flex items-center gap-2 text-4xl font-bold tracking-tight">
              {now ? now.toLocaleDateString(undefined, { month: "long", day: "numeric" }) : "Today"}
              {sky && (
                <span aria-hidden className="today-view-float text-3xl">
                  {sky.icon}
                </span>
              )}
            </h1>
          </div>
          <Link
            href="/plan-editor"
            className="mt-2 shrink-0 rounded-full border border-black/15 px-4 py-2 text-base font-semibold transition-colors active:bg-black/5 dark:border-white/20 dark:active:bg-white/10"
          >
            Edit
          </Link>
        </div>

        {(nextUp || streak > 0) && (
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-base">
            {nextUp && (
              <p className="min-w-0 truncate font-medium">
                <span className="text-black/55 dark:text-white/55">{nextUp.isNow ? "Now: " : "Next: "}</span>
                {nextUp.item.title}{" "}
                <span className={nextUp.isNow ? "font-bold text-emerald-600" : "text-black/55 dark:text-white/55"}>
                  {nextUp.text}
                </span>
              </p>
            )}
            {streak > 0 && (
              <p className="shrink-0 font-semibold text-orange-600 dark:text-orange-400" title="Days in a row with everything done">
                <span aria-hidden className="today-view-flame">
                  🔥
                </span>{" "}
                {streak}-day streak
              </p>
            )}
          </div>
        )}

        {(points > 0 || sorted.length > 0) && (
          <div
            aria-label="Streak points"
            className="relative mt-3 flex items-center justify-between gap-3 rounded-2xl bg-amber-400/15 px-4 py-2.5"
          >
            <div className="min-w-0">
              <p className="text-lg font-bold">
                <span aria-hidden>⭐</span>{" "}
                <span key={gain?.n ?? 0} className={`inline-block tabular-nums ${gain ? "today-view-points-bump" : ""}`}>
                  {shownPoints}
                </span>{" "}
                pts <span className="text-sm font-medium text-black/55 dark:text-white/55">· {level.name}</span>
              </p>
              <p className="text-sm text-black/60 dark:text-white/60">
                {allDone
                  ? `Streak bonus earned: +${bonusToday}`
                  : `Finish everything today for +${bonusToday} streak bonus`}
              </p>
            </div>
            {level.next !== null && (
              <p className="shrink-0 text-right text-sm font-medium text-black/55 dark:text-white/55">
                {level.next - points} to
                <br />
                next rank
              </p>
            )}
            {gain && (
              <span
                key={gain.n}
                className="today-view-gain rounded-full bg-emerald-600 px-3 py-1 text-sm font-bold whitespace-nowrap text-white shadow"
              >
                +{gain.amount}
                {gain.bonus > 0 && ` · streak bonus +${gain.bonus}`}
              </span>
            )}
          </div>
        )}

        {sorted.length > 0 && (
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-base text-black/60 dark:text-white/60">
              <span>{allDone ? "Everything done 🎉" : `${doneCount} of ${sorted.length} done`}</span>
              <span className="flex items-center gap-3">
                {doneCount > 0 && (
                  <button
                    type="button"
                    onClick={toggleHideDone}
                    aria-pressed={prefs.hideDone}
                    className="rounded-full border border-black/15 px-3 py-0.5 text-sm font-semibold transition-colors active:bg-black/5 dark:border-white/20 dark:active:bg-white/10"
                  >
                    {prefs.hideDone ? `Show done (${doneCount})` : "Hide done"}
                  </button>
                )}
                <span className="tabular-nums">{shownPercent}%</span>
              </span>
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
                className="today-view-progress-fill h-full rounded-full bg-emerald-600"
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
      ) : visible.length === 0 ? (
        <p className="today-view-rise py-10 text-center text-lg text-black/55 dark:text-white/55">
          All done and hidden. Nice work!
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {visible.map((item, i) => (
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

      {sorted.length > 0 && !prefs.hideDone && remaining > 0 && (
        <p className="mt-6 px-3 text-center text-sm text-black/40 dark:text-white/40">
          Tip: swipe an item right to complete it
        </p>
      )}

      {celebration && <TodayViewCelebration message={celebration} />}
    </main>
  );
}
