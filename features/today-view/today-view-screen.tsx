"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AppMenu } from "@/components/app-menu";
import { useI18n } from "@/lib/i18n/provider";
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
  getTodayViewWeek,
  hasTodayViewDayPoints,
  loadTodayViewItems,
  loadTodayViewPrefs,
  loadTodayViewTotalPoints,
  parseTodayViewDateKey,
  pickTodayViewCelebration,
  saveTodayViewDayPoints,
  saveTodayViewItems,
  saveTodayViewPrefs,
  sortTodayViewItems,
  toTodayViewDateKey,
  type TodayViewCelebrationKey,
  type TodayViewPrefs,
} from "./today-view-data";
import { TodayViewItemRow } from "./today-view-item-row";
import { TodayViewEmpty } from "./today-view-empty";
import { TodayViewWeek } from "./today-view-week";
import { CELEBRATION_MS, TodayViewCelebration } from "./today-view-celebration";
import { useTodayViewCountUp } from "./use-today-view-count-up";
import "./today-view.css";

type Loaded = { dateKey: string; items: TodayViewItem[] };

/** "in 25 min" / "in 1 h 5 min" / "happening now", in the current language. */
function formatNextUp(minutes: number, t: ReturnType<typeof useI18n>["t"]): string {
  if (minutes <= 0) return t("today.happeningNow");
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return t("today.inMin", { m });
  if (m === 0) return t("today.inHours", { h });
  return t("today.inHoursMin", { h, m });
}

