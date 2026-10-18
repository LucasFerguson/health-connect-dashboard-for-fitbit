/**
 * Viewport helpers for the daily history charts on the metric and sleep
 * detail pages. On a phone, years of daily bars squeezed into ~300px are
 * unreadable, so those charts open on the most recent stretch and keep the
 * full history reachable through the chart's range control.
 */

/** Below this width (Tailwind's `sm`) the charts use the phone layout. */
export const NARROW_CHART_QUERY = "(max-width: 639px)";

/** Days a daily chart shows on first render on a phone. */
export const NARROW_CHART_WINDOW_DAYS = 90;

/**
 * The `dataZoom` window that shows the last `windowDays` calendar days of a
 * category axis of ascending ISO dates (gaps allowed), or the full range when
 * not narrow or the series is already that short. Indices into `dates`.
 */
export function dailyChartWindow(
  dates: readonly string[],
  narrow: boolean,
  windowDays: number = NARROW_CHART_WINDOW_DAYS,
): { startValue: number; endValue: number } | null {
  if (!narrow || dates.length === 0) return null;
  const last = Date.parse(`${dates.at(-1)}T00:00:00Z`);
  if (Number.isNaN(last)) return null;
  const firstShown = last - (windowDays - 1) * 86_400_000;
  const startValue = dates.findIndex(
    (date) => Date.parse(`${date}T00:00:00Z`) >= firstShown,
  );
  if (startValue <= 0) return null;
  return { startValue, endValue: dates.length - 1 };
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** "2026-10-18" → "Oct 18"; a compact axis tick for narrow charts. Anything
 * that isn't an ISO date is returned unchanged. */
export function shortDateLabel(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  const month = MONTHS[Number(match[2]) - 1];
  return month ? `${month} ${Number(match[3])}` : value;
}

/** "2026-10" → "Oct ’26"; a compact monthly axis tick. */
export function shortMonthLabel(value: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return value;
  const month = MONTHS[Number(match[2]) - 1];
  return month ? `${month} ’${match[1]!.slice(2)}` : value;
}
