/**
 * Maps HCGateway's `SleepConsistencySummary` onto the domain
 * `SleepConsistencyAnalytics`.
 *
 * Extracted from `getSleepConsistencyAnalytics` so the overview page — which
 * selects the same fields as part of its wider query — reuses this mapping
 * instead of duplicating it. Both callers must keep selecting the same fields;
 * the parameter type below is the contract.
 */
import type {
  DailySleepConsistency,
  SleepConsistencyAnalytics,
  SleepConsistencyBreakdown,
  SleepConsistencyCategory,
} from "~/domain/analytics";
import type { ConsistencyCategory } from "~/types/__generated__/graphql";

const categoryByEnum: Record<ConsistencyCategory, SleepConsistencyCategory> = {
  OPTIMAL: "optimal",
  SUFFICIENT: "sufficient",
  POOR: "poor",
};

export interface GraphQLSleepConsistency {
  baselineWindowDays: number;
  minimumBaselineNights: number;
  methodology: string;
  average7DayScore: number | null;
  average30DayScore: number | null;
  previous30DayAverageScore: number | null;
  daily: {
    date: string;
    source: string | null;
    bedtimeAt: string | null;
    wakeAt: string | null;
    bedtimeMinutesLocal: number | null;
    wakeMinutesLocal: number | null;
    baselineBedtimeMinutesLocal: number | null;
    baselineWakeMinutesLocal: number | null;
    bedtimeDeviationMinutes: number | null;
    wakeDeviationMinutes: number | null;
    baselineNightCount: number;
    score: number | null;
    category: ConsistencyCategory | null;
    rolling7DayAverageScore: number | null;
    rolling30DayAverageScore: number | null;
    qualityFlags: string[];
  }[];
}

export function adaptSleepConsistency(
  sleepConsistency: GraphQLSleepConsistency,
): SleepConsistencyAnalytics {
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
