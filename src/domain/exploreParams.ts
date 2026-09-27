/**
 * The `/explore` selection (axes, mode, lag, range) and its URL form, so a
 * view can be bookmarked and shared. Parsing is forgiving: an unknown or
 * malformed parameter falls back to its default rather than erroring.
 */
import { isMetricId, type MetricId } from "./exploreMetrics";

export const EXPLORE_MODES = ["scatter", "line"] as const;
export type ExploreMode = (typeof EXPLORE_MODES)[number];

export const EXPLORE_RANGES = [
  { key: "30", label: "30D", days: 30 },
  { key: "90", label: "90D", days: 90 },
  { key: "365", label: "1Y", days: 365 },
  { key: "all", label: "ALL", days: null },
] as const;
export type ExploreRange = (typeof EXPLORE_RANGES)[number]["key"];

/** Largest lag, in days, either way. */
export const MAX_LAG = 7;

export interface ExploreSelection {
  x: MetricId;
  y: MetricId;
  mode: ExploreMode;
  /** Y is read `lag` days after X (negative: before). */
  lag: number;
  range: ExploreRange;
}

export const DEFAULT_SELECTION: ExploreSelection = {
  x: "steps",
  y: "sleepDuration",
  mode: "scatter",
  lag: 0,
  range: "90",
};

type RawParams =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

function read(params: RawParams, key: string): string | undefined {
  if (params instanceof URLSearchParams) return params.get(key) ?? undefined;
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export function rangeDays(range: ExploreRange): number | null {
  return EXPLORE_RANGES.find((option) => option.key === range)?.days ?? null;
}

export function parseExploreParams(params: RawParams): ExploreSelection {
  const x = read(params, "x");
  const y = read(params, "y");
  const mode = read(params, "mode");
  const range = read(params, "range");
  const lagText = read(params, "lag");
  const lag =
    lagText !== undefined && /^[+-]?\d+$/.test(lagText)
      ? Number(lagText)
      : DEFAULT_SELECTION.lag;
  return {
    x: isMetricId(x) ? x : DEFAULT_SELECTION.x,
    y: isMetricId(y) ? y : DEFAULT_SELECTION.y,
    mode: EXPLORE_MODES.includes(mode as ExploreMode)
      ? (mode as ExploreMode)
      : DEFAULT_SELECTION.mode,
    lag: Math.max(-MAX_LAG, Math.min(MAX_LAG, lag)),
    range: EXPLORE_RANGES.some((option) => option.key === range)
      ? (range as ExploreRange)
      : DEFAULT_SELECTION.range,
  };
}

/** The selection as a query string (no leading "?"). Every key is written,
 * so a shared link keeps meaning the same thing if defaults change. */
export function exploreSearch(selection: ExploreSelection): string {
  return new URLSearchParams({
    x: selection.x,
    y: selection.y,
    mode: selection.mode,
    lag: String(selection.lag),
    range: selection.range,
  }).toString();
}
