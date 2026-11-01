export type NotificationsSupport = "supported" | "unsupported";

export function getNotificationsSupport(): NotificationsSupport {
  return typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator
    ? "supported"
    : "unsupported";
}

export function registerNotificationsWorker(): void {
  if (getNotificationsSupport() === "unsupported") return;
  navigator.serviceWorker.register("/sw.js").catch(() => {
    // Notifications simply stay unavailable if the worker can't register.
  });
}

/**
 * Shows a system notification through the service worker (the only way that works on Android).
 * `tag` makes a repeat of the same reminder replace the earlier one instead of stacking.
 */
export async function showNotificationsMessage(title: string, body: string, tag: string): Promise<boolean> {
  if (getNotificationsSupport() === "unsupported" || Notification.permission !== "granted") return false;
  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      body,
      tag,
      icon: "/apple-icon",
      // `vibrate` is supported by Android browsers but missing from the TypeScript DOM types.
      ...({ vibrate: [200, 100, 200] } as object),
      data: { url: "/today-view" },
    });
    return true;
  } catch {
    return false;
  }
}
