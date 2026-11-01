"use client";

import { useState, type FormEvent } from "react";
import { useI18n } from "@/lib/i18n/provider";
import { MY_ACCOUNT_NAME_MAX, cleanMyAccountName, saveMyAccountName } from "./my-account-data";
import type { MyAccountProfile, MyAccountUser } from "./types";

export const myAccountInputClass =
  "block h-12 w-full min-w-0 rounded-xl border border-black/15 bg-transparent px-3 text-base outline-none transition-colors focus:border-brand-600 dark:border-white/20 dark:focus:border-brand-400";

type Props = {
  user: MyAccountUser;
  profile: MyAccountProfile;
  onSaved: (profile: MyAccountProfile) => void;
};

type Status = "idle" | "saving" | "saved" | "error" | "tooLong";

/** View and edit your own profile. The email is shown but can't be edited here. */
export function MyAccountProfileForm({ user, profile, onSaved }: Props) {
  const { t, locale } = useI18n();
  const [name, setName] = useState(profile.displayName);
  const [status, setStatus] = useState<Status>("idle");

  const memberSince = new Date(user.createdAt).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const unchanged = cleanMyAccountName(name) === profile.displayName;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (cleanMyAccountName(name).length > MY_ACCOUNT_NAME_MAX) {
      setStatus("tooLong");
      return;
    }
    setStatus("saving");
    const result = await saveMyAccountName(user.id, name);
    if (result.ok) {
      const saved = { displayName: cleanMyAccountName(name) };
      setName(saved.displayName);
      onSaved(saved);
      setStatus("saved");
    } else {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm font-medium text-black/60 dark:text-white/60">
        {t("acct.displayName")}
        <input
          type="text"
          autoComplete="name"
          maxLength={MY_ACCOUNT_NAME_MAX + 20}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setStatus("idle");
          }}
          className={`${myAccountInputClass} text-black dark:text-white`}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium text-black/60 dark:text-white/60">
        {t("auth.email")}
        <input
          type="email"
          readOnly
          value={user.email}
          className={`${myAccountInputClass} bg-black/[0.04] text-black/70 dark:bg-white/[0.06] dark:text-white/70`}
        />
      </label>

      <p className="text-sm text-black/55 dark:text-white/55">{t("acct.memberSince", { date: memberSince })}</p>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === "saving" || unchanged}
          className="rounded-xl bg-brand-600 px-5 py-3 text-base font-semibold text-white transition-opacity active:opacity-80 disabled:opacity-40"
        >
          {t("acct.save")}
        </button>
        <span role="status" className="text-sm font-semibold">
          {status === "saved" && <span className="text-emerald-600 dark:text-emerald-400">{t("acct.saved")}</span>}
          {status === "error" && <span className="text-red-600 dark:text-red-400">{t("acct.saveError")}</span>}
          {status === "tooLong" && <span className="text-red-600 dark:text-red-400">{t("acct.nameTooLong")}</span>}
        </span>
      </div>
    </form>
  );
}
