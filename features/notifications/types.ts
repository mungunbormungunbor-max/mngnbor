/** Minutes before an item's time that the reminder fires (0 = right on time). */
export type NotificationsLead = 0 | 5 | 10 | 30;

export type NotificationsPrefs = {
  enabled: boolean;
  lead: NotificationsLead;
};

/** The part of a plan item a reminder needs. Mirrors the shared `plan_items` shape. */
export type NotificationsItem = {
  id: string;
  title: string;
  /** "HH:MM" (24h) or null. */
  startTime: string | null;
  isDone: boolean;
};
