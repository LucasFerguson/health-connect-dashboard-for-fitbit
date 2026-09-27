/**
 * GraphQL-backed read for `/explore`: every daily series in the metric
 * catalog, bounded to the selected range (plus lag padding), through
 * `withAnalytics` like the other `get*` modules.
 */
import {
  adaptExploreSeries,
  exploreQueryRange,
  exploreWindow,
} from "./adapters/exploreAdapter";
import { withAnalytics } from "./graphql/fetchAnalytics";
import { EXPLORE_QUERY } from "./graphql/exploreQuery";

/** Throws when GraphQL can't serve this page; see `withAnalytics`. */
export function getExploreSeries(days: number | null, now = new Date()) {
  return withAnalytics(
    "explore",
    EXPLORE_QUERY,
    (analytics) => ({
      series: adaptExploreSeries(analytics),
      window: exploreWindow(days, analytics.timeZone, now),
    }),
    { range: exploreQueryRange(days, now) },
  );
}
