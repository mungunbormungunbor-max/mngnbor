"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { AppMenu } from "@/components/app-menu";
import { useI18n } from "@/lib/i18n/provider";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { loadMyAccount, signOutMyAccount } from "./my-account-data";
import { MyAccountDelete } from "./my-account-delete";
import { MyAccountPasswordForm } from "./my-account-password-form";
import { MyAccountProfileForm } from "./my-account-profile-form";
import type { MyAccountLoaded, MyAccountProfile } from "./types";

type State =
  | { kind: "loading" }
  | { kind: "notConnected" }
  | { kind: "signedOut" }
  | { kind: "error" }
  | { kind: "ready"; account: MyAccountLoaded };

function Card({ title, children, tone }: { title: string; children: ReactNode; tone?: "danger" }) {
  return (
    <section
      className={`mt-4 rounded-2xl p-4 ${
        tone === "danger" ? "border border-red-500/30 bg-red-500/[0.06]" : "bg-black/[0.03] dark:bg-white/[0.06]"
      }`}
    >
      <h2
        className={`mb-3 text-sm font-semibold tracking-wide uppercase ${
          tone === "danger" ? "text-red-600 dark:text-red-400" : "text-black/55 dark:text-white/55"
        }`}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

export function MyAccountScreen() {
  const { t } = useI18n();
  const [state, setState] = useState<State>({ kind: "loading" });
  const [copied, setCopied] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- decided from build-time config
      setState({ kind: "notConnected" });
      return;
    }
    let cancelled = false;
    loadMyAccount()
      .then((account) => {
        if (!cancelled) setState(account ? { kind: "ready", account } : { kind: "signedOut" });
      })
      .catch(() => {
        if (!cancelled) setState({ kind: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  async function copyId(id: string) {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard can be blocked; the ID is selectable text, so the user can still copy it by hand.
    }
  }

  async function signOut() {
    setSigningOut(true);
    await signOutMyAccount();
    // A full page load so nothing from this account stays in memory.
    window.location.replace("/login");
  }

  function onProfileSaved(profile: MyAccountProfile) {
    setState((s) => (s.kind === "ready" ? { kind: "ready", account: { ...s.account, profile } } : s));
  }

  const ready = state.kind === "ready" ? state.account : null;
  const shownName = ready ? ready.profile.displayName || ready.user.email : "";
  const initial = (shownName.trim()[0] ?? "?").toUpperCase();

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(3rem,env(safe-area-inset-bottom))]">
      <header className="mb-2 flex items-center gap-3">
        <Link
          href="/today-view"
          aria-label={t("acct.back")}
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-black/15 text-xl active:bg-black/5 dark:border-white/20 dark:active:bg-white/10"
        >
          ←
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-3xl font-bold tracking-tight">{t("acct.title")}</h1>
        <AppMenu className="shrink-0" />
      </header>

      {state.kind === "loading" && (
        <p aria-busy="true" className="py-16 text-center text-lg text-black/55 dark:text-white/55">
          {t("acct.loading")}
        </p>
      )}

      {state.kind === "notConnected" && (
        <p className="mt-6 rounded-2xl bg-amber-400/15 p-4 text-base">{t("acct.notConnected")}</p>
      )}

      {state.kind === "signedOut" && (
        <div className="mt-6 flex flex-col items-start gap-3">
          <p className="text-lg">{t("acct.signedOut")}</p>
          <div className="flex gap-2">
            <Link href="/login" className="rounded-xl bg-brand-600 px-5 py-3 text-base font-semibold text-white">
              {t("auth.login.button")}
            </Link>
            <Link
              href="/signup"
              className="rounded-xl border border-black/15 px-5 py-3 text-base font-semibold dark:border-white/20"
            >
              {t("auth.signup.button")}
            </Link>
          </div>
        </div>
      )}

      {state.kind === "error" && (
        <div className="mt-6 flex flex-col items-start gap-3">
          <p role="alert" className="text-base text-red-600 dark:text-red-400">
            {t("acct.loadError")}
          </p>
          <button
            type="button"
            onClick={() => {
              setState({ kind: "loading" });
              setAttempt((n) => n + 1);
            }}
            className="rounded-xl border border-black/15 px-5 py-3 text-base font-semibold dark:border-white/20"
          >
            {t("acct.retry")}
          </button>
        </div>
      )}

      {ready && (
        <>
          <section className="mt-4 flex items-center gap-4 rounded-3xl bg-gradient-to-br from-brand-600 to-pink-500 p-5 text-white shadow-lg">
            <span
              aria-hidden
              className="flex size-16 shrink-0 items-center justify-center rounded-full bg-white/20 text-3xl font-bold"
            >
              {initial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xl font-bold">{shownName}</p>
              {ready.profile.displayName && <p className="truncate text-sm opacity-85">{ready.user.email}</p>}
            </div>
          </section>

          <Card title={t("acct.userId")}>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 rounded-xl bg-black/[0.05] px-3 py-2.5 text-sm break-all select-all dark:bg-white/10">
                {ready.user.id}
              </code>
              <button
                type="button"
                onClick={() => copyId(ready.user.id)}
                className="shrink-0 rounded-xl border border-black/15 px-3 py-2.5 text-sm font-semibold active:bg-black/5 dark:border-white/20 dark:active:bg-white/10"
              >
                {copied ? t("acct.copied") : t("acct.copy")}
              </button>
            </div>
            <p className="mt-2 text-sm text-black/55 dark:text-white/55">{t("acct.userIdHint")}</p>
            <p className="mt-1 text-sm text-black/55 dark:text-white/55">🔒 {t("acct.privacy")}</p>
          </Card>

          <Card title={t("acct.profile")}>
            <MyAccountProfileForm user={ready.user} profile={ready.profile} onSaved={onProfileSaved} />
          </Card>

          <Card title={t("acct.settings")}>
            <h3 className="mb-2 text-base font-semibold">{t("acct.changePassword")}</h3>
            <MyAccountPasswordForm />
            <hr className="my-4 border-black/10 dark:border-white/15" />
            <button
              type="button"
              onClick={signOut}
              disabled={signingOut}
              className="rounded-xl border border-black/15 px-5 py-3 text-base font-semibold active:bg-black/5 disabled:opacity-50 dark:border-white/20 dark:active:bg-white/10"
            >
              {t("acct.signOut")}
            </button>
          </Card>

          <Card title={t("acct.danger")} tone="danger">
            <MyAccountDelete user={ready.user} />
          </Card>
        </>
      )}
    </main>
  );
}
