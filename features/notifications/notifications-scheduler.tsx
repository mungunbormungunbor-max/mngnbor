"use client";

import { useEffect } from "react";
import { formatNotificationsTime } from "./notifications-format";
import {
  NOTIFICATIONS_PREFS_EVENT,
  getDueNotifications,
  loadNotificationsFired,
  loadNotificationsItems,
  loadNotificationsPrefs,
  markNotificationsFired,
  pruneNotificationsFired,
  toNotificationsDateKey,
} from "./notifications-data";
import { getNotificationsSupport, registerNotificationsWorker, showNotificationsMessage } from "./notifications-show";
import { useI18n } from "@/lib/i18n/provider";

const CHECK_EVERY_MS = 20_000;

/**
 * Invisible. While the app is open (or kept alive in the background by the phone) it checks every
 * few seconds for plan items that are due and shows a notification for each one, once.
 */
export function NotificationsScheduler() {
  const { t, locale } = useI18n();

  useEffect(() => {
    registerNotificationsWorker();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (getNotificationsSupport() === "unsupported" || Notification.permission !== "granted") return;
      const prefs = loadNotificationsPrefs();
      if (!prefs.enabled) return;

      const now = new Date();
      const dateKey = toNotificationsDateKey(now);
      pruneNotificationsFired(dateKey);
      const due = getDueNotifications(loadNotificationsItems(dateKey), now, prefs.lead, loadNotificationsFired(dateKey));

      for (const { item, minutesUntil } of due) {
        if (cancelled) return;
        // Mark first so a slow check can't send the same reminder twice.
        markNotificationsFired(dateKey, item, prefs.lead);
        const time = formatNotificationsTime(item.startTime!, locale);
        const body = minutesUntil === 0 ? t("notif.bodyNow", { time }) : t("notif.bodySoon", { n: minutesUntil, time });
        await showNotificationsMessage(item.title, body, `${dateKey}:${item.id}`);
      }
    }

    void check();
    const timer = window.setInterval(check, CHECK_EVERY_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void check();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener(NOTIFICATIONS_PREFS_EVENT, check);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(NOTIFICATIONS_PREFS_EVENT, check);
    };
  }, [t, locale]);

  return null;
}