export function TodayViewScreen() {
  // "Today" depends on the phone's clock and timezone, so it is read on the client only.
  const [now, setNow] = useState<Date | null>(null);
  const [plan, setPlan] = useState<Loaded | null>(null);
  const [prefs, setPrefs] = useState<TodayViewPrefs>({ hideDone: false });
  const [streak, setStreak] = useState(0);
  const { t, locale } = useI18n();
  // Stored as a key so the banner follows a language change while it is showing.
  const [celebration, setCelebration] = useState<TodayViewCelebrationKey | null>(null);
  const [points, setPoints] = useState(0);
  const [gain, setGain] = useState<{ n: number; amount: number; bonus: number } | null>(null);
  // Week tabs: which week is shown, and which other day (if any) is open. null = today's own list.
  const [weekOffset, setWeekOffset] = useState(0);
  const [viewed, setViewed] = useState<Loaded | null>(null);
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

  function selectDay(dateKey: string) {
    setViewed(dateKey === plan?.dateKey ? null : { dateKey, items: loadTodayViewItems(dateKey) });
  }

  function shiftWeek(delta: -1 | 1) {
    if (!now) return;
    const next = weekOffset + delta;
    setWeekOffset(next);
    // Landing on this week selects today; any other week opens on its Monday.
    selectDay(getTodayViewWeek(now, next)[next === 0 ? (now.getDay() + 6) % 7 : 0].dateKey);
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
  const week = now ? getTodayViewWeek(now, weekOffset) : [];
  const viewedItems = viewed ? sortTodayViewItems(viewed.items) : [];

  // Remaining count on the installed app icon and in the tab title.
  useEffect(() => {
    if (!plan) return;
    const title = t("today.tabTitle");
    document.title = remaining > 0 ? `(${remaining}) ${title}` : title;
    const nav = navigator as Navigator & {
      setAppBadge?: (n?: number) => Promise<void>;
      clearAppBadge?: () => Promise<void>;
    };
    (remaining > 0 ? nav.setAppBadge?.(remaining) : nav.clearAppBadge?.())?.catch(() => {});
  }, [plan, remaining, t]);

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
                ? `${t(`greeting.${getTodayViewGreeting(now)}`)}· ${now.toLocaleDateString(locale, { weekday: "long" })}`
                : " "}
            </p>
            <h1 className="flex items-center gap-2 text-4xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-brand-600 to-pink-500 bg-clip-text text-transparent dark:from-brand-300 dark:to-pink-300">
                {now ? now.toLocaleDateString(locale, { month: "long", day: "numeric" }) : t("today.title")}
              </span>
              {sky && (
                <span aria-hidden className="today-view-float text-3xl">
                  {sky.icon}
                </span>
              )}
            </h1>
          </div>
          <div className="mt-1 flex shrink-0 items-center gap-2">
            <Link
              href="/plan-editor"
              className="rounded-full border border-black/15 px-4 py-2 text-base font-semibold transition-colors active:bg-black/5 dark:border-white/20 dark:active:bg-white/10"
            >
              {t("today.edit")}
            </Link>
            <AppMenu />
          </div>
        </div>

        {(nextUp || streak > 0) && (
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-base">
            {nextUp && (
              <p className="min-w-0 truncate font-medium">
                <span className="text-black/55 dark:text-white/55">
                  {nextUp.isNow ? t("today.now") : t("today.next")}
                </span>
                {nextUp.item.title}{" "}
                <span className={nextUp.isNow ? "font-bold text-brand-600 dark:text-brand-300" : "text-black/55 dark:text-white/55"}>
                  {formatNextUp(nextUp.minutes, t)}
                </span>
              </p>
            )}
            {streak > 0 && (
              <p className="shrink-0 font-semibold text-orange-600 dark:text-orange-400" title={t("today.streakHint")}>
                <span aria-hidden className="today-view-flame">
                  🔥
                </span>{" "}
                {t("today.streak", { n: streak })}
              </p>
            )}
          </div>
        )}

        {(points > 0 || sorted.length > 0) && (
          <div
            aria-label={t("today.pointsLabel")}
            className="relative mt-3 flex items-center justify-between gap-3 rounded-2xl bg-amber-400/15 px-4 py-2.5"
          >
            <div className="min-w-0">
              <p className="text-lg font-bold">
                <span aria-hidden>⭐</span>{" "}
                <span key={gain?.n ?? 0} className={`inline-block tabular-nums ${gain ? "today-view-points-bump" : ""}`}>
                  {shownPoints}
                </span>{" "}
                {t("today.pts")}{" "}
                <span className="text-sm font-medium text-black/55 dark:text-white/55">· {t(`rank.${level.rank}`)}</span>
              </p>
              <p className="text-sm text-black/60 dark:text-white/60">
                {allDone
                  ? t("today.bonusEarned", { n: bonusToday })
                  : t("today.bonusHint", { n: bonusToday })}
              </p>
            </div>
            {level.next !== null && (
              <p className="max-w-24 shrink-0 text-right text-sm font-medium text-black/55 dark:text-white/55">
                {t("today.toNextRank", { n: level.next - points })}
              </p>
            )}
            {gain && (
              <span
                key={gain.n}
                className="today-view-gain rounded-full bg-brand-600 px-3 py-1 text-sm font-bold whitespace-nowrap text-white shadow"
              >
                +{gain.amount}
                {gain.bonus > 0 && ` · ${t("today.gainBonus", { n: gain.bonus })}`}
              </span>
            )}
          </div>
        )}

        {plan && week.length > 0 && (
          <TodayViewWeek
            days={week}
            selectedKey={viewed?.dateKey ?? plan.dateKey}
            todayKey={plan.dateKey}
            onSelect={selectDay}
            onShiftWeek={shiftWeek}
          />
        )}

        {!viewed && sorted.length > 0 && (
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-base text-black/60 dark:text-white/60">
              <span>
                {allDone ? t("today.allDone") : t("today.progress", { done: doneCount, total: sorted.length })}
              </span>
              <span className="flex items-center gap-3">
                {doneCount > 0 && (
                  <button
                    type="button"
                    onClick={toggleHideDone}
                    aria-pressed={prefs.hideDone}
                    className="rounded-full border border-black/15 px-3 py-0.5 text-sm font-semibold transition-colors active:bg-black/5 dark:border-white/20 dark:active:bg-white/10"
                  >
                    {prefs.hideDone ? t("today.showDone", { n: doneCount }) : t("today.hideDone")}
                  </button>
                )}
                <span className="tabular-nums">{shownPercent}%</span>
              </span>
            </div>
            <div
              role="progressbar"
              aria-label={t("today.progressLabel")}
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/15"
            >
              <div
                className="today-view-progress-fill h-full rounded-full bg-gradient-to-r from-brand-500 to-pink-400"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        )}
      </header>

      {plan === null ? (
        <div className="flex-1" aria-busy="true" />
      ) : viewed ? (
        <section>
          <div className="mb-1 flex items-center justify-between gap-3 px-3">
            <h2 className="text-lg font-semibold">
              {parseTodayViewDateKey(viewed.dateKey).toLocaleDateString(locale, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </h2>
            <button
              type="button"
              onClick={() => {
                setWeekOffset(0);
                setViewed(null);
              }}
              className="shrink-0 rounded-full border border-black/15 px-3 py-0.5 text-sm font-semibold transition-colors active:bg-black/5 dark:border-white/20 dark:active:bg-white/10"
            >
              {t("today.backToToday")}
            </button>
          </div>
          {viewedItems.length === 0 ? (
            <div className="today-view-rise flex flex-col items-center gap-3 py-10 text-center">
              <p className="text-lg text-black/55 dark:text-white/55">{t("today.emptyDay")}</p>
              <Link
                href={`/plan-editor?date=${viewed.dateKey}`}
                className="rounded-full bg-brand-600 px-5 py-2.5 text-base font-semibold text-white"
              >
                {t("today.planThisDay")}
              </Link>
            </div>
          ) : (
            <ul className="flex flex-col gap-1">
              {viewedItems.map((item, i) => (
                <TodayViewItemRow key={item.id} item={item} index={i} status={null} onToggle={toggleDone} readOnly />
              ))}
            </ul>
          )}
        </section>
      ) : sorted.length === 0 ? (
        <TodayViewEmpty />
      ) : visible.length === 0 ? (
        <p className="today-view-rise py-10 text-center text-lg text-black/55 dark:text-white/55">
          {t("today.allHidden")}
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

      {!viewed && sorted.length > 0 && !prefs.hideDone && remaining > 0 && (
        <p className="mt-6 px-3 text-center text-sm text-black/40 dark:text-white/40">
          {t("today.swipeTip")}
        </p>
      )}

      {celebration && <TodayViewCelebration message={t(celebration)} />}
    </main>
  );
}
