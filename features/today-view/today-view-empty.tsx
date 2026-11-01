"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/provider";
import "./today-view.css";

export function TodayViewEmpty() {
  const { t } = useI18n();
  return (
    <div className={`flex flex-1 flex-col items-center justify-center gap-4 text-center today-view-rise`}>
      <p className="text-5xl" aria-hidden>
        ☀️
      </p>
      <p className="text-2xl font-semibold">{t("today.empty.title")}</p>
      <p className="max-w-64 text-lg text-black/60 dark:text-white/60">{t("today.empty.text")}</p>
      <Link
        href="/plan-editor"
        className="mt-2 rounded-full bg-brand-600 px-6 py-3 text-lg font-semibold text-white"
      >
        {t("today.empty.button")}
      </Link>
    </div>
  );
}
