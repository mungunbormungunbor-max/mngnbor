"use client";

import { useEffect } from "react";
import { applyTheme, loadThemeMode } from "./theme";

/** Invisible. Keeps the page in step with the phone when the mode is "System" (e.g. auto dark at night). */
export function ThemeSync() {
  useEffect(() => {
    applyTheme(loadThemeMode());
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (loadThemeMode() === "system") applyTheme("system");
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return null;
}
