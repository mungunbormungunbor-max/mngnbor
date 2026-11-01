"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { LANGUAGE_COOKIE, MESSAGES, getLocale, type Language, type MessageKey } from "./messages";

type Params = Record<string, string | number>;

type I18n = {
  lang: Language;
  /** Locale for toLocaleDateString / toLocaleTimeString (undefined = the phone's own). */
  locale: string | undefined;
  setLang: (lang: Language) => void;
  t: (key: MessageKey, params?: Params) => string;
};

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ initialLang, children }: { initialLang: Language; children: ReactNode }) {
  const router = useRouter();
  const [lang, setLangState] = useState<Language>(initialLang);

  const setLang = useCallback(
    (next: Language) => {
      setLangState(next);
      document.cookie = `${LANGUAGE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
      document.documentElement.lang = next;
      // Re-render server parts (page titles) in the new language.
      router.refresh();
    },
    [router],
  );

  const value = useMemo<I18n>(() => {
    const messages = MESSAGES[lang];
    return {
      lang,
      locale: getLocale(lang),
      setLang,
      t: (key, params) =>
        messages[key].replace(/\{(\w+)\}/g, (match, name: string) =>
          params && name in params ? String(params[name]) : match,
        ),
    };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
