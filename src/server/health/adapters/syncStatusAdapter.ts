/**
 * Maps `viewer.ingestion.phoneSync` onto `/api/sync-status`'s JSON body.
 * Separate from `getSyncStatus.ts` so it can be unit-tested without the RSC
 * Apollo client.
 */
import type { SyncStatus, SyncStatusState } from "~/domain/dayView";
import type { SyncStatusQuery, SyncState } from "~/types/__generated__/graphql";

type PhoneSync = SyncStatusQuery["viewer"]["ingestion"]["phoneSync"];

/** Lowercased so the route's JSON stays the shape the REST endpoint had. A
 * total `Record`, so a new schema state is a compile error, not an unmapped
 * string the nav would label UNKNOWN. */
const stateByEnum: Record<SyncState, SyncStatusState> = {
  RECEIVING: "receiving",
  IDLE: "idle",
  NEVER_OBSERVED: "never_observed",
};

/** Field by field rather than a spread, so Apollo's `__typename` stays out of
 * the route's public JSON. */
export function adaptSyncStatus(sync: PhoneSync): SyncStatus {
  return {
    observedActive: sync.observedActive,
    state: stateByEnum[sync.state],
    // GraphQL writes instants as `…Z` where REST wrote `…+00:00`: the same
    // instant, and the nav parses them rather than comparing strings.
    lastUploadAt: sync.lastUploadAt,
    activeUntil: sync.activeUntil,
    secondsSinceLastUpload: sync.secondsSinceLastUpload,
    lastRecordType: sync.lastRecordType,
    lastRecordCount: sync.lastRecordCount,
    totalUploadRequests: sync.totalUploadRequests,
    totalRecordsReceived: sync.totalRecordsReceived,
    activityWindowSeconds: sync.activityWindowSeconds,
    note: sync.note,
  };
}
