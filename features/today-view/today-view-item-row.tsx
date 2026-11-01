"use client";

import { useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { useI18n } from "@/lib/i18n/provider";
import type { TodayViewItem } from "./types";
import { formatTodayViewTime, type TodayViewItemStatus } from "./today-view-data";
import "./today-view.css";

type Props = {
  item: TodayViewItem;
  status: TodayViewItemStatus;
  /** Position in the list, used to stagger the entrance animation. */
  index: number;
  onToggle: (id: string) => void;
  /** Other days are view-only: points and streak only change from today's list. */
  readOnly?: boolean;
};

const BADGE: Record<"now" | "next", { label: "today.badge.now" | "today.badge.next"; className: string }> = {
  now: { label: "today.badge.now", className: "bg-brand-600 text-white" },
  next: { label: "today.badge.next", className: "bg-black/10 text-black/80 dark:bg-white/15 dark:text-white/85" },
};

/** How far (px) a swipe must travel to toggle the item. */
const SWIPE_TRIGGER = 90;
const SWIPE_MAX = 140;

type Ripple = { id: number; x: number; y: number };

export function TodayViewItemRow({ item, status, index, onToggle, readOnly = false }: Props) {
  const { t, locale } = useI18n();
  const [popping, setPopping] = useState(false);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const gesture = useRef<{ x: number; y: number; swiping: boolean } | null>(null);
  const suppressClick = useRef(false);
  const rippleId = useRef(0);
  const highlighted = status === "now" || status === "next";

  function toggle() {
    if (!item.isDone) {
      setPopping(true);
      navigator.vibrate?.(12);
    }
    onToggle(item.id);
  }

  function onPointerDown(e: PointerEvent<HTMLButtonElement>) {
    gesture.current = { x: e.clientX, y: e.clientY, swiping: false };
    const rect = e.currentTarget.getBoundingClientRect();
    rippleId.current += 1;
    const ripple = { id: rippleId.current, x: e.clientX - rect.left, y: e.clientY - rect.top };
    setRipples((r) => [...r, ripple]);
  }

  function onPointerMove(e: PointerEvent<HTMLButtonElement>) {
    const g = gesture.current;
    if (!g) return;
    const moveX = e.clientX - g.x;
    const moveY = e.clientY - g.y;
    if (!g.swiping) {
      if (moveX > 10 && Math.abs(moveX) > Math.abs(moveY) * 1.5) {
        g.swiping = true;
        setDragging(true);
        e.currentTarget.setPointerCapture(e.pointerId);
      } else if (Math.abs(moveY) > 10 || moveX < -10) {
        gesture.current = null; // vertical scroll or left swipe: not ours
        return;
      } else {
        return;
      }
    }
    // Rubber-band past the trigger point.
    const x = moveX <= SWIPE_TRIGGER ? moveX : SWIPE_TRIGGER + (moveX - SWIPE_TRIGGER) * 0.35;
    setDx(Math.max(0, Math.min(SWIPE_MAX, x)));
  }

  function endGesture() {
    const g = gesture.current;
    gesture.current = null;
    setDragging(false);
    if (g?.swiping) {
      suppressClick.current = true;
      if (dx >= SWIPE_TRIGGER) toggle();
    }
    setDx(0);
  }

  function onClick() {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    toggle();
  }

  const revealProgress = Math.min(1, dx / SWIPE_TRIGGER);

  return (
    <li
      data-item-id={item.id}
      className="today-view-rise relative"
      style={{ animationDelay: `${index * 55}ms` } as CSSProperties}
    >
      {dx > 0 && (
        <div
          aria-hidden
          className={`absolute inset-0 flex items-center rounded-2xl px-5 text-lg font-bold text-white ${
            item.isDone ? "bg-slate-500" : "bg-brand-600"
          }`}
          style={{ opacity: 0.35 + revealProgress * 0.65 }}
        >
          <span style={{ transform: `scale(${0.8 + revealProgress * 0.3})` }}>
            {item.isDone ? t("today.swipeUndo") : t("today.swipeDone")}
          </span>
        </div>
      )}

      <button
        type="button"
        role="checkbox"
        aria-checked={item.isDone}
        disabled={readOnly}
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endGesture}
        onPointerCancel={endGesture}
        data-dragging={dragging}
        style={{ transform: dx ? `translateX(${dx}px)` : undefined }}
        className={`today-view-swipe relative flex w-full items-center gap-4 overflow-hidden rounded-2xl px-3 py-3 text-left select-none ${
          dx > 0
            ? "bg-background shadow-md"
            : status === "now"
              ? "bg-brand-500/10 ring-1 ring-brand-600/30"
              : ""
        }`}
      >
        <span aria-hidden className="pointer-events-none absolute inset-0 text-brand-500">
          {ripples.map((r) => (
            <span
              key={r.id}
              className="today-view-ripple"
              style={{ left: r.x, top: r.y }}
              onAnimationEnd={() => setRipples((all) => all.filter((x) => x.id !== r.id))}
            />
          ))}
        </span>

        <span
          aria-hidden
          onAnimationEnd={(e) => {
            if (e.animationName.includes("pop")) setPopping(false);
          }}
          className={`relative flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200 ${
            popping ? "today-view-pop" : ""
          } ${
            item.isDone
              ? "border-brand-600 bg-brand-600 text-white"
              : "border-black/30 dark:border-white/40"
          }`}
        >
          {item.isDone && (
            <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth={3}>
              <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>

        <span className="relative min-w-0 flex-1">
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
          <span className="relative flex shrink-0 flex-col items-end gap-1">
            {highlighted && (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold tracking-wide uppercase ${
                  BADGE[status].className
                } ${status === "now" ? "today-view-pulse" : ""}`}
              >
                {t(BADGE[status].label)}
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
              title={status === "missed" ? t("today.timePassed") : undefined}
            >
              {formatTodayViewTime(item.startTime, locale)}
            </span>
          </span>
        )}
      </button>
    </li>
  );
}
