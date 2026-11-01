"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LANGUAGES, LANGUAGE_NAMES } from "@/lib/i18n/messages";
import { ControlsPanel } from "@/components/controls-panel";
import { ThemePicker } from "@/components/theme-picker";
import { NotificationsPanel } from "@/features/notifications";
import { useI18n } from "@/lib/i18n/provider";

const NAV = [
  { href: "/today-view", icon: "☀️", label: "menu.today" },
  { href: "/plan-editor", icon: "📝", label: "menu.plan" },
  { href: "/money-tracker", icon: "💰", label: "menu.money" },
  { href: "/my-account", icon: "👤", label: "menu.account" },
] as const;

/** Small hamburger menu with the language options (Монгол / English). */
export function AppMenu({ className = "" }: { className?: string }) {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={t("menu.open")}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex size-11 items-center justify-center rounded-full border border-black/15 transition-colors active:bg-black/5 dark:border-white/20 dark:active:bg-white/10"
      >
        <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <path d="M3 5h14M3 10h14M3 15h14" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-72 max-w-[calc(100vw-2rem)] max-h-[80vh] overflow-y-auto rounded-2xl border border-black/10 bg-background p-1 shadow-lg dark:border-white/15"
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-base font-medium active:bg-black/5 dark:active:bg-white/10"
            >
              <span aria-hidden>{item.icon}</span>
              {t(item.label)}
            </Link>
          ))}
          <p className="mt-1 border-t border-black/10 px-3 pt-3 pb-1 text-xs font-semibold tracking-wide text-black/50 uppercase dark:border-white/15 dark:text-white/50">
            {t("menu.language")}
          </p>
          {LANGUAGES.map((code) => (
            <button
              key={code}
              type="button"
              role="menuitemradio"
              aria-checked={lang === code}
              onClick={() => {
                setLang(code);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-base font-medium active:bg-black/5 dark:active:bg-white/10"
            >
              {LANGUAGE_NAMES[code]}
              {lang === code && (
                <svg viewBox="0 0 20 20" className="size-5 text-brand-600 dark:text-brand-300" fill="none" stroke="currentColor" strokeWidth={3}>
                  <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          ))}
          <ThemePicker />
          <ControlsPanel />
          <NotificationsPanel />
        </div>
      )}
    </div>
  );
}
