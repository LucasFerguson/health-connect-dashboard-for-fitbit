import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SyncStatusQuery } from "~/types/__generated__/graphql";
import { adaptSyncStatus } from "./syncStatusAdapter";

/** Synthetic `viewer.ingestion.phoneSync` payloads, shaped like live ones. */
type PhoneSync = SyncStatusQuery["viewer"]["ingestion"]["phoneSync"];

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
    assert.deepEqual(adaptSyncStatus(phoneSync()), {
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
    });
  });

  void it("maps every sync state", () => {
    assert.equal(
      adaptSyncStatus(phoneSync({ state: "RECEIVING" })).state,
      "receiving",
    );
    assert.equal(
      adaptSyncStatus(
        phoneSync({
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
});
