/**
 * GraphQL-backed feed-presence read for the data-sources page. Same pattern as
 * `getSleepDebtAnalytics`.
 */
import { withAnalytics } from "./graphql/fetchAnalytics";
import { DATA_SOURCES_QUERY } from "./graphql/dataSourcesQuery";

/** Matches `FeedKey` in `DataSourcesPage`. */
export type FeedPresence = {
  sleep: boolean;
  steps: boolean;
  activeCalories: boolean;
  totalCalories: boolean;
  restingHeartRate: boolean;
  weight: boolean;
};

/** Throws when GraphQL can't serve this page; see `withAnalytics`. */
export function getDataSourceStatus() {
  return withAnalytics(
    "data-sources",
    DATA_SOURCES_QUERY,
    (analytics): FeedPresence => ({
      // A non-null `latest` is the cheapest proof that any sleep day exists,
      // without selecting the whole daily series just to count it.
      sleep: analytics.sleepDebt.latest !== null,
      steps: analytics.steps.overview.sampleCount > 0,
      activeCalories: analytics.activeCalories.overview.sampleCount > 0,
      totalCalories: analytics.totalCalories.overview.sampleCount > 0,
      restingHeartRate: analytics.restingHeartRate.overview.sampleCount > 0,
      weight: analytics.weight.overview.sampleCount > 0,
    }),
  );
}
