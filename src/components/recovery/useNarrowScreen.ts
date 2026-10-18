"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(max-width: 639px)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/**
 * True below Tailwind's `sm` breakpoint (phones). Server render and the
 * first client render report false, so desktop markup is the baseline and
 * phones adjust right after hydration.
 */
export function useNarrowScreen(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
