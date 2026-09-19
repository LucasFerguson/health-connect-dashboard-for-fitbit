/**
 * GraphQL-backed sleep-consistency read. Same pattern as
 * `getSleepDebtAnalytics` — see GRAPHQL_MIGRATION_REDUNDANCY.md.
 */
import type {
  DailySleepConsistency,
  SleepConsistencyAnalytics,
  SleepConsistencyBreakdown,
  SleepConsistencyCategory,
} from "~/domain/analytics";
import type { ConsistencyCategory } from "~/types/__generated__/graphql";
import { withAnalytics } from "./graphql/fetchAnalytics";
import { SLEEP_CONSISTENCY_QUERY } from "./graphql/sleepConsistencyQuery";

const categoryByEnum: Record<ConsistencyCategory, SleepConsistencyCategory> = {
  OPTIMAL: "optimal",
  SUFFICIENT: "sufficient",
  POOR: "poor",
};

/** Returns `null` when GraphQL can't serve this page; see `withAnalytics`. */
export function getSleepConsistencyAnalytics() {
  return withAnalytics(
    "sleep-consistency",
    SLEEP_CONSISTENCY_QUERY,
    ({ sleepConsistency }) => {
      // `source`, `bedtimeAt`, `wakeAt` and the local-minute fields are
      // nullable in the schema but required by `DailySleepConsistency`. A day
      // missing them has no usable bedtime/wake window to plot, so it is
      // dropped rather than filled with invented values — a fabricated
      // midnight would silently skew the consistency baseline. See the
      // backend follow-up list: these should arrive non-null, or the domain
      // type should admit nulls.
      const daily: DailySleepConsistency[] = sleepConsistency.daily.flatMap(
        (day) => {
          if (
            day.source === null ||
            day.bedtimeAt === null ||
            day.wakeAt === null ||
            day.bedtimeMinutesLocal === null ||
            day.wakeMinutesLocal === null
          ) {
            return [];
          }
          return [
            {
              date: day.date,
              source: day.source,
              bedtimeAt: day.bedtimeAt,
              wakeAt: day.wakeAt,
              bedtimeMinutesLocal: day.bedtimeMinutesLocal,
              wakeMinutesLocal: day.wakeMinutesLocal,
              baselineBedtimeMinutesLocal: day.baselineBedtimeMinutesLocal,
              baselineWakeMinutesLocal: day.baselineWakeMinutesLocal,
              bedtimeDeviationMinutes: day.bedtimeDeviationMinutes,
              wakeDeviationMinutes: day.wakeDeviationMinutes,
              baselineNightCount: day.baselineNightCount,
              score: day.score,
              category: day.category ? categoryByEnum[day.category] : null,
              rolling7DayAverageScore: day.rolling7DayAverageScore,
              rolling30DayAverageScore: day.rolling30DayAverageScore,
              qualityFlags: day.qualityFlags,
            },
          ];
        },
      );

      const analytics: SleepConsistencyAnalytics = {
        baselineWindowDays: sleepConsistency.baselineWindowDays,
        minimumBaselineNights: sleepConsistency.minimumBaselineNights,
        methodology: sleepConsistency.methodology,
        daily,
        latest: daily.at(-1) ?? null,
        average7DayScore: sleepConsistency.average7DayScore,
        average30DayScore: sleepConsistency.average30DayScore,
        previous30DayAverageScore: sleepConsistency.previous30DayAverageScore,
        breakdown30Day: buildBreakdown(daily),
      };
      return analytics;
    },
  );
}

/** `breakdown30Day` is an untyped `JSON` scalar; tally from typed days instead. */
function buildBreakdown(
  daily: DailySleepConsistency[],
): SleepConsistencyBreakdown {
  const last30 = daily.slice(-30);
  const scored = last30.filter((day) => day.category !== null);
  return {
    scoredDays: scored.length,
    optimal: scored.filter((day) => day.category === "optimal").length,
    sufficient: scored.filter((day) => day.category === "sufficient").length,
    poor: scored.filter((day) => day.category === "poor").length,
  };
}
