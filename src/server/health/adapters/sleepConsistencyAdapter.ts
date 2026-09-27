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
import type {
  ConsistencyCategory,
  SleepConsistencyPageQuery,
} from "~/types/__generated__/graphql";

const categoryByEnum: Record<ConsistencyCategory, SleepConsistencyCategory> = {
  OPTIMAL: "optimal",
  SUFFICIENT: "sufficient",
  POOR: "poor",
};

export type GraphQLSleepConsistency =
  SleepConsistencyPageQuery["viewer"]["analytics"]["sleepConsistency"];

export function adaptSleepConsistency(
  sleepConsistency: GraphQLSleepConsistency,
): SleepConsistencyAnalytics {
  const daily: DailySleepConsistency[] = sleepConsistency.daily.map((day) => ({
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
  }));

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
