"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { AppMenu } from "@/components/app-menu";
import type { MessageKey } from "@/lib/i18n/messages";
import { useI18n } from "@/lib/i18n/provider";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const MIN_PASSWORD = 8;

type Phase = "checking" | "ready" | "invalid" | "notConfigured" | "done";

/**
 * Step 2 of "forgot password": the emailed link brings the user here with a one-time recovery code.
 * The Supabase browser client turns that code into a short session by itself on load; we only wait for it,
 * then let the user choose a new password.
 */
export function ResetPasswordForm() {
  const { t } = useI18n();
  const [phase, setPhase] = useState<Phase>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<MessageKey | { text: string } | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- decided from build-time config
      setPhase("notConfigured");
      return;
    }
    const supabase = createClient();
    let cancelled = false;

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!cancelled && session && (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN")) {
        setPhase((p) => (p === "done" ? p : "ready"));
      }
    });
    // getSession() waits until the code in the link has been exchanged, so "no session" here means
    // the link was wrong, already used, or expired.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled) setPhase((p) => (p === "checking" ? (session ? "ready" : "invalid") : p));
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < MIN_PASSWORD) return setError("acct.passwordShort");
    if (password !== confirm) return setError("acct.passwordMismatch");

    setPending(true);
    const { error } = await createClient().auth.updateUser({ password });
    setPending(false);

    if (error) {
      // Supabase explains things like "New password should be different from the old password".
      setError({ text: error.message });
      return;
    }
    setPhase("done");
    // A full page load so the app starts fresh as this user.
    window.setTimeout(() => window.location.replace("/today-view"), 1500);
  }

  return (
    <main className="relative mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-12">
      <AppMenu className="absolute top-[max(1rem,env(safe-area-inset-top))] right-6" />
      <h1 className="mb-6 text-3xl font-bold">{t("auth.reset.title")}</h1>

      {phase === "checking" && (
        <p aria-busy="true" className="text-base text-black/60 dark:text-white/60">
          {t("auth.reset.checking")}
        </p>
      )}

      {phase === "notConfigured" && (
        <p role="alert" className="text-sm text-red-600">
          {t("auth.notConfigured")}
        </p>
      )}

      {phase === "invalid" && (
        <div className="flex flex-col items-start gap-4">
          <p role="alert" className="text-base text-red-600 dark:text-red-400">
            {t("auth.reset.invalid")}
          </p>
          <Link href="/forgot-password" className="rounded-lg bg-brand-600 px-4 py-3 text-base font-semibold text-white">
            {t("auth.reset.requestNew")}
          </Link>
        </div>
      )}

      {phase === "done" && (
        <p role="status" className="rounded-xl bg-green-600/10 p-4 text-base text-green-800 dark:text-green-300">
          {t("auth.reset.done")}
        </p>
      )}

      {phase === "ready" && (
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium">
            {t("acct.newPassword")}
            <input
              type="password"
              required
              autoComplete="new-password"
              placeholder={t("auth.passwordHint")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-black/15 bg-transparent px-3 py-3 text-base dark:border-white/20"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            {t("acct.confirmPassword")}
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="rounded-lg border border-black/15 bg-transparent px-3 py-3 text-base dark:border-white/20"
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {typeof error === "string" ? t(error) : error.text}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="mt-1 rounded-lg bg-brand-600 px-4 py-3 text-base font-semibold text-white disabled:opacity-50"
          >
            {pending ? t("auth.pending") : t("auth.reset.button")}
          </button>
        </form>
      )}
    </main>
  );
}
