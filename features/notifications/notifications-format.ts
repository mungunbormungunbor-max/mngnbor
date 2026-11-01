/** "07:00" -> "7:00 AM" in the given locale (undefined = the phone's own). */
export function formatNotificationsTime(startTime: string, locale?: string): string {
  const [h, m] = startTime.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });
}
