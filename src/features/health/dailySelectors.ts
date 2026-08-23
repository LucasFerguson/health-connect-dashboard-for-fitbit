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
