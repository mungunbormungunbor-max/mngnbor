"use client";

import { useState, type CSSProperties } from "react";
import type { TodayViewItem } from "./types";
import { formatTodayViewTime, type TodayViewItemStatus } from "./today-view-data";
import "./today-view.css";

type Props = {
  item: TodayViewItem;
  status: TodayViewItemStatus;
  /** Position in the list, used to stagger the entrance animation. */
  index: number;
  onToggle: (id: string) => void;
};

const BADGE: Record<"now" | "next", { label: string; className: string }> = {
  now: { label: "Now", className: "bg-emerald-600 text-white" },
  next: { label: "Next", className: "bg-black/10 text-black/80 dark:bg-white/15 dark:text-white/85" },
};

export function TodayViewItemRow({ item, status, index, onToggle }: Props) {
  const [popping, setPopping] = useState(false);
  const highlighted = status === "now" || status === "next";

  function handleTap() {
    if (!item.isDone) {
      setPopping(true);
      // Short haptic tick on phones that support it.
      navigator.vibrate?.(12);
    }
    onToggle(item.id);
  }

  return (
    <li className="today-view-rise" style={{ animationDelay: `${index * 55}ms` } as CSSProperties}>
      <button
        type="button"
        role="checkbox"
        aria-checked={item.isDone}
        onClick={handleTap}
        className={`flex w-full items-center gap-4 rounded-2xl px-3 py-3 text-left transition-colors active:scale-[0.99] active:bg-black/5 dark:active:bg-white/10 ${
          highlighted && status === "now" ? "bg-emerald-500/10 ring-1 ring-emerald-600/30" : ""
        }`}
      >
        <span
          aria-hidden
          onAnimationEnd={() => setPopping(false)}
          className={`flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200 ${
            popping ? "today-view-pop" : ""
          } ${
            item.isDone
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-black/30 dark:border-white/40"
          }`}
        >
          {item.isDone && (
            <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth={3}>
              <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate">
            <span
              className={`text-xl font-semibold today-view-strike ${
                item.isDone ? "today-view-strike-on text-black/40 dark:text-white/40" : ""
              }`}
            >
              {item.title}
            </span>
          </span>
          {item.note && (
            <span className="block truncate text-base text-black/55 dark:text-white/55">{item.note}</span>
          )}
        </span>

        {item.startTime && (
          <span className="flex shrink-0 flex-col items-end gap-1">
            {highlighted && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${
                  BADGE[status].className
                } ${status === "now" ? "today-view-pulse" : ""}`}
              >
                {BADGE[status].label}
              </span>
            )}
            <span
              className={`text-lg tabular-nums transition-colors ${
                item.isDone
                  ? "text-black/35 dark:text-white/35"
                  : status === "missed"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-black/70 dark:text-white/70"
              }`}
              title={status === "missed" ? "Time has passed" : undefined}
            >
              {formatTodayViewTime(item.startTime)}
            </span>
          </span>
        )}
      </button>
    </li>
  );
}
