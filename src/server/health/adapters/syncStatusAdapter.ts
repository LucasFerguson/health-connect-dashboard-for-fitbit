/**
 * Maps `viewer.ingestion` (phone sync plus the analytics job) onto `/api/sync-status`'s JSON body.
 * Separate from `getSyncStatus.ts` so it can be unit-tested without the RSC
 * Apollo client.
 */
import {
  analyticsErrorMessage,
  analyticsJobState,
  type AnalyticsStatus,
} from "~/domain/analyticsStatus";
import type { SyncStatus, SyncStatusState } from "~/domain/dayView";
import type { SyncStatusQuery, SyncState } from "~/types/__generated__/graphql";

type Ingestion = SyncStatusQuery["viewer"]["ingestion"];

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
export function adaptSyncStatus(ingestion: Ingestion): SyncStatus {
  const sync = ingestion.phoneSync;
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
    analytics: adaptAnalyticsStatus(ingestion),
  };
}

/** No job document (a new account) reads as idle. "Last finished" is the
 * later of the job's and the current run's completion: enqueueing a job
 * clears the job's `completedAt`, while a run whose output didn't change
 * (`persistence=unchanged`) leaves the current run's timestamp behind. */
export function adaptAnalyticsStatus({
  analyticsJob: job,
  current,
}: Ingestion): AnalyticsStatus {
  const state = analyticsJobState(job?.status);
  return {
    state,
    since:
      state === "running"
        ? (job?.startedAt ?? null)
        : state === "queued"
          ? (job?.requestedAt ?? null)
          : null,
    lastCompletedAt: latest(current?.completedAt, job?.completedAt),
    error: analyticsErrorMessage(job?.error),
  };
}

function latest(...instants: (string | null | undefined)[]): string | null {
  const present = instants.filter((value): value is string => Boolean(value));
  if (present.length === 0) return null;
  return present.reduce((a, b) => (Date.parse(b) > Date.parse(a) ? b : a));
}
