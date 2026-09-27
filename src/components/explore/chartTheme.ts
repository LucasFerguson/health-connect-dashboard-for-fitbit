import type { MetricDefinition } from "~/domain/exploreMetrics";

/**
 * Shared ECharts styling for the `/explore` charts, in Meridian ink tokens.
 * ECharts draws on canvas, so the hex values are repeated from
 * `globals.css` rather than read from CSS variables.
 */
export const EXPLORE_COLORS = {
  /** X series (line mode) — `--color-sleep`. */
  x: "#6e9cff",
  /** Y series (line mode) — `--color-strain`. */
  y: "#f59a3e",
  /** Scatter points — `--color-brand-400`. */
  point: "#a97bff",
  /** Regression line — `--color-ink-0`. */
  trend: "#efecf5",
  axisText: "#9a93ab",
  axisLine: "#302842",
  grid: "rgba(239, 236, 245, 0.06)",
  tooltipSurface: "#15121c",
  tooltipBorder: "#302842",
  tooltipText: "#efecf5",
  tooltipDim: "#9a93ab",
} as const;

export const CHART_FONT =
  'ui-monospace, "JetBrains Mono", "SFMono-Regular", Menlo, monospace';

export const tooltipBase = {
  backgroundColor: EXPLORE_COLORS.tooltipSurface,
  borderColor: EXPLORE_COLORS.tooltipBorder,
  borderWidth: 1,
  padding: [8, 10],
  textStyle: {
    color: EXPLORE_COLORS.tooltipText,
    fontFamily: CHART_FONT,
    fontSize: 11,
  },
  confine: true,
};

export function axisStyle(nameColor: string = EXPLORE_COLORS.axisText) {
  return {
    nameTextStyle: { color: nameColor, fontFamily: CHART_FONT, fontSize: 10 },
    axisLabel: {
      color: EXPLORE_COLORS.axisText,
      fontFamily: CHART_FONT,
      fontSize: 10,
      hideOverlap: true,
    },
    axisLine: { lineStyle: { color: EXPLORE_COLORS.axisLine } },
    axisTick: { lineStyle: { color: EXPLORE_COLORS.axisLine } },
    splitLine: { lineStyle: { color: EXPLORE_COLORS.grid } },
  };
}

/** Escapes text for ECharts' HTML tooltips. Labels here are all from the
 * catalog, but dates and formatted values pass through too. */
export function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const dateFormat = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** "Tue, Sep 22, 2026" for a date key. */
export function formatDateKey(date: string) {
  return dateFormat.format(new Date(`${date}T00:00:00Z`));
}

const MINUTE_INTERVALS = [15, 30, 60, 120, 180, 240, 360, 720, 1440];

/**
 * Axis bounds for minute-valued metrics (durations, clock times), so ticks
 * land on whole hours or half hours instead of ECharts' base-10 steps
 * (which gave "8.3h" and "4:40 PM"). Number metrics get `{}`: ECharts'
 * own nice-number ticks are right for them.
 */
export function minuteAxisBounds(
  metric: MetricDefinition,
  values: readonly (number | null)[],
): { min?: number; max?: number; interval?: number } {
  if (metric.kind !== "duration" && metric.kind !== "clock") return {};
  let min = Infinity;
  let max = -Infinity;
  for (const value of values) {
    if (value === null) continue;
    if (value < min) min = value;
    if (value > max) max = value;
  }
  if (!Number.isFinite(min)) return {};
  const target = Math.max(max - min, 1) / 5;
  const interval =
    MINUTE_INTERVALS.find((step) => step >= target) ?? MINUTE_INTERVALS.at(-1)!;
  return {
    interval,
    min: Math.floor(min / interval) * interval,
    max: Math.max(
      Math.ceil(max / interval) * interval,
      Math.floor(min / interval) * interval + interval,
    ),
  };
}
