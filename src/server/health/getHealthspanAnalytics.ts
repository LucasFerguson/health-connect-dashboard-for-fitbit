/**
 * GraphQL-backed healthspan read. Same pattern as `getSleepDebtAnalytics` —
 * see GRAPHQL_MIGRATION_REDUNDANCY.md.
 *
 * The mapping itself lives in `adapters/healthspanAdapter.ts` because the
 * overview page selects the same fields inside its wider query and shares it.
 */
import { adaptHealthspan } from "./adapters/healthspanAdapter";
import { withAnalytics } from "./graphql/fetchAnalytics";
import { HEALTHSPAN_QUERY } from "./graphql/healthspanQuery";

/** Returns `null` when GraphQL can't serve this page; see `withAnalytics`. */
export function getHealthspanAnalytics() {
  return withAnalytics("healthspan", HEALTHSPAN_QUERY, ({ healthspan }) =>
    adaptHealthspan(healthspan),
  );
}
