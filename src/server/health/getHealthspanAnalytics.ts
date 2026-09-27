/**
 * GraphQL-backed healthspan read. Same pattern as `getSleepDebtAnalytics`.
 *
 * The mapping itself lives in `adapters/healthspanAdapter.ts` because the
 * overview page selects the same fields inside its wider query and shares it.
 */
import { adaptHealthspan } from "./adapters/healthspanAdapter";
import { withAnalytics } from "./graphql/fetchAnalytics";
import { HEALTHSPAN_QUERY } from "./graphql/healthspanQuery";

/** Throws when GraphQL can't serve this page; see `withAnalytics`. */
export function getHealthspanAnalytics() {
  return withAnalytics("healthspan", HEALTHSPAN_QUERY, ({ healthspan }) =>
    adaptHealthspan(healthspan),
  );
}
