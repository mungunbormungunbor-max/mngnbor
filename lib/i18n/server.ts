import { cookies } from "next/headers";
import { DEFAULT_LANGUAGE, LANGUAGE_COOKIE, MESSAGES, isLanguage, type Language, type MessageKey } from "./messages";

/** The visitor's chosen language, read from the cookie on the server. */
export async function getServerLanguage(): Promise<Language> {
  const value = (await cookies()).get(LANGUAGE_COOKIE)?.value;
  return isLanguage(value) ? value : DEFAULT_LANGUAGE;
}

/** Translate a plain message on the server (e.g. page titles). */
export async function getServerMessage(key: MessageKey): Promise<string> {
  return MESSAGES[await getServerLanguage()][key];
}
