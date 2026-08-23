import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { DailyHealthspanEstimate } from "../../src/domain/analytics";
import {
  calculatePaceOfAging,
  scoreHealthspanFactors,
} from "./calculateHealthspan";

describe("healthspan model", () => {
  it("keeps each factor's age contribution explicit", () => {
    const factors = scoreHealthspanFactors(
      {
        sleepMinutes: { value: 310, coverageDays: 20 },
        consistencyScore: { value: 48, coverageDays: 18 },
        steps: { value: 6_230, coverageDays: 22 },
        restingHeartRate: { value: 55, coverageDays: 12 },
      },
      480,
    );

    assert.deepEqual(
      factors.map((factor) => [factor.key, factor.ageImpactYears]),
      [
        ["sleep_duration", 2.55],
        ["sleep_consistency", 0.96],
        ["steps", 0.71],
        ["resting_heart_rate", -0.5],
      ],
    );
  });

  it("annualizes the health-age trend into pace of aging", () => {
    const start = Date.parse("2026-01-01T00:00:00Z");
    const estimates = Array.from({ length: 7 }, (_, index) => {
      const days = index * 10;
      return estimate(
        new Date(start + days * 86_400_000).toISOString().slice(0, 10),
        30 + days / 365.2425,
      );
    });

    assert.equal(calculatePaceOfAging(estimates), 1);
  });

  it("does not publish pace before a thirty-day span exists", () => {
    assert.equal(
      calculatePaceOfAging([
        estimate("2026-01-01", 30),
        estimate("2026-01-10", 30.1),
      ]),
      null,
    );
  });
});

function estimate(
  date: string,
  healthAgeYears: number,
): DailyHealthspanEstimate {
  return {
    date,
    chronologicalAgeYears: 30,
    healthAgeYears,
    ageDeltaYears: 0,
    paceOfAging: null,
    factors: [],
    qualityFlags: [],
  };
}
