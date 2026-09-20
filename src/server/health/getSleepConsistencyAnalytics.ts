/**
 * GraphQL-backed sleep-consistency read. Same pattern as
 * `getSleepDebtAnalytics` — see GRAPHQL_MIGRATION_REDUNDANCY.md.
 *
 * The mapping itself lives in `adapters/sleepConsistencyAdapter.ts` because the
 * overview page selects the same fields inside its wider query and shares it.
 */
import { adaptSleepConsistency } from "./adapters/sleepConsistencyAdapter";
import { withAnalytics } from "./graphql/fetchAnalytics";
import { SLEEP_CONSISTENCY_QUERY } from "./graphql/sleepConsistencyQuery";

/** Returns `null` when GraphQL can't serve this page; see `withAnalytics`. */
export function getSleepConsistencyAnalytics() {
  return withAnalytics(
    "sleep-consistency",
    SLEEP_CONSISTENCY_QUERY,
    ({ sleepConsistency }) => adaptSleepConsistency(sleepConsistency),
  );
}
