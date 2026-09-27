/**
 * GraphQL-backed reads for `/day` and `/day/[date]`, following the same
 * query-plus-adapter pattern as the other `get*` modules.
 *
 * There is no server-side cache in front of these any more. The REST version
 * kept a two-tier in-memory cache (30s for the open day, 6h for closed ones)
 * because each call paid a fresh REST login; the GraphQL path reuses a cached
 * token and the backend serves prepared day views, so every render reads
 * fresh, like every other page. `AutoRefresh` still re-renders the open day
 * every 30s.
 */
import { adaptDayView, dayStripRange } from "./adapters/dayAdapter";
import { withAnalytics } from "./graphql/fetchAnalytics";
import { DAY_QUERY, DAY_TIME_ZONE_QUERY } from "./graphql/dayQuery";

/** The day view model for `date`, with its 15-day strip. Throws when GraphQL
 * can't serve it; see `withAnalytics`. */
export function getDayView(date: string) {
  return withAnalytics(
    "day",
    DAY_QUERY,
    (analytics) => adaptDayView(analytics, new Date()),
    { date, range: dayStripRange(date) },
  );
}

/** The account's home time zone, which decides what "today" is. */
export function getHomeTimeZone() {
  return withAnalytics(
    "day-time-zone",
    DAY_TIME_ZONE_QUERY,
    (analytics) => analytics.timeZone,
  );
}
