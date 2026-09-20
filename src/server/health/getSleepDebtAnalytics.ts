/**
 * GraphQL-backed sleep-debt read — the first page migrated off the legacy
 * in-repo analytics pipeline (see GRAPHQL_MIGRATION_REDUNDANCY.md).
 *
 * The mapping itself lives in `adapters/sleepDebtAdapter.ts` because the
 * overview page selects the same fields inside its wider query and shares it.
 */
import { adaptSleepDebt } from "./adapters/sleepDebtAdapter";
import { withAnalytics } from "./graphql/fetchAnalytics";
import { SLEEP_DEBT_QUERY } from "./graphql/sleepDebtQuery";

/** Returns `null` when GraphQL can't serve this page; see `withAnalytics`. */
export function getSleepDebtAnalytics() {
  return withAnalytics("sleep-debt", SLEEP_DEBT_QUERY, ({ sleepDebt }) =>
    adaptSleepDebt(sleepDebt),
  );
}
