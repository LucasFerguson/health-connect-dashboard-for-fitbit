/**
 * GraphQL-backed daily-sleep read for the sleep-quantity page. Same pattern as
 * `getSleepDebtAnalytics`: a query plus a thin mapping run through
 * `withAnalytics`.
 */
import type { DailySleepSummary } from "~/domain/analytics";
import { withAnalytics } from "./graphql/fetchAnalytics";
import { DAILY_SLEEP_QUERY } from "./graphql/dailySleepQuery";

export interface DailySleepPageData {
  daily: DailySleepSummary[];
  targetMinutes: number;
}

/** Throws when GraphQL can't serve this page; see `withAnalytics`. */
export function getDailySleep() {
  return withAnalytics(
    "daily-sleep",
    DAILY_SLEEP_QUERY,
    ({ sleepDebt, days }): DailySleepPageData => {
      const daily = days.flatMap((day): DailySleepSummary[] => {
        const sleep = day.headlineScores.sleepDuration;
        // Days with no sleep recorded report status MISSING and null values
        // rather than zero — the API is explicit about absence. Skipping them
        // keeps the chart and heatmap honest: a gap stays a gap instead of
        // becoming a plotted zero-minute night.
        if (
          sleep.value === null ||
          sleep.eventCount === null ||
          sleep.recordingCount === null
        ) {
          return [];
        }
        return [
          {
            date: day.date,
            sleepMinutes: sleep.value,
            eventCount: sleep.eventCount,
            recordingCount: sleep.recordingCount,
          },
        ];
      });

      return { daily, targetMinutes: sleepDebt.targetMinutes };
    },
  );
}
