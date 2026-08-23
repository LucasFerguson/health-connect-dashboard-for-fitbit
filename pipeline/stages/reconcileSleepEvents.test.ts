import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SleepSession } from "../../src/domain/health";
import { processHealthData } from "../processHealthData";
import { reconcileSleepEvents } from "./reconcileSleepEvents";

describe("reconcileSleepEvents", () => {
  it("groups overlapping device observations but preserves both recordings", () => {
    const fitbit = session(
      "fitbit",
      "Fitbit",
      "2026-07-27T04:43:00Z",
      "2026-07-27T09:39:00Z",
    );
    const whoop = session(
      "whoop",
      "WHOOP",
      "2026-07-27T04:43:20Z",
      "2026-07-27T09:38:21Z",
    );

    const events = reconcileSleepEvents([fitbit, whoop], context);

    assert.equal(events.length, 1);
    assert.equal(events[0]?.primary.id, "fitbit");
    assert.deepEqual(
      events[0]?.recordings.map((recording) => recording.id),
      ["fitbit", "whoop"],
    );
  });

  it("keeps a separate nap as another sleep event", () => {
    const overnight = session(
      "overnight",
      "Fitbit",
      "2026-07-27T04:43:00Z",
      "2026-07-27T09:39:00Z",
    );
    const nap = session(
      "nap",
      "Fitbit",
      "2026-07-27T18:00:00Z",
      "2026-07-27T18:45:00Z",
    );

    assert.equal(reconcileSleepEvents([overnight, nap], context).length, 2);
  });

  it("produces a stable source fingerprint", () => {
    const records = [
      session("one", "Fitbit", "2026-07-27T04:43:00Z", "2026-07-27T09:39:00Z"),
    ];
    assert.equal(
      processHealthData(raw(records)).sourceFingerprint,
      processHealthData(raw([...records].reverse())).sourceFingerprint,
    );
  });
});

const context = { homeTimeZone: "UTC", sleepTargetMinutes: 480 };

function raw(sleepSessions: SleepSession[]) {
  return {
    sleepSessions,
    steps: [],
    activeCalories: [],
    totalCalories: [],
    restingHeartRates: [],
    weights: [],
  };
}

function session(
  id: string,
  source: string,
  startAt: string,
  endAt: string,
): SleepSession {
  return {
    id,
    source,
    startAt,
    endAt,
    title: null,
    notes: null,
    stages: [{ startAt, endAt, kind: "asleep" }],
  };
}
