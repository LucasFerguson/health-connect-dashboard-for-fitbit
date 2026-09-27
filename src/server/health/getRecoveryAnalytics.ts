/**
 * GraphQL-backed recovery read. Same pattern as `getSleepDebtAnalytics`; the
 * page renders the generated types directly, so there is no adapter.
 */
import type { RecoveryPageQuery } from "~/types/__generated__/graphql";
import { withAnalytics } from "./graphql/fetchAnalytics";
import { RECOVERY_QUERY } from "./graphql/recoveryQuery";

export type RecoverySummary =
  RecoveryPageQuery["viewer"]["analytics"]["recovery"];
export type RecoveryDay = RecoverySummary["daily"][number];

/** Throws when GraphQL can't serve this page; see `withAnalytics`. */
export function getRecoveryAnalytics() {
  return withAnalytics("recovery", RECOVERY_QUERY, ({ recovery }) => recovery);
}
