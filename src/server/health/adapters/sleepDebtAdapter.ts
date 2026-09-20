/**
 * Maps HCGateway's `SleepDebtSummary` onto the domain `SleepDebtAnalytics`.
 *
 * Extracted from `getSleepDebtAnalytics` so the overview page — which selects
 * the same fields as part of its wider query — reuses this mapping instead of
 * duplicating it. Both callers must therefore keep selecting the same fields;
 * the parameter type below is the contract.
 *
 * Does no health-data computation: every value is already prepared server-side.
 * `buildBreakdown` is the one exception and is a pure tally, explained below.
 */
import type {
  DailySleepDebt,
  SleepDebtAnalytics,
  SleepDebtBreakdown,
  SleepDebtCategory,
} from "~/domain/analytics";
import type { DebtCategory } from "~/types/__generated__/graphql";

/**
 * GraphQL enum values are SCREAMING_CASE; the domain type is lowercase. Typed
 * as a total Record so adding a category to the schema becomes a compile error
 * here rather than an `undefined` rendered in the UI.
 */
const categoryByEnum: Record<DebtCategory, SleepDebtCategory> = {
  NONE: "none",
  LOW: "low",
  MODERATE: "moderate",
  HIGH: "high",
};

export interface GraphQLSleepDebt {
  targetMinutes: number;
  methodology: string;
  average7DayMinutes: number | null;
  average30DayMinutes: number | null;
  previous30DayAverageMinutes: number | null;
  daily: {
    date: string;
    sleepMinutes: number;
    targetMinutes: number;
    debtMinutes: number;
    surplusMinutes: number;
    category: DebtCategory;
    rolling7DayAverageMinutes: number | null;
    rolling7DayTotalMinutes: number | null;
    rolling30DayAverageMinutes: number | null;
  }[];
}

export function adaptSleepDebt(
  sleepDebt: GraphQLSleepDebt,
): SleepDebtAnalytics {
  const daily: DailySleepDebt[] = sleepDebt.daily.map((day) => ({
    date: day.date,
    sleepMinutes: day.sleepMinutes,
    targetMinutes: day.targetMinutes,
    debtMinutes: day.debtMinutes,
    surplusMinutes: day.surplusMinutes,
    category: categoryByEnum[day.category],
    // The domain type requires numbers; the API returns null for dates without
    // a full trailing window. 0 would be a lie, so fall back to the day's own
    // value, which is what an incomplete window averages to.
    rolling7DayAverageMinutes:
      day.rolling7DayAverageMinutes ?? day.sleepMinutes,
    rolling7DayTotalMinutes: day.rolling7DayTotalMinutes ?? day.sleepMinutes,
    rolling30DayAverageMinutes:
      day.rolling30DayAverageMinutes ?? day.sleepMinutes,
  }));

  return {
    targetMinutes: sleepDebt.targetMinutes,
    methodology: sleepDebt.methodology,
    daily,
    latest: daily.at(-1) ?? null,
    average7DayMinutes: sleepDebt.average7DayMinutes,
    average30DayMinutes: sleepDebt.average30DayMinutes,
    previous30DayAverageMinutes: sleepDebt.previous30DayAverageMinutes,
    breakdown30Day: buildBreakdown(daily),
  };
}

/**
 * `SleepDebtSummary.breakdown30Day` is an untyped `JSON` scalar in the schema,
 * so it isn't safe to read blindly. Recomputing the counts from the typed
 * `daily` array is a pure tally over already-prepared categories — no health
 * analytics — and it stays correct if the JSON shape changes.
 */
function buildBreakdown(daily: DailySleepDebt[]): SleepDebtBreakdown {
  const last30 = daily.slice(-30);
  return {
    recordedDays: last30.length,
    none: last30.filter((day) => day.category === "none").length,
    low: last30.filter((day) => day.category === "low").length,
    moderate: last30.filter((day) => day.category === "moderate").length,
    high: last30.filter((day) => day.category === "high").length,
  };
}
