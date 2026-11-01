/*
 * Device controls from the ☰ menu: text size, vibration feedback, animations.
 * They belong to the phone (like the theme), not to an account, so they are not user-scoped.
 * Text size and animations are applied as data attributes on <html> (see globals.css);
 * CONTROLS_INIT_SCRIPT sets them before first paint so the page never jumps.
 */

export const TEXT_SIZES = ["small", "default", "large"] as const;
export type TextSize = (typeof TEXT_SIZES)[number];

export type Controls = {
  textSize: TextSize;
  /** Vibration feedback on taps, saves and "all done". */
  haptics: boolean;
  /** Animations and transitions (confetti, slides, fades). */
  motion: boolean;
};

export const DEFAULT_CONTROLS: Controls = { textSize: "default", haptics: true, motion: true };

export const CONTROLS_STORAGE_KEY = "daily-plan:controls";
export const CONTROLS_EVENT = "daily-plan:controls-changed";

export function loadControls(): Controls {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(CONTROLS_STORAGE_KEY) ?? "{}");
    return {
      textSize: TEXT_SIZES.includes(parsed?.textSize) ? parsed.textSize : DEFAULT_CONTROLS.textSize,
      haptics: parsed?.haptics !== false,
      motion: parsed?.motion !== false,
    };
  } catch {
    return DEFAULT_CONTROLS;
  }
}

export function applyControls(controls: Controls): void {
  const root = document.documentElement;
  root.setAttribute("data-text-size", controls.textSize);
  root.setAttribute("data-motion", controls.motion ? "on" : "off");
}

export function saveControls(controls: Controls): void {
  try {
    window.localStorage.setItem(CONTROLS_STORAGE_KEY, JSON.stringify(controls));
  } catch {
    // Private mode: the change still applies until the page closes.
  }
  applyControls(controls);
  window.dispatchEvent(new Event(CONTROLS_EVENT));
}

/** Vibrates the phone, unless the user turned vibration feedback off. Does nothing where unsupported. */
export function haptic(pattern: number | number[]): void {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  if (!loadControls().haptics) return;
  navigator.vibrate(pattern);
}

/** Inline copy of the "apply saved controls" logic for <head>. Keep in sync with applyControls. */
export const CONTROLS_INIT_SCRIPT = `(function(){try{var c=JSON.parse(localStorage.getItem(${JSON.stringify(
  CONTROLS_STORAGE_KEY,
)})||"{}");var r=document.documentElement;r.setAttribute("data-text-size",["small","large"].indexOf(c.textSize)>-1?c.textSize:"default");r.setAttribute("data-motion",c.motion===false?"off":"on")}catch(e){}})();`;
