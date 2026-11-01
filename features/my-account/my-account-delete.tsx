"use client";

import { useState, type FormEvent } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { deleteMyAccount } from "./my-account-data";
import { myAccountInputClass } from "./my-account-profile-form";
import type { MyAccountUser } from "./types";

/** Permanent account deletion (an App Store requirement). Needs the user to type their own email. */
export function MyAccountDelete({ user }: { user: MyAccountUser }) {
  const { t } = useI18n();
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const confirmed = typed.trim().toLowerCase() === user.email.toLowerCase() && user.email !== "";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!confirmed || busy) return;
    setBusy(true);
    setFailed(false);
    const result = await deleteMyAccount(user.id);
    if (result.ok) {
      // A full page load so nothing from the deleted account stays in memory.
      window.location.replace("/signup");
    } else {
      setBusy(false);
      setFailed(true);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
      <p className="text-sm text-black/65 dark:text-white/65">{t("acct.dangerText")}</p>
      <label className="flex flex-col gap-1 text-sm font-medium text-black/60 dark:text-white/60">
        {t("acct.deleteConfirm")}
        <input
          type="email"
          autoComplete="off"
          placeholder={user.email}
          value={typed}
          onChange={(e) => {
            setTyped(e.target.value);
            setFailed(false);
          }}
          className={`${myAccountInputClass} text-black dark:text-white`}
        />
      </label>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!confirmed || busy}
          className="rounded-xl bg-red-600 px-5 py-3 text-base font-semibold text-white transition-opacity active:opacity-80 disabled:opacity-40"
        >
          {busy ? t("acct.deleting") : t("acct.deleteButton")}
        </button>
        {failed && (
          <span role="alert" className="text-sm font-semibold text-red-600 dark:text-red-400">
            {t("acct.deleteError")}
          </span>
        )}
      </div>
    </form>
  );
}
