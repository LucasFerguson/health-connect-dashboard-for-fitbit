/**
 * Pairing and summary statistics for the `/explore` correlation view.
 *
 * This is presentation math over values HCGateway has already prepared: it
 * lines two daily series up by date and describes how they move together. It
 * never derives or fills in a health metric. A day missing from either series
 * is left out of the pairs, never treated as zero.
 */
import type { DateKey } from "./health";

export interface DailyValue {
  date: DateKey;
  value: number;
}

/** One day's x paired with the y it is compared against. `yDate` differs
 * from `date` only when a lag is applied. */
export interface Pair {
  date: DateKey;
  yDate: DateKey;
  x: number;
  y: number;
}

const DAY_MS = 86_400_000;

/** `date` moved by `days` calendar days (UTC arithmetic on a date key, so no
 * DST edge can skip or repeat a day). */
export function shiftDate(date: DateKey, days: number): DateKey {
  const time = Date.parse(`${date}T00:00:00Z`) + days * DAY_MS;
  return new Date(time).toISOString().slice(0, 10);
}

/** Series as a date → value map, keeping only finite values. */
export function indexByDate(series: readonly DailyValue[]) {
  const byDate = new Map<DateKey, number>();
  for (const point of series) {
    if (Number.isFinite(point.value)) byDate.set(point.date, point.value);
  }
  return byDate;
}

/**
 * Pairs x on day `d` with y on day `d + lag`, keeping only days where both
 * exist. `lag = 1` asks "does today's x relate to tomorrow's y?".
 *
 * `window`, when given, bounds the **x** dates (inclusive); the paired y may
 * fall just outside it, which is why callers fetch a few days of padding.
 */
export function pairSeries(
  x: readonly DailyValue[],
  y: readonly DailyValue[],
  lag = 0,
  window?: { from: DateKey | null; to: DateKey | null },
): Pair[] {
  const yByDate = indexByDate(y);
  const pairs: Pair[] = [];
  for (const [date, xValue] of indexByDate(x)) {
    if (window?.from && date < window.from) continue;
    if (window?.to && date > window.to) continue;
    const yDate = shiftDate(date, lag);
    const yValue = yByDate.get(yDate);
    if (yValue === undefined) continue;
    pairs.push({ date, yDate, x: xValue, y: yValue });
  }
  return pairs.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/** The minimum sample for any statistic here. Two points always fit a line
 * perfectly (r = ±1), which says nothing. */
export const MIN_PAIRS = 3;

function mean(values: readonly number[]) {
  let sum = 0;
  for (const value of values) sum += value;
  return sum / values.length;
}

/** Pearson's r, or `null` when n < 3 or either side has no variance. */
export function pearson(xs: readonly number[], ys: readonly number[]) {
  const n = Math.min(xs.length, ys.length);
  if (n < MIN_PAIRS) return null;
  const mx = mean(xs.slice(0, n));
  const my = mean(ys.slice(0, n));
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i]! - mx;
    const dy = ys[i]! - my;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  if (sxx === 0 || syy === 0) return null;
  // Clamp float noise so a perfect fit reads exactly ±1.
  return Math.max(-1, Math.min(1, sxy / Math.sqrt(sxx * syy)));
}

/** 1-based ranks, ties sharing their average rank. */
export function rank(values: readonly number[]): number[] {
  const order = values
    .map((value, index) => ({ value, index }))
    .sort((a, b) => a.value - b.value);
  const ranks = new Array<number>(values.length);
  let i = 0;
  while (i < order.length) {
    let j = i;
    while (j + 1 < order.length && order[j + 1]!.value === order[i]!.value) j++;
    const averageRank = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) ranks[order[k]!.index] = averageRank;
    i = j + 1;
  }
  return ranks;
}

/** Spearman's ρ (Pearson on ranks, so ties are handled), or `null` when
 * n < 3 or either side is constant. */
export function spearman(xs: readonly number[], ys: readonly number[]) {
  const n = Math.min(xs.length, ys.length);
  if (n < MIN_PAIRS) return null;
  return pearson(rank(xs.slice(0, n)), rank(ys.slice(0, n)));
}

export interface Regression {
  slope: number;
  intercept: number;
  /** Coefficient of determination, r². */
  rSquared: number;
}

/** Ordinary least-squares fit y = intercept + slope·x, or `null` when n < 3
 * or x is constant. */
export function linearRegression(
  xs: readonly number[],
  ys: readonly number[],
): Regression | null {
  const n = Math.min(xs.length, ys.length);
  if (n < MIN_PAIRS) return null;
  const mx = mean(xs.slice(0, n));
  const my = mean(ys.slice(0, n));
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i]! - mx;
    const dy = ys[i]! - my;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  if (sxx === 0) return null;
  const slope = sxy / sxx;
  const rSquared = syy === 0 ? 0 : (sxy * sxy) / (sxx * syy);
  return { slope, intercept: my - slope * mx, rSquared };
}

/**
 * Approximate 95% confidence interval for Pearson's r, by Fisher's z
 * transform. `null` when n < 4 (the transform needs n − 3 > 0) or r is ±1.
 */
