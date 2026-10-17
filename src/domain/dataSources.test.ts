import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  RECORD_TYPES,
  buildRecordRows,
  buildSourceRows,
  collectionFor,
} from "./dataSources";

const now = new Date("2026-10-17T12:00:00Z");

void describe("data sources", () => {
  void it("names collections in lowerCamelCase", () => {
    assert.equal(collectionFor("ActiveCaloriesBurned"), "activeCaloriesBurned");
  });

  void it("classifies receiving, stalled, empty and uncollected types", () => {
    const rows = buildRecordRows(
      [
        {
          collection: "steps",
          records: 10,
          earliest: "2026-01-01T00:00:00Z",
          latest: "2026-10-17T08:00:00Z",
          bySource: [
            { source: "com.android.healthconnect.phone.a", count: 4 },
            { source: "com.android.healthconnect.phone.b", count: 3 },
            { source: "com.whoop.android", count: 3 },
          ],
        },
        {
          collection: "restingHeartRate",
          records: 5,
          earliest: "2026-01-01T00:00:00Z",
          latest: "2026-10-08T00:00:00Z",
          bySource: [{ source: "com.whoop.android", count: 5 }],
        },
        {
          collection: "weight",
          records: 2,
          earliest: "2025-03-01T00:00:00Z",
          latest: "2026-01-01T00:00:00Z",
          bySource: [],
        },
      ],
      [
        {
          source: "com.android.healthconnect.phone.a",
          label: "Phone",
          records: 4,
        },
        {
          source: "com.android.healthconnect.phone.b",
          label: "Phone",
          records: 3,
        },
        { source: "com.whoop.android", label: "WHOOP", records: 8 },
      ],
      now,
    );
    const status = (type: string) =>
      rows.find((row) => row.type === type)?.status;
    assert.equal(status("Steps"), "receiving");
    assert.equal(status("RestingHeartRate"), "stalled");
    // Weigh-ins are occasional, so an old one isn't a stalled source.
    assert.equal(status("Weight"), "receiving");
    assert.equal(status("BloodPressure"), "no-data");
    assert.equal(status("HeartRateVariabilityRmssd"), "not-collected");
    assert.deepEqual(rows.find((row) => row.type === "Steps")?.sources, [
      { label: "Phone", records: 7 },
      { label: "WHOOP", records: 3 },
    ]);
    assert.equal(rows.length, RECORD_TYPES.length);
  });

  void it("reports each source's newest record and flags silent ones", () => {
    const sources = buildSourceRows(
      [
        {
          sourceLabel: "WHOOP",
          records: 3,
          latest: "2026-10-08T21:10:00.119Z",
        },
        { sourceLabel: "Fitbit", records: 9, latest: "2026-10-16T00:00:00Z" },
        { sourceLabel: "Fitbit", records: 1, latest: "2026-10-17T05:30:00Z" },
        { sourceLabel: "unknown", records: 4, latest: null },
      ],
      now,
    );
    assert.deepEqual(sources, [
      {
        label: "Fitbit",
        records: 10,
        latest: "2026-10-17T05:30:00Z",
        stale: false,
      },
      {
        label: "WHOOP",
        records: 3,
        latest: "2026-10-08T21:10:00.119Z",
        stale: true,
      },
    ]);
  });
});
