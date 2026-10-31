"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type Mode = "login" | "signup";

const copy = {
  login: { title: "Log in", button: "Log in", alt: "No account yet?", altLink: "/signup", altText: "Sign up" },
  signup: { title: "Create account", button: "Sign up", alt: "Already have an account?", altLink: "/login", altText: "Log in" },
} as const;

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const t = copy[mode];

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!isSupabaseConfigured) {
      setError("Supabase is not connected yet. Add your keys to .env.local.");
      return;
    }

    setPending(true);
    const supabase = createClient();
    const { data, error } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    setPending(false);

    if (error) {
      setError(error.message);
      return;
    }
    if (mode === "signup" && !data.session) {
      setMessage("Check your email to confirm your account, then log in.");
      return;
    }
    router.replace("/today-view");
    router.refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-12">
      <h1 className="mb-8 text-3xl font-bold">{t.title}</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Email
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
          Password
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-black/15 bg-transparent px-3 py-3 text-base dark:border-white/20"
          />
        </label>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-700 dark:text-green-400">{message}</p>}
        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-lg bg-foreground px-4 py-3 text-base font-semibold text-background disabled:opacity-50"
        >
          {pending ? "Please wait…" : t.button}
        </button>
      </form>
      <p className="mt-6 text-sm">
        {t.alt}{" "}
        <Link href={t.altLink} className="font-semibold underline">
          {t.altText}
        </Link>
      </p>
    </main>
  );
}
