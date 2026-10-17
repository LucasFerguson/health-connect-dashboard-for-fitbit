/**
 * Phone-upload sync heartbeat and analytics job state from
 * `viewer.ingestion`, for `/api/sync-status`.
 */
import { adaptSyncStatus } from "./adapters/syncStatusAdapter";
import { withViewer } from "./graphql/fetchAnalytics";
import { SYNC_STATUS_QUERY } from "./graphql/syncStatusQuery";

/** Throws when GraphQL can't serve it; see `withViewer`. */
export function getSyncStatus() {
  return withViewer("sync-status", SYNC_STATUS_QUERY, (viewer) =>
    adaptSyncStatus(viewer.ingestion),
  );
}
