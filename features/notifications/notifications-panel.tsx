"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/provider";
import {
  NOTIFICATIONS_LEADS,
  loadNotificationsPrefs,
  saveNotificationsPrefs,
} from "./notifications-data";
import { getNotificationsSupport, showNotificationsMessage } from "./notifications-show";
import type { NotificationsLead, NotificationsPrefs } from "./types";

const LEAD_LABELS = {
  0: "notif.lead0",
  5: "notif.lead5",
  10: "notif.lead10",
  30: "notif.lead30",
} as const;

/** Notification settings, shown inside the ☰ menu. Only mounted while the menu is open. */
export function NotificationsPanel() {
  const { t } = useI18n();
  const supported = getNotificationsSupport() === "supported";
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    supported ? Notification.permission : "denied",
  );
  const [prefs, setPrefs] = useState<NotificationsPrefs>(() => loadNotificationsPrefs());

  function update(next: NotificationsPrefs) {
    setPrefs(next);
    saveNotificationsPrefs(next);
  }

  async function toggle() {
    if (prefs.enabled) {
      update({ ...prefs, enabled: false });
      return;
    }
    // Must be asked from a tap, otherwise phones refuse to show the permission prompt.
    const result = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
    setPermission(result);
    if (result === "granted") update({ ...prefs, enabled: true });
  }

  const on = prefs.enabled && permission === "granted";

  return (
    <div className="border-t border-black/10 px-3 pt-3 pb-2 dark:border-white/15">
      <p className="pb-1 text-xs font-semibold tracking-wide text-black/50 uppercase dark:text-white/50">
        {t("notif.title")}
      </p>

      {!supported ? (
        <p className="text-sm text-black/60 dark:text-white/60">{t("notif.unsupported")}</p>
      ) : permission === "denied" ? (
        <p className="text-sm text-black/60 dark:text-white/60">{t("notif.denied")}</p>
      ) : (
        <>
          <button
            type="button"
            role="switch"
            aria-checked={on}
            onClick={toggle}
            className="flex w-full items-center justify-between gap-3 rounded-xl py-2 text-left text-base font-medium"
          >
            <span>{t("notif.toggle")}</span>
            <span
              aria-hidden
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? "bg-brand-600" : "bg-black/20 dark:bg-white/25"}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 size-6 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : ""}`}
              />
            </span>
          </button>

          {on && (
            <>
              <div role="radiogroup" aria-label={t("notif.when")} className="mt-1 flex flex-wrap gap-1.5">
                {NOTIFICATIONS_LEADS.map((lead: NotificationsLead) => (
                  <button
                    key={lead}
                    type="button"
                    role="radio"
                    aria-checked={prefs.lead === lead}
                    onClick={() => update({ ...prefs, lead })}
                    className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
                      prefs.lead === lead
                        ? "border-brand-600 bg-brand-600 text-white"
                        : "border-black/15 dark:border-white/20"
                    }`}
                  >
                    {t(LEAD_LABELS[lead])}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => void showNotificationsMessage(t("app.name"), t("notif.testBody"), "daily-plan:test")}
                className="mt-2 rounded-full border border-black/15 px-3 py-1.5 text-sm font-semibold active:bg-black/5 dark:border-white/20 dark:active:bg-white/10"
              >
                {t("notif.test")}
              </button>
            </>
          )}
          <p className="mt-2 text-xs text-black/50 dark:text-white/50">{t("notif.note")}</p>
        </>
      )}
    </div>
  );
}
