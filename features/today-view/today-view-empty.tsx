import Link from "next/link";
import "./today-view.css";

export function TodayViewEmpty() {
  return (
    <div className={`flex flex-1 flex-col items-center justify-center gap-4 text-center today-view-rise`}>
      <p className="text-5xl" aria-hidden>
        ☀️
      </p>
      <p className="text-2xl font-semibold">Nothing planned today</p>
      <p className="max-w-64 text-lg text-black/60 dark:text-white/60">
        Enjoy the free day, or add a few things to do.
      </p>
      <Link
        href="/plan-editor"
        className="mt-2 rounded-full bg-foreground px-6 py-3 text-lg font-semibold text-background"
      >
        Plan my day
      </Link>
    </div>
  );
}