export function pearsonInterval(r: number | null, n: number) {
  if (r === null || n < 4 || Math.abs(r) >= 1) return null;
  const z = Math.atanh(r);
  const margin = 1.959964 / Math.sqrt(n - 3);
  return { low: Math.tanh(z - margin), high: Math.tanh(z + margin) };
}

export type Strength =
  | "negligible"
  | "weak"
  | "moderate"
  | "strong"
  | "very strong";

/** Conventional |r| bands: < 0.1 negligible, < 0.3 weak, < 0.5 moderate,
 * < 0.7 strong, otherwise very strong. */
export function correlationStrength(r: number): Strength {
  const magnitude = Math.abs(r);
  if (magnitude < 0.1) return "negligible";
  if (magnitude < 0.3) return "weak";
  if (magnitude < 0.5) return "moderate";
  if (magnitude < 0.7) return "strong";
  return "very strong";
}

/** "weak positive", "strong negative", "no correlation"; `null` in, `null`
 * out. */
export function describeCorrelation(r: number | null): string | null {
  if (r === null) return null;
  const strength = correlationStrength(r);
  if (strength === "negligible") return "no clear correlation";
  return `${strength} ${r > 0 ? "positive" : "negative"}`;
}

export interface CorrelationSummary {
  n: number;
  pearson: number | null;
  pearsonInterval: { low: number; high: number } | null;
  spearman: number | null;
  regression: Regression | null;
  /** Plain-language reading of Pearson's r. */
  description: string | null;
  /** The x range the trend line should be drawn across. */
  xExtent: { min: number; max: number } | null;
}

export function summarizePairs(pairs: readonly Pair[]): CorrelationSummary {
  const xs = pairs.map((pair) => pair.x);
  const ys = pairs.map((pair) => pair.y);
  const r = pearson(xs, ys);
  return {
    n: pairs.length,
    pearson: r,
    pearsonInterval: pearsonInterval(r, pairs.length),
    spearman: spearman(xs, ys),
    regression: linearRegression(xs, ys),
    description: describeCorrelation(r),
    xExtent: xs.length ? { min: Math.min(...xs), max: Math.max(...xs) } : null,
  };
}

// ---------------------------------------------------------------------------
// Binary (habit) axes

/**
 * Below this many days in either group, a group mean is one unusual day away
 * from a different answer, and the UI says so loudly.
 */
export const MIN_GROUP = 5;

/** Linear-interpolated quantile of an ascending list (the "type 7"
 * definition spreadsheets use). */
export function quantile(sorted: readonly number[], p: number): number {
  if (sorted.length === 0) return Number.NaN;
  const position = (sorted.length - 1) * p;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  const low = sorted[lower]!;
  return low + (sorted[upper]! - low) * (position - lower);
}

export interface GroupStats {
  n: number;
  mean: number;
  median: number;
  q1: number;
  q3: number;
  min: number;
  max: number;
}

function groupStats(values: readonly number[]): GroupStats | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return {
    n: sorted.length,
    mean: mean(sorted),
    median: quantile(sorted, 0.5),
    q1: quantile(sorted, 0.25),
    q3: quantile(sorted, 0.75),
    min: sorted[0]!,
    max: sorted.at(-1)!,
  };
}

export interface GroupComparison {
  /** The other metric on days the habit was answered yes / no. */
  yes: GroupStats | null;
  no: GroupStats | null;
  /** yes − no, in the other metric's units; null unless both groups exist. */
  meanDifference: number | null;
  medianDifference: number | null;
}

/**
 * Splits paired days by a 0/1 habit on `habitAxis` and summarises the
 * *other* axis in each group: "sleep on caffeine days vs. sleep on
 * no-caffeine days". The pairs already carry the lag, so this compares
 * exactly what the scatter would plot.
 */
export function compareGroups(
  pairs: readonly Pair[],
  habitAxis: "x" | "y",
): GroupComparison {
  const yes: number[] = [];
  const no: number[] = [];
  for (const pair of pairs) {
    const [answer, other] =
      habitAxis === "x" ? [pair.x, pair.y] : [pair.y, pair.x];
    if (answer === 1) yes.push(other);
    else if (answer === 0) no.push(other);
  }
  const yesStats = groupStats(yes);
  const noStats = groupStats(no);
  return {
    yes: yesStats,
    no: noStats,
    meanDifference: yesStats && noStats ? yesStats.mean - noStats.mean : null,
    medianDifference:
      yesStats && noStats ? yesStats.median - noStats.median : null,
  };
}

export interface CrossTab {
  /** Keyed x answer then y answer: `yesNo` is x yes, y no. */
  yesYes: number;
  yesNo: number;
  noYes: number;
  noNo: number;
  n: number;
}

/** 2×2 counts for two 0/1 series already paired (with any lag). */
export function crossTabulate(pairs: readonly Pair[]): CrossTab {
  const table: CrossTab = { yesYes: 0, yesNo: 0, noYes: 0, noNo: 0, n: 0 };
  for (const { x, y } of pairs) {
    if ((x !== 0 && x !== 1) || (y !== 0 && y !== 1)) continue;
    table.n += 1;
    if (x === 1 && y === 1) table.yesYes += 1;
    else if (x === 1) table.yesNo += 1;
    else if (y === 1) table.noYes += 1;
    else table.noNo += 1;
  }
  return table;
}
