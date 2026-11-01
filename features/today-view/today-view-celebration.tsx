"use client";

import type { CSSProperties } from "react";
import "./today-view.css";

const COLORS = ["#8467f5", "#ff7eb6", "#f59e0b", "#38bdf8", "#6d4ae0", "#fb7185"];
const PIECES = 36;

/** Deterministic pseudo-random in [0, 1) so renders are stable. */
function rand(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/** Confetti burst + "All done!" banner. The parent unmounts it after CELEBRATION_MS. */
export const CELEBRATION_MS = 2800;

export function TodayViewCelebration({ message }: { message: string }) {
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {Array.from({ length: PIECES }, (_, i) => (
        <span
          key={i}
          className="today-view-confetti-piece"
          style={
            {
              left: `${rand(i) * 100}%`,
              background: COLORS[i % COLORS.length],
              "--dx": `${(rand(i + 100) - 0.5) * 160}px`,
              "--spin": `${360 + rand(i + 200) * 720}deg`,
              "--dur": `${1600 + rand(i + 300) * 1200}ms`,
              "--delay": `${rand(i + 400) * 250}ms`,
            } as CSSProperties
          }
        />
      ))}
      <div
        className={`today-view-banner absolute top-[max(1.5rem,env(safe-area-inset-top))] left-1/2 rounded-full bg-brand-600 px-6 py-3 text-lg font-bold whitespace-nowrap text-white shadow-lg`}
      >
        {message}
      </div>
    </div>
  );
}
