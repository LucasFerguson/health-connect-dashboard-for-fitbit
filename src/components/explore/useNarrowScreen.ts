"use client";

import { useEffect, useState } from "react";

/** Below Tailwind's `sm` breakpoint (a phone held upright). */
const NARROW_QUERY = "(max-width: 639px)";

/**
 * Whether the viewport is phone-width, for chart options that can't be
 * expressed in CSS (ECharts draws on canvas). `false` on the server and
 * the first client render, so hydration matches; it updates on mount and
 * whenever the viewport crosses the breakpoint.
 */
export function useNarrowScreen(): boolean {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const query = window.matchMedia(NARROW_QUERY);
    const update = () => setNarrow(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return narrow;
}
