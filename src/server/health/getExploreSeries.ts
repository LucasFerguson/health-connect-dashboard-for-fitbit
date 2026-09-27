/**
 * GraphQL-backed read for `/explore`: every daily series in the metric
 * catalog, bounded to the selected range (plus lag padding), through
 * `withViewer` (the query reads `viewer.habits` beside `viewer.analytics`).
 */
import {
  adaptExploreHabits,
  adaptExploreSeries,
  exploreQueryRange,
  exploreWindow,
} from "./adapters/exploreAdapter";
import { withViewer } from "./graphql/fetchAnalytics";
import { EXPLORE_QUERY } from "./graphql/exploreQuery";

/** Throws when GraphQL can't serve this page; see `withAnalytics`. */
export function getExploreSeries(days: number | null, now = new Date()) {
  return withViewer(
    "explore",
    EXPLORE_QUERY,
    (viewer) => {
      const habits = adaptExploreHabits(viewer.habits);
      return {
        series: {
          ...adaptExploreSeries(viewer.analytics),
          ...habits.series,
        },
        habitMetrics: habits.metrics,
        window: exploreWindow(days, viewer.analytics.timeZone, now),
      };
    },
    { range: exploreQueryRange(days, now) },
  );
}
