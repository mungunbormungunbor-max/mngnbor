"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AppMenu } from "@/components/app-menu";
import type { MessageKey } from "@/lib/i18n/messages";
import { useI18n } from "@/lib/i18n/provider";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/** Step 1 of "forgot password": email a reset link. The link opens /reset-password. */
export function ForgotPasswordForm() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<MessageKey | { text: string } | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isSupabaseConfigured) {
      setError("auth.notConfigured");
      return;
    }

    setPending(true);
    const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), {
      // This address must be listed in Supabase -> Authentication -> URL Configuration -> Redirect URLs.
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setPending(false);

    if (error) {
      setError({ text: error.message });
      return;
    }
    // The same message whether or not the email has an account, so nobody can use this form to find out
    // which emails are registered.
    setSent(true);
  }

  return (
    <main className="relative mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-12">
      <AppMenu className="absolute top-[max(1rem,env(safe-area-inset-top))] right-6" />
      <h1 className="mb-3 text-3xl font-bold">{t("auth.forgot.title")}</h1>
      <p className="mb-6 text-base text-black/65 dark:text-white/65">{t("auth.forgot.text")}</p>

      {sent ? (
        <p role="status" className="rounded-xl bg-green-600/10 p-4 text-base text-green-800 dark:text-green-300">
          {t("auth.forgot.sent")}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium">
            {t("auth.email")}
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            {pending ? t("auth.pending") : t("auth.forgot.button")}
          </button>
        </form>
      )}

      <p className="mt-6 text-sm">
        <Link href="/login" className="font-semibold underline">
          {t("auth.forgot.back")}
        </Link>
      </p>
    </main>
  );
}
