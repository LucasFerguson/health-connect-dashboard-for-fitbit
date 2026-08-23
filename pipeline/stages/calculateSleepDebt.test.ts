import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { DailySleepSummary } from "../../src/domain/analytics";
import { calculateSleepDebt, categorizeDebt } from "./calculateSleepDebt";

describe("calculateSleepDebt", () => {
  it("keeps deficits and surplus separate", () => {
    const result = calculateSleepDebt(
      [day("2026-01-01", 420), day("2026-01-02", 510)],
      480,
    );

    assert.equal(result.daily[0]?.debtMinutes, 60);
    assert.equal(result.daily[0]?.surplusMinutes, 0);
    assert.equal(result.daily[1]?.debtMinutes, 0);
    assert.equal(result.daily[1]?.surplusMinutes, 30);
  });

  it("builds calendar-based rolling windows without treating missing days as zero", () => {
    const result = calculateSleepDebt(
      [day("2026-01-01", 420), day("2026-01-02", 450), day("2026-01-10", 360)],
      480,
    );

    assert.equal(result.daily[1]?.rolling7DayAverageMinutes, 45);
    assert.equal(result.daily[2]?.rolling7DayAverageMinutes, 120);
    assert.equal(result.daily[2]?.rolling7DayTotalMinutes, 120);
  });

  it("classifies the breakdown thresholds", () => {
    assert.equal(categorizeDebt(0), "none");
    assert.equal(categorizeDebt(29), "low");
    assert.equal(categorizeDebt(30), "moderate");
    assert.equal(categorizeDebt(45), "moderate");
    assert.equal(categorizeDebt(46), "high");
  });
});

function day(date: string, sleepMinutes: number): DailySleepSummary {
  return { date, sleepMinutes, eventCount: 1, recordingCount: 1 };
}
