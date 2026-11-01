"use client";

import { useState, type FormEvent } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { MY_ACCOUNT_PASSWORD_MIN, changeMyAccountPassword } from "./my-account-data";
import { myAccountInputClass } from "./my-account-profile-form";

type Status =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "done" }
  | { kind: "short" }
  | { kind: "mismatch" }
  | { kind: "error"; message: string | null };

export function MyAccountPasswordForm() {
  const { t } = useI18n();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < MY_ACCOUNT_PASSWORD_MIN) return setStatus({ kind: "short" });
    if (password !== confirm) return setStatus({ kind: "mismatch" });
    setStatus({ kind: "saving" });
    const result = await changeMyAccountPassword(password);
    if (result.ok) {
      setPassword("");
      setConfirm("");
      setStatus({ kind: "done" });
    } else {
      // "network" / "invalid" are ours; anything else is Supabase's own explanation.
      setStatus({ kind: "error", message: result.error === "network" || result.error === "invalid" ? null : result.error });
    }
  }

  const message =
    status.kind === "short"
      ? t("acct.passwordShort")
      : status.kind === "mismatch"
        ? t("acct.passwordMismatch")
        : status.kind === "error"
          ? (status.message ?? t("acct.passwordError"))
          : null;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm font-medium text-black/60 dark:text-white/60">
        {t("acct.newPassword")}
        <input
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setStatus({ kind: "idle" });
          }}
          placeholder={t("auth.passwordHint")}
          className={`${myAccountInputClass} text-black dark:text-white`}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-black/60 dark:text-white/60">
        {t("acct.confirmPassword")}
        <input
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            setStatus({ kind: "idle" });
          }}
          className={`${myAccountInputClass} text-black dark:text-white`}
        />
      </label>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status.kind === "saving" || !password}
          className="rounded-xl bg-brand-600 px-5 py-3 text-base font-semibold text-white transition-opacity active:opacity-80 disabled:opacity-40"
        >
          {t("acct.changePassword")}
        </button>
        <span role="status" className="text-sm font-semibold">
          {status.kind === "done" && <span className="text-emerald-600 dark:text-emerald-400">{t("acct.passwordChanged")}</span>}
          {message && <span className="text-red-600 dark:text-red-400">{message}</span>}
        </span>
      </div>
    </form>
  );
}
