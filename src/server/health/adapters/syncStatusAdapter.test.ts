import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SyncStatusQuery } from "~/types/__generated__/graphql";
import { adaptSyncStatus } from "./syncStatusAdapter";

/** Synthetic `viewer.ingestion` payloads, shaped like live ones. */
type Ingestion = SyncStatusQuery["viewer"]["ingestion"];
type PhoneSync = Ingestion["phoneSync"];
type Job = NonNullable<Ingestion["analyticsJob"]>;

function ingestion(
  sync: Partial<PhoneSync> = {},
  rest: Partial<Omit<Ingestion, "phoneSync">> = {},
): Ingestion {
  return {
    phoneSync: phoneSync(sync),
    analyticsJob: null,
    current: { completedAt: "2026-01-15T11:00:00.000Z" },
    ...rest,
  };
}

function job(overrides: Partial<Job> = {}): Job {
  return {
    status: "completed",
    reason: "sync",
    requestedAt: "2026-01-15T12:00:00.000Z",
    startedAt: null,
    completedAt: null,
    error: null,
    ...overrides,
  };
}

function phoneSync(overrides: Partial<PhoneSync> = {}): PhoneSync {
  return {
    observedActive: false,
    state: "IDLE",
    lastUploadAt: "2026-01-15T12:00:00.000Z",
    activeUntil: "2026-01-15T12:02:00.000Z",
    secondsSinceLastUpload: 3600,
    lastRecordType: "steps",
    lastRecordCount: 3,
    totalUploadRequests: 100,
    totalRecordsReceived: 5000,
    activityWindowSeconds: 120,
    note: "Synthetic note.",
    ...overrides,
  };
}

void describe("adaptSyncStatus", () => {
  void it("keeps the REST route's JSON shape, with a lowercase state", () => {
    assert.deepEqual(adaptSyncStatus(ingestion()), {
      observedActive: false,
      state: "idle",
      lastUploadAt: "2026-01-15T12:00:00.000Z",
      activeUntil: "2026-01-15T12:02:00.000Z",
      secondsSinceLastUpload: 3600,
      lastRecordType: "steps",
      lastRecordCount: 3,
      totalUploadRequests: 100,
      totalRecordsReceived: 5000,
      activityWindowSeconds: 120,
      note: "Synthetic note.",
      analytics: {
        state: "idle",
        since: null,
        lastCompletedAt: "2026-01-15T11:00:00.000Z",
        error: null,
      },
    });
  });

  void it("maps every sync state", () => {
    assert.equal(
      adaptSyncStatus(ingestion({ state: "RECEIVING" })).state,
      "receiving",
    );
    assert.equal(
      adaptSyncStatus(
        ingestion({
          state: "NEVER_OBSERVED",
          lastUploadAt: null,
          activeUntil: null,
          secondsSinceLastUpload: null,
          lastRecordType: null,
          lastRecordCount: null,
        }),
      ).state,
      "never_observed",
    );
  });

  void it("reads a running job's start as `since`", () => {
    const status = adaptSyncStatus(
      ingestion(
        {},
        {
          analyticsJob: job({
            status: "running",
            startedAt: "2026-01-15T12:00:20.000Z",
          }),
        },
      ),
    );
    assert.deepEqual(status.analytics, {
      state: "running",
      since: "2026-01-15T12:00:20.000Z",
      lastCompletedAt: "2026-01-15T11:00:00.000Z",
      error: null,
    });
  });

  void it("reads a queued job's request time and retry error", () => {
    const status = adaptSyncStatus(
      ingestion(
        {},
        {
          analyticsJob: job({
            status: "queued",
            error: { type: "TimeoutError", message: "mongo timed out" },
          }),
        },
      ),
    );
    assert.equal(status.analytics?.state, "queued");
    assert.equal(status.analytics?.since, "2026-01-15T12:00:00.000Z");
    assert.equal(status.analytics?.error, "TimeoutError: mongo timed out");
  });

  void it("reports a completed job newer than the unchanged current run", () => {
    // A run whose output matched the previous one (persistence=unchanged)
    // leaves current.completedAt behind; the job still says it just finished.
    const status = adaptSyncStatus(
      ingestion(
        {},
        {
          analyticsJob: job({
            status: "completed",
            completedAt: "2026-01-15T12:05:00.000Z",
          }),
        },
      ),
    );
    assert.equal(status.analytics?.state, "idle");
    assert.equal(status.analytics?.lastCompletedAt, "2026-01-15T12:05:00.000Z");
  });

  void it("treats no job and no run (a new account) as idle", () => {
    const status = adaptSyncStatus(ingestion({}, { current: null }));
    assert.deepEqual(status.analytics, {
      state: "idle",
      since: null,
      lastCompletedAt: null,
      error: null,
    });
  });
});
