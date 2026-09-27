/**
 * Maps the `ExplorePage` query onto the `/explore` metric catalog: one
 * `{ date, value }` list per metric.
 *
 * Missing is absent, never zero. A day is dropped from a series when its
 * value is null, non-finite, or not trustworthy by the backend's own flag:
 *
 * - supporting metrics (respiratory rate, SpO₂, skin temperature, zone 3+)
 *   count only when their status is `AVAILABLE`. A `0` with that status is
 *   kept: zero minutes in zone 3 is a real reading.
 * - strain counts only when `quality.publishable`.
 * - recovery counts when `quality.publishable` and its status is `available`
 *   or `partial`. `partial` is accepted because the recovery model is still
 *   provisional: every published score (164 of 499 days on 2026-09-27) is
 *   `partial`, none `available`, and the day view already shows partial
 *   recovery as a real value. The picker note says it is provisional.
 */
import type { DailyPoint, ExploreSeries } from "~/domain/exploreMetrics";
import { shiftDate } from "~/domain/correlation";
import type { DateKey } from "~/domain/health";
import { MAX_LAG } from "~/domain/exploreParams";
import type {
  ExplorePageQuery,
  TimeRange,
} from "~/types/__generated__/graphql";

type Analytics = ExplorePageQuery["viewer"]["analytics"];

const MINUTES_PER_DAY = 1440;
const NOON = 720;

/**
 * Bedtime as minutes after the *evening's* midnight: 00:30 becomes 1470
 * (24:30) rather than 30, so bedtimes either side of midnight sit next to
 * each other and a later bedtime is always a larger number. Bedtimes from
 * noon to midnight are unchanged.
 */
export function unwrapBedtime(minutesLocal: number): number {
  return minutesLocal < NOON ? minutesLocal + MINUTES_PER_DAY : minutesLocal;
}

function collect<T extends { date: DateKey }>(
  rows: readonly T[],
  value: (row: T) => number | null | undefined,
): DailyPoint[] {
  const points: DailyPoint[] = [];
  for (const row of rows) {
    const v = value(row);
    if (v === null || v === undefined || !Number.isFinite(v)) continue;
    points.push({ date: row.date, value: v });
  }
  return points.sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
  );
}

type SupportingKey = keyof Analytics["days"][number]["supportingMetrics"];

function supporting(analytics: Analytics, key: SupportingKey) {
  return collect(analytics.days, (day) => {
    const metric = day.supportingMetrics[key];
    return metric.status === "AVAILABLE" ? metric.value : null;
  });
}

export function adaptExploreSeries(analytics: Analytics): ExploreSeries {
  const recoveryUsable = new Set(["available", "partial"]);
  return {
    steps: collect(analytics.steps.daily, (day) => day.value),
    activeCalories: collect(analytics.activeCalories.daily, (day) => day.value),
    totalCalories: collect(analytics.totalCalories.daily, (day) => day.value),
    zone3Minutes: supporting(analytics, "zone3AndAbove"),
    strain: collect(analytics.strain.daily, (day) =>
      day.quality.publishable ? day.score : null,
    ),
    restingHeartRate: collect(
      analytics.restingHeartRate.daily,
      (day) => day.value,
    ),
    heartRateVariability: collect(
      analytics.heartRateVariability.daily,
      (day) => day.value,
    ),
    respiratoryRate: supporting(analytics, "respiratoryRate"),
    oxygenSaturation: supporting(analytics, "oxygenSaturation"),
    sleepDuration: collect(
      analytics.sleepDebt.daily,
      (day) => day.sleepMinutes,
    ),
    sleepDebt: collect(analytics.sleepDebt.daily, (day) => day.debtMinutes),
    sleepConsistency: collect(
      analytics.sleepConsistency.daily,
      (day) => day.score,
    ),
    bedtime: collect(analytics.sleepConsistency.daily, (day) =>
      unwrapBedtime(day.bedtimeMinutesLocal),
    ),
    wakeTime: collect(
      analytics.sleepConsistency.daily,
      (day) => day.wakeMinutesLocal,
    ),
    recovery: collect(analytics.recovery.daily, (day) =>
      day.quality.publishable && recoveryUsable.has(day.status.toLowerCase())
        ? day.score
        : null,
    ),
    weight: collect(analytics.weight.daily, (day) => day.value),
    skinTemperature: supporting(analytics, "skinTemperatureDeviation"),
    healthAge: collect(analytics.healthspan.trend, (day) => day.healthAgeYears),
    ageDelta: collect(analytics.healthspan.trend, (day) => day.ageDeltaYears),
    paceOfAging: collect(analytics.healthspan.trend, (day) => day.paceOfAging),
  };
}

/** Today's calendar date in `timeZone`. */
export function todayIn(timeZone: string, now: Date): DateKey {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/**
 * The `$range` to fetch for a window of `days` (null: all history).
 *
 * The backend compares each row's calendar date, read as UTC midnight,
 * against `[start, endExclusive)`. The account's time zone isn't known
 * until the response arrives, so the bounds are padded by a day either side
 * of UTC "today", plus `MAX_LAG` days before the window so a lagged Y has
 * data to pair with at the window's start. The exact window is applied
 * client-side from `exploreWindow`.
 */
export function exploreQueryRange(
  days: number | null,
  now: Date,
): TimeRange | null {
  if (days === null) return null;
  const today = now.toISOString().slice(0, 10);
  return {
    start: `${shiftDate(today, -(days + MAX_LAG + 1))}T00:00:00Z`,
    endExclusive: `${shiftDate(today, 2)}T00:00:00Z`,
  };
}

/** The inclusive X-date window for `days` ending today in `timeZone`. */
export function exploreWindow(
  days: number | null,
  timeZone: string,
  now: Date,
): { from: DateKey | null; to: DateKey } {
  const to = todayIn(timeZone, now);
  return { from: days === null ? null : shiftDate(to, -(days - 1)), to };
}
