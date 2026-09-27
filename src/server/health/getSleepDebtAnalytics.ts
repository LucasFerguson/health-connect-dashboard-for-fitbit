/**
 * GraphQL-backed sleep-debt read: a query plus a thin mapping run through
 * `withAnalytics`. The other `get*` modules here follow the same pattern.
 *
 * The mapping itself lives in `adapters/sleepDebtAdapter.ts` because the
 * overview page selects the same fields inside its wider query and shares it.
 */
import { adaptSleepDebt } from "./adapters/sleepDebtAdapter";
import { withAnalytics } from "./graphql/fetchAnalytics";
import { SLEEP_DEBT_QUERY } from "./graphql/sleepDebtQuery";

/** Throws when GraphQL can't serve this page; see `withAnalytics`. */
export function getSleepDebtAnalytics() {
  return withAnalytics("sleep-debt", SLEEP_DEBT_QUERY, ({ sleepDebt }) =>
    adaptSleepDebt(sleepDebt),
  );
}
