import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SleepEvent } from "../../src/domain/analytics";
import type { SleepSession } from "../../src/domain/health";
import {
  calculateSleepConsistency,
  categorizeConsistency,
  consistencyScore,
} from "./calculateSleepConsistency";

const context = { homeTimeZone: "UTC", sleepTargetMinutes: 480 };

describe("calculateSleepConsistency", () => {
  it("requires three prior nights before assigning a score", () => {
    const result = calculateSleepConsistency(
      [
        event("one", "2026-01-01", "23:45", "07:00"),
        event("two", "2026-01-02", "00:00", "07:00"),
        event("three", "2026-01-03", "00:15", "07:00"),
      ],
      context,
    );

    assert.deepEqual(
      result.daily.map((day) => day.score),
      [null, null, null],
    );
    assert.deepEqual(result.daily[0]?.qualityFlags, ["insufficient_baseline"]);
  });

  it("handles bedtime baselines across midnight", () => {
    const result = calculateSleepConsistency(
      [
        event("one", "2026-01-01", "23:45", "07:00"),
        event("two", "2026-01-02", "00:00", "07:00"),
        event("three", "2026-01-03", "00:15", "07:00"),
        event("four", "2026-01-04", "00:00", "08:00"),
      ],
      context,
    );
    const scored = result.daily[3];

    assert.equal(scored?.baselineBedtimeMinutesLocal, 0);
    assert.equal(scored?.bedtimeDeviationMinutes, 0);
    assert.equal(scored?.wakeDeviationMinutes, 60);
    assert.equal(scored?.score, 90);
    assert.equal(scored?.category, "optimal");
  });

  it("maps schedule deviation into explicit score categories", () => {
    assert.equal(consistencyScore(0, 0), 100);
    assert.equal(consistencyScore(60, 60), 80);
    assert.equal(consistencyScore(90, 90), 70);
    assert.equal(categorizeConsistency(80), "optimal");
    assert.equal(categorizeConsistency(70), "sufficient");
    assert.equal(categorizeConsistency(69), "poor");
  });
});

function event(
  id: string,
  date: string,
  bedtime: string,
  wake: string,
): SleepEvent {
  const bedtimeDate = bedtime.startsWith("23") ? date : nextDate(date);
  const wakeDate = nextDate(date);
  const primary: SleepSession = {
    id,
    source: "watch",
    startAt: `${bedtimeDate}T${bedtime}:00Z`,
    endAt: `${wakeDate}T${wake}:00Z`,
    title: null,
    notes: null,
    stages: [],
  };
  return { id, date, primary, recordings: [primary] };
}

function nextDate(date: string): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + 86_400_000)
    .toISOString()
    .slice(0, 10);
}
