/**
 * Maps HCGateway's `SleepDebtSummary` onto the domain `SleepDebtAnalytics`.
 *
 * Extracted from `getSleepDebtAnalytics` so the overview page — which selects
 * the same fields as part of its wider query — reuses this mapping instead of
 * duplicating it. Both callers must therefore keep selecting the same fields;
 * the parameter type below is the contract.
 *
 * Does no health-data computation: every value is already prepared server-side.
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
  breakdown30Day: SleepDebtBreakdown | null;
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
    breakdown30Day: toBreakdown(sleepDebt.breakdown30Day),
  };
}

/**
 * The server's `breakdown30Day` is used as-is rather than re-tallied from
 * `daily`. The two agreed on live data when this switched over, but only by
 * coincidence of an unbroken month: the server counts the 30 *calendar* days
 * ending at the latest record, the old local tally counted the last 30
 * *records*. With a gap in the window those differ (they would have at 378 of
 * the 492 recorded end dates on the primary account), and the calendar window
 * is the right one: it is the same window `average30DayMinutes` covers and the
 * one the trend view's 30-day tab shows, so the card's "N of M" now matches
 * both.
 *
 * `null` only comes back when the account has no sleep-debt summary at all,
 * which is exactly zero recorded days, not missing data being rendered as 0.
 */
function toBreakdown(breakdown: SleepDebtBreakdown | null): SleepDebtBreakdown {
  // Copied field by field so Apollo's `__typename` stays out of the domain.
  return {
    recordedDays: breakdown?.recordedDays ?? 0,
    none: breakdown?.none ?? 0,
    low: breakdown?.low ?? 0,
    moderate: breakdown?.moderate ?? 0,
    high: breakdown?.high ?? 0,
  };
}
