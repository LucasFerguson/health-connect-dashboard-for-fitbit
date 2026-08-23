import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
  RestingHeartRateObservation,
  StepsObservation,
  WeightObservation,
} from "../../../src/domain/health";
import { aggregateIntervalMetric } from "./aggregateIntervalMetric";
import { aggregatePointMetric } from "./aggregatePointMetric";

const context = {
  homeTimeZone: "America/Chicago",
  sleepTargetMinutes: 480,
  birthDate: null,
};

describe("metric aggregation", () => {
  it("splits an interval across local calendar days", () => {
    const record: StepsObservation = {
      id: "steps",
      source: "watch",
      startAt: "2026-01-02T05:30:00Z",
      endAt: "2026-01-02T06:30:00Z",
      count: 600,
    };
    const result = aggregateIntervalMetric(
      [record],
      "steps",
      (item) => item.count,
      context,
    );
    assert.deepEqual(
      result.daily.map((day) => [day.date, day.value]),
      [
        ["2026-01-01", 300],
        ["2026-01-02", 300],
      ],
    );
  });

  it("selects the interval source with greater daily coverage", () => {
    const records: StepsObservation[] = [
      steps(
        "phone",
        "phone",
        "2026-01-02T12:00:00Z",
        "2026-01-02T13:00:00Z",
        1000,
      ),
      steps(
        "watch",
        "watch",
        "2026-01-02T12:00:00Z",
        "2026-01-02T14:00:00Z",
        900,
      ),
    ];
    const day = aggregateIntervalMetric(
      records,
      "steps",
      (item) => item.count,
      context,
    ).daily[0];
    assert.equal(day?.source, "watch");
    assert.equal(day?.bySource.length, 2);
  });

  it("uses the daily median for resting heart rate", () => {
    const records: RestingHeartRateObservation[] = [50, 60, 100].map(
      (bpm, index) => ({
        id: String(index),
        source: "watch",
        observedAt: `2026-01-02T1${index}:00:00Z`,
        bpm,
      }),
    );
    const result = aggregatePointMetric(
      records,
      "bpm",
      (item) => item.bpm,
      "median",
      context,
    );
    assert.equal(result.daily[0]?.value, 60);
  });

  it("uses the latest daily weight measurement", () => {
    const records: WeightObservation[] = [
      {
        id: "early",
        source: "scale",
        observedAt: "2026-01-02T12:00:00Z",
        kilograms: 70,
      },
      {
        id: "late",
        source: "scale",
        observedAt: "2026-01-02T14:00:00Z",
        kilograms: 69.5,
      },
    ];
    const result = aggregatePointMetric(
      records,
      "kg",
      (item) => item.kilograms,
      "latest",
      context,
    );
    assert.equal(result.daily[0]?.value, 69.5);
  });

  it("prepares calendar-aware rolling and monthly trend series", () => {
    const records: StepsObservation[] = [
      steps(
        "one",
        "watch",
        "2026-01-01T12:00:00Z",
        "2026-01-01T13:00:00Z",
        100,
      ),
      steps(
        "two",
        "watch",
        "2026-01-02T12:00:00Z",
        "2026-01-02T13:00:00Z",
        300,
      ),
      steps(
        "three",
        "watch",
        "2026-01-10T12:00:00Z",
        "2026-01-10T13:00:00Z",
        900,
      ),
      steps(
        "four",
        "watch",
        "2026-02-01T12:00:00Z",
        "2026-02-01T13:00:00Z",
        500,
      ),
    ];
    const result = aggregateIntervalMetric(
      records,
      "steps",
      (item) => item.count,
      { homeTimeZone: "UTC", sleepTargetMinutes: 480, birthDate: null },
    );

    assert.deepEqual(
      result.rolling7Day.map((point) => [
        point.date,
        point.value,
        point.sampleCount,
      ]),
      [
        ["2026-01-01", 100, 1],
        ["2026-01-02", 200, 2],
        ["2026-01-10", 900, 1],
        ["2026-02-01", 500, 1],
      ],
    );
    assert.deepEqual(
      result.monthly.map((month) => [
        month.month,
        month.value,
        month.sampleCount,
      ]),
      [
        ["2026-01", 433.3333333333333, 3],
        ["2026-02", 500, 1],
      ],
    );
  });
});

function steps(
  id: string,
  source: string,
  startAt: string,
  endAt: string,
  count: number,
): StepsObservation {
  return { id, source, startAt, endAt, count };
}
