"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { AppMenu } from "@/components/app-menu";
import type { MessageKey } from "@/lib/i18n/messages";
import { useI18n } from "@/lib/i18n/provider";

type Mode = "login" | "signup";

const altHref = { login: "/signup", signup: "/login" } as const;

export function AuthForm({ mode }: { mode: Mode }) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Our own messages are stored as keys so they re-translate if the language changes;
  // errors from Supabase arrive as plain text.
  const [error, setError] = useState<MessageKey | { text: string } | null>(null);
  const [message, setMessage] = useState<MessageKey | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!isSupabaseConfigured) {
      setError("auth.notConfigured");
      return;
    }

    setPending(true);
    const supabase = createClient();
    const { data, error } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            // The database trigger copies this into the new user's profile (sql/my-account.sql).
            options: { data: { display_name: name.trim().slice(0, 60) } },
          });
    setPending(false);

    if (error) {
      setError({ text: error.message });
      return;
    }
    if (mode === "signup" && !data.session) {
      setMessage("auth.checkEmail");
      return;
    }
    // A full page load, so the app starts fresh with this user's own data and nothing from a previous account.
    window.location.replace("/today-view");
  }

  return (
    <main className="relative mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-12">
      <AppMenu className="absolute top-[max(1rem,env(safe-area-inset-top))] right-6" />
      <h1 className="mb-8 text-3xl font-bold">{t(`auth.${mode}.title`)}</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {mode === "signup" && (
          <label className="flex flex-col gap-1 text-sm font-medium">
            {t("auth.name")}
            <input
              type="text"
              autoComplete="name"
              maxLength={60}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-black/15 bg-transparent px-3 py-3 text-base dark:border-white/20"
            />
          </label>
        )}
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
        <label className="flex flex-col gap-1 text-sm font-medium">
          {t("auth.password")}
          <input
            type="password"
            required
            minLength={mode === "signup" ? 8 : undefined}
            placeholder={mode === "signup" ? t("auth.passwordHint") : undefined}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-black/15 bg-transparent px-3 py-3 text-base dark:border-white/20"
          />
        </label>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {typeof error === "string" ? t(error) : error.text}
          </p>
        )}
        {message && <p className="text-sm text-green-700 dark:text-green-400">{t(message)}</p>}
        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-lg bg-brand-600 px-4 py-3 text-base font-semibold text-white disabled:opacity-50"
        >
          {pending ? t("auth.pending") : t(`auth.${mode}.button`)}
        </button>
      </form>
      <p className="mt-6 text-sm">
        {t(`auth.${mode}.alt`)}{" "}
        <Link href={altHref[mode]} className="font-semibold underline">
          {t(`auth.${mode}.altLink`)}
        </Link>
      </p>
    </main>
  );
}
