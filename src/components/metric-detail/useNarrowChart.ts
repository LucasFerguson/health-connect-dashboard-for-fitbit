"use client";

import { useSyncExternalStore } from "react";
import { NARROW_CHART_QUERY } from "~/domain/metricChartWindow";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(NARROW_CHART_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** True on phone-width screens; false during SSR (charts render client-side
 * only, so there is no visible flash). */
export function useNarrowChart(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(NARROW_CHART_QUERY).matches,
    () => false,
  );
}
