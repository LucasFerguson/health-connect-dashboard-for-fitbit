import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildStepDetail, stepRecordsAt, stepsPerMinute } from "./stepDetail";

const START = Date.parse("2026-10-18T05:00:00Z");
const at = (minutes: number) =>
  new Date(START + minutes * 60_000).toISOString();
const record = (
  id: string,
  source: string,
  from: number,
  to: number,
  count: number,
) => ({ id, source, startAt: at(from), endAt: at(to), count });

void describe("buildStepDetail", () => {
  void it("keeps records as written, finest-grained source first", () => {
    const detail = buildStepDetail(
      [
        record("w", "com.whoop.android", -1000, 200, 9035),
        record("f1", "com.fitbit.FitbitMobile", 34, 35, 53),
        record("f2", "com.fitbit.FitbitMobile", 34, 35, 79),
        record("f3", "com.fitbit.FitbitMobile", 36, 37, 18),
        record("old", "com.fitbit.FitbitMobile", -10, -9, 5),
      ],
      START,
    )!;
    assert.deepEqual(
      detail.sources.map((source) => [source.source, source.records.length]),
      [
        ["com.fitbit.FitbitMobile", 3],
        ["com.whoop.android", 1],
      ],
    );
    const fitbit = detail.sources[0]!;
    assert.equal(fitbit.typicalMinutes, 1);
    // Both same-minute records are kept, not merged or deduplicated.
    assert.deepEqual(
      stepRecordsAt(fitbit, 34.5).map((span) => span.count),
      [53, 79],
    );
    // The day-long record keeps its full count and real span.
    const whoop = detail.sources[1]!.records[0]!;
    assert.equal(whoop.count, 9035);
    assert.equal(whoop.startMinute, -1000);
  });

  void it("returns null when nothing overlaps the day", () => {
    assert.equal(
      buildStepDetail([record("x", "a", 1440, 1441, 3)], START),
      null,
    );
  });
});

void describe("stepsPerMinute", () => {
  void it("divides the count by the span", () => {
    assert.equal(
      stepsPerMinute({ id: "a", startMinute: 0, endMinute: 0.5, count: 50 }),
      100,
    );
  });
  void it("treats a zero-length record as one second", () => {
    assert.equal(
      stepsPerMinute({ id: "a", startMinute: 3, endMinute: 3, count: 1 }),
      60,
    );
  });
});
