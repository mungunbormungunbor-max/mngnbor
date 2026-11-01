/*
 * Light / dark mode. The choice ("light" | "dark" | "system") is kept in localStorage and applied as a
 * `dark` class on <html>. THEME_INIT_SCRIPT runs before first paint so the page never flashes the wrong theme.
 */

export const THEME_MODES = ["light", "dark", "system"] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

export const THEME_STORAGE_KEY = "daily-plan:theme";
export const THEME_COLORS = { light: "#f8f7ff", dark: "#0e0b1f" } as const;

export function isThemeMode(value: unknown): value is ThemeMode {
  return typeof value === "string" && (THEME_MODES as readonly string[]).includes(value);
}

export function loadThemeMode(): ThemeMode {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(stored) ? stored : "system";
  } catch {
    return "system";
  }
}

export function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode !== "system") return mode;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/** Sets the `dark` class and the browser's address-bar colour to match `mode`. */
export function applyTheme(mode: ThemeMode): void {
  const resolved = resolveTheme(mode);
  document.documentElement.classList.toggle("dark", resolved === "dark");

  // An explicit choice overrides the media-query <meta theme-color> tags; "system" removes the override.
  document.querySelector('meta[name="theme-color"][data-override]')?.remove();
  if (mode !== "system") {
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.content = THEME_COLORS[resolved];
    meta.setAttribute("data-override", "");
    document.head.prepend(meta);
  }
}

export function saveThemeMode(mode: ThemeMode): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // Private mode: the choice still applies until the page closes.
  }
  applyTheme(mode);
}

/** Inline, dependency-free copy of the "which theme?" logic for <head>. Keep in sync with applyTheme. */
export const THEME_INIT_SCRIPT = `(function(){try{var m=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});var d=m==="dark"||((m!=="light")&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark")}catch(e){}})();`;
