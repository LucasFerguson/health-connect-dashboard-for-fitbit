/**
 * GraphQL-backed sleep-debt read — the first page migrated off the legacy
 * in-repo analytics pipeline (see GRAPHQL_MIGRATION_REDUNDANCY.md).
 *
 * Adapts HCGateway's `SleepDebtSummary` onto the `SleepDebtAnalytics` shape
 * `SleepDebtTrendView` already consumes, so the migration is a data-source
 * swap rather than a UI rewrite. The adapter is deliberately thin and does no
 * health-data computation: every number here is already prepared server-side.
 *
 * Once every page is migrated, `SleepDebtAnalytics` in `src/domain/analytics.ts`
 * goes away and the components take the generated GraphQL types directly —
 * at which point this adapter collapses to nothing.
 */
import type {
  DailySleepDebt,
  SleepDebtAnalytics,
  SleepDebtBreakdown,
  SleepDebtCategory,
} from "~/domain/analytics";
import type { DebtCategory } from "~/types/__generated__/graphql";
import { withAnalytics } from "./graphql/fetchAnalytics";
import { SLEEP_DEBT_QUERY } from "./graphql/sleepDebtQuery";

/**
 * GraphQL enum values are SCREAMING_CASE; the domain type is lowercase. Typed
 * as a total Record so adding a category to the schema becomes a compile
 * error here rather than an `undefined` rendered in the UI.
 */
const categoryByEnum: Record<DebtCategory, SleepDebtCategory> = {
  NONE: "none",
  LOW: "low",
  MODERATE: "moderate",
  HIGH: "high",
};

/** Returns `null` when GraphQL can't serve this page; see `withAnalytics`. */
export function getSleepDebtAnalytics() {
  return withAnalytics("sleep-debt", SLEEP_DEBT_QUERY, ({ sleepDebt }) => {
    const daily: DailySleepDebt[] = sleepDebt.daily.map((day) => ({
      date: day.date,
      sleepMinutes: day.sleepMinutes,
      targetMinutes: day.targetMinutes,
      debtMinutes: day.debtMinutes,
      surplusMinutes: day.surplusMinutes,
      category: categoryByEnum[day.category],
      // The domain type requires numbers; the API returns null for dates
      // without a full trailing window. 0 would be a lie, so fall back to the
      // day's own value, which is what an incomplete window averages to.
      rolling7DayAverageMinutes:
        day.rolling7DayAverageMinutes ?? day.sleepMinutes,
      rolling7DayTotalMinutes: day.rolling7DayTotalMinutes ?? day.sleepMinutes,
      rolling30DayAverageMinutes:
        day.rolling30DayAverageMinutes ?? day.sleepMinutes,
    }));

    const analytics: SleepDebtAnalytics = {
      targetMinutes: sleepDebt.targetMinutes,
      methodology: sleepDebt.methodology,
      daily,
      latest: daily.at(-1) ?? null,
      average7DayMinutes: sleepDebt.average7DayMinutes,
      average30DayMinutes: sleepDebt.average30DayMinutes,
      previous30DayAverageMinutes: sleepDebt.previous30DayAverageMinutes,
      breakdown30Day: buildBreakdown(daily),
    };
    return analytics;
  });
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
