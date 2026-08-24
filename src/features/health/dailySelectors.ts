/**
 * LEGACY — part of the old plan where this repo computed its own health
 * analytics locally. That plan has changed: a separate backend (HCGateway)
 * now owns analytics computation, and this repo is moving toward being
 * frontend-only. This file still runs for pages that haven't been migrated
 * yet (see README.md's "Architecture and data flow" section).
 *
 * Do not extend this file with new metrics, new computations, or new
 * data-processing logic. If a page needs something this doesn't already
 * provide, ask the user whether it should come from a new HCGateway API
 * endpoint instead of being built here.
 */
import type {
  DailyMetricSummary,
  DailySleepSummary,
  SleepEvent,
} from "~/domain/analytics";
import type { DateKey, HealthSnapshot } from "~/domain/health";

export interface DailyHealthView {
  date: DateKey;
  sleep: DailySleepSummary | null;
  sleepEvents: SleepEvent[];
  sleepDebt: HealthSnapshot["analytics"]["sleepDebt"]["daily"][number] | null;
  sleepConsistency:
    | HealthSnapshot["analytics"]["sleepConsistency"]["daily"][number]
    | null;
  steps: DailyMetricSummary | null;
  activeCalories: DailyMetricSummary | null;
  totalCalories: DailyMetricSummary | null;
  restingHeartRate: DailyMetricSummary | null;
  weight: DailyMetricSummary | null;
}

export function selectDailyHealth(
  snapshot: HealthSnapshot,
  date: DateKey,
): DailyHealthView {
  const { analytics } = snapshot;
  return {
    date,
    sleep: analytics.dailySleep.find((day) => day.date === date) ?? null,
    sleepEvents: analytics.sleepEvents.filter((event) => event.date === date),
    sleepDebt:
      analytics.sleepDebt.daily.find((day) => day.date === date) ?? null,
    sleepConsistency:
      analytics.sleepConsistency.daily.find((day) => day.date === date) ?? null,
    steps: findMetric(analytics.steps.daily, date),
    activeCalories: findMetric(analytics.activeCalories.daily, date),
    totalCalories: findMetric(analytics.totalCalories.daily, date),
    restingHeartRate: findMetric(analytics.restingHeartRate.daily, date),
    weight: findMetric(analytics.weight.daily, date),
  };
}

function findMetric(
  days: DailyMetricSummary[],
  date: DateKey,
): DailyMetricSummary | null {
  return days.find((day) => day.date === date) ?? null;
}
