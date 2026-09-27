/**
 * GraphQL-backed read for the overview (home) page.
 *
 * The mapping lives in `adapters/overviewAdapter.ts` because the browser needs
 * it too: `HealthDataProvider` polls the same query through Apollo and maps the
 * result with `adaptOverview`. This module is just the server-side entrypoint.
 */
import { adaptOverview } from "./adapters/overviewAdapter";
import { withAnalytics } from "./graphql/fetchAnalytics";
import { OVERVIEW_QUERY } from "./graphql/overviewQuery";

/** Throws when GraphQL can't serve this page; see `withAnalytics`. */
export function getOverviewSnapshot() {
  return withAnalytics("overview", OVERVIEW_QUERY, adaptOverview);
}
