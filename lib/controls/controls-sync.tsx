"use client";

import { useEffect } from "react";
import { applyControls, loadControls } from "./controls";

/** Invisible. Applies the saved controls on load (the head script already did, this is the safety net). */
export function ControlsSync() {
  useEffect(() => {
    applyControls(loadControls());
  }, []);
  return null;
}
