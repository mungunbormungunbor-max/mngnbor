"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";

/**
 * Smoothly slides list rows to their new position when the list re-sorts or items are added/removed.
 * Mark each row with `data-flip-id`; change `signature` whenever the order may have changed.
 */
export function usePlanEditorFlip(rootRef: RefObject<HTMLElement | null>, signature: string) {
  const previous = useRef(new Map<string, number>());

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const next = new Map<string, number>();

    root.querySelectorAll<HTMLElement>("[data-flip-id]").forEach((el) => {
      const id = el.dataset.flipId!;
      // Document-relative position, so scrolling between renders doesn't look like movement.
      const top = el.getBoundingClientRect().top + window.scrollY;
      next.set(id, top);
      const before = previous.current.get(id);
      if (!reduce && before !== undefined && Math.abs(before - top) > 1) {
        el.animate(
          [{ transform: `translateY(${before - top}px)` }, { transform: "translateY(0)" }],
          { duration: 300, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
        );
      }
    });

    previous.current = next;
  }, [rootRef, signature]);
}
