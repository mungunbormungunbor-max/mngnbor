/*
 * All user-facing text for the app, in English and Mongolian.
 * Add new text here (both languages), then read it with `useI18n().t("key")`.
 * `{name}` placeholders are filled in by `t("key", { name: value })`.
 */

export const LANGUAGES = ["en", "mn"] as const;
export type Language = (typeof LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = "en";
export const LANGUAGE_COOKIE = "daily-plan-lang";

export function isLanguage(value: unknown): value is Language {
  return typeof value === "string" && (LANGUAGES as readonly string[]).includes(value);
}

const en = {
  "app.name": "Daily Plan",
  "menu.open": "Menu",
  "menu.language": "Language",

  "auth.login.title": "Log in",
  "auth.login.button": "Log in",
  "auth.login.alt": "No account yet?",
  "auth.login.altLink": "Sign up",
  "auth.signup.title": "Create account",
  "auth.signup.button": "Sign up",
  "auth.signup.alt": "Already have an account?",
  "auth.signup.altLink": "Log in",
  "auth.email": "Email",
  "auth.password": "Password",
  "auth.pending": "Please wait…",
  "auth.notConfigured": "Supabase is not connected yet. Add your keys to .env.local.",
  "auth.checkEmail": "Check your email to confirm your account, then log in.",

  "today.title": "Today",
  "today.tabTitle": "Today · Daily Plan",
  "greeting.night": "Good night",
  "greeting.morning": "Good morning",
  "greeting.afternoon": "Good afternoon",
  "greeting.evening": "Good evening",
  "today.edit": "Edit",
  "today.now": "Now: ",
  "today.next": "Next: ",
  "today.happeningNow": "happening now",
  "today.inMin": "in {m} min",
  "today.inHours": "in {h} h",
  "today.inHoursMin": "in {h} h {m} min",
  "today.streak": "{n}-day streak",
  "today.streakHint": "Days in a row with everything done",
  "today.pointsLabel": "Streak points",
  "today.pts": "pts",
  "today.bonusEarned": "Streak bonus earned: +{n}",
  "today.bonusHint": "Finish everything today for +{n} streak bonus",
  "today.toNextRank": "{n} to next rank",
  "today.gainBonus": "streak bonus +{n}",
  "today.allDone": "Everything done 🎉",
  "today.progress": "{done} of {total} done",
  "today.hideDone": "Hide done",
  "today.showDone": "Show done ({n})",
  "today.progressLabel": "Today's progress",
  "today.allHidden": "All done and hidden. Nice work!",
  "today.swipeTip": "Tip: swipe an item right to complete it",
  "rank.starter": "Starter",
  "rank.planner": "Planner",
  "rank.achiever": "Achiever",
  "rank.pro": "Pro",
  "rank.legend": "Legend",
  "celebration.0": "All done for today! 🎉",
  "celebration.1": "Clean sweep! ✨",
  "celebration.2": "Nailed it! 🙌",
  "celebration.3": "Day conquered! 🏆",
  "celebration.4": "Nothing left. Enjoy! 🌈",
  "today.empty.title": "Nothing planned today",
  "today.empty.text": "Enjoy the free day, or add a few things to do.",
  "today.empty.button": "Plan my day",
  "today.badge.now": "Now",
  "today.badge.next": "Next",
  "today.swipeUndo": "↺ Undo",
  "today.swipeDone": "✓ Done",
  "today.timePassed": "Time has passed",
  "today.weekLabel": "Days of the week",
  "today.prevWeek": "Previous week",
  "today.nextWeek": "Next week",
  "today.backToToday": "Back to today",
  "today.emptyDay": "Nothing planned this day",
  "today.planThisDay": "Plan this day",
} as const;

export type MessageKey = keyof typeof en;

const mn: Record<MessageKey, string> = {
  "app.name": "Өдрийн төлөвлөгөө",
  "menu.open": "Цэс",
  "menu.language": "Хэл",

  "auth.login.title": "Нэвтрэх",
  "auth.login.button": "Нэвтрэх",
  "auth.login.alt": "Бүртгэлгүй юу?",
  "auth.login.altLink": "Бүртгүүлэх",
  "auth.signup.title": "Бүртгэл үүсгэх",
  "auth.signup.button": "Бүртгүүлэх",
  "auth.signup.alt": "Бүртгэлтэй юу?",
  "auth.signup.altLink": "Нэвтрэх",
  "auth.email": "И-мэйл",
  "auth.password": "Нууц үг",
  "auth.pending": "Түр хүлээнэ үү…",
  "auth.notConfigured": "Supabase хараахан холбогдоогүй байна. Түлхүүрүүдээ .env.local файлд нэмнэ үү.",
  "auth.checkEmail": "Бүртгэлээ баталгаажуулахын тулд и-мэйлээ шалгаад, дараа нь нэвтэрнэ үү.",

  "today.title": "Өнөөдөр",
  "today.tabTitle": "Өнөөдөр · Өдрийн төлөвлөгөө",
  "greeting.night": "Сайхан амраарай",
  "greeting.morning": "Өглөөний мэнд",
  "greeting.afternoon": "Өдрийн мэнд",
  "greeting.evening": "Оройн мэнд",
  "today.edit": "Засах",
  "today.now": "Одоо: ",
  "today.next": "Дараа: ",
  "today.happeningNow": "яг одоо",
  "today.inMin": "{m} минутын дараа",
  "today.inHours": "{h} цагийн дараа",
  "today.inHoursMin": "{h} цаг {m} минутын дараа",
  "today.streak": "{n} өдрийн цуваа",
  "today.streakHint": "Бүх зүйлээ дуусгасан дараалсан өдрүүд",
  "today.pointsLabel": "Цувааны оноо",
  "today.pts": "оноо",
  "today.bonusEarned": "Цувааны урамшуулал авлаа: +{n}",
  "today.bonusHint": "Өнөөдөр бүгдийг дуусгавал +{n} цувааны урамшуулал",
  "today.toNextRank": "Дараагийн зэрэг хүртэл {n}",
  "today.gainBonus": "цувааны урамшуулал +{n}",
  "today.allDone": "Бүгд дууслаа 🎉",
  "today.progress": "{total}-аас {done} дууссан",
  "today.hideDone": "Дууссаныг нуух",
  "today.showDone": "Дууссаныг харуулах ({n})",
  "today.progressLabel": "Өнөөдрийн явц",
  "today.allHidden": "Бүгд дууссан бөгөөд нуугдсан. Сайн ажиллалаа!",
  "today.swipeTip": "Зөвлөгөө: зүйлийг баруун тийш шударвал дуусна",
  "rank.starter": "Эхлэгч",
  "rank.planner": "Төлөвлөгч",
  "rank.achiever": "Амжилттан",
  "rank.pro": "Мэргэжилтэн",
  "rank.legend": "Домог",
  "celebration.0": "Өнөөдрийн бүх ажил дууслаа! 🎉",
  "celebration.1": "Цэвэрхэн дууслаа! ✨",
  "celebration.2": "Мундаг! 🙌",
  "celebration.3": "Өдрийг байлдан дагууллаа! 🏆",
  "celebration.4": "Юу ч үлдсэнгүй. Амраарай! 🌈",
  "today.empty.title": "Өнөөдөр төлөвлөгөөгүй",
  "today.empty.text": "Чөлөөт өдрөө тайвнаар өнгөрүүл, эсвэл хийх зүйлсээ нэм.",
  "today.empty.button": "Өдрөө төлөвлөх",
  "today.badge.now": "Одоо",
  "today.badge.next": "Дараа",
  "today.swipeUndo": "↺ Буцаах",
  "today.swipeDone": "✓ Дууслаа",
  "today.timePassed": "Цаг өнгөрсөн",
  "today.weekLabel": "Долоо хоногийн өдрүүд",
  "today.prevWeek": "Өмнөх долоо хоног",
  "today.nextWeek": "Дараагийн долоо хоног",
  "today.backToToday": "Өнөөдөр рүү буцах",
  "today.emptyDay": "Энэ өдөр төлөвлөгөөгүй",
  "today.planThisDay": "Энэ өдрийг төлөвлөх",
};

export const MESSAGES: Record<Language, Record<MessageKey, string>> = { en, mn };

/** Language names are always shown in their own language. */
export const LANGUAGE_NAMES: Record<Language, string> = { en: "English", mn: "Монгол" };

/** Locale for dates and times. English keeps the phone's own locale. */
export function getLocale(lang: Language): string | undefined {
  return lang === "mn" ? "mn-MN" : undefined;
}
