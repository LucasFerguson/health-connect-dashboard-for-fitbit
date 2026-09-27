import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ExplorePageQuery } from "~/types/__generated__/graphql";
import {
  adaptExploreSeries,
  exploreQueryRange,
  exploreWindow,
  unwrapBedtime,
} from "./exploreAdapter";

type Analytics = ExplorePageQuery["viewer"]["analytics"];

const metric = (rows: [string, number][]) => ({
  daily: rows.map(([date, value]) => ({ id: `m:${date}`, date, value })),
});

const value = (status: string, v: number | null) =>
  ({
    status,
    value: v,
  }) as Analytics["days"][number]["supportingMetrics"]["respiratoryRate"];

function analytics(): Analytics {
  return {
    id: "a",
    timeZone: "America/Chicago",
    steps: metric([
      ["2026-01-02", 8000],
      ["2026-01-01", 5000],
    ]),
    activeCalories: metric([]),
    totalCalories: metric([["2026-01-01", 2100]]),
    restingHeartRate: metric([["2026-01-01", Number.NaN]]),
    heartRateVariability: metric([]),
    weight: metric([]),
    sleepDebt: {
      daily: [
        {
          id: "d1",
          date: "2026-01-01",
          sleepMinutes: 420,
          debtMinutes: 60,
        },
      ],
    },
    sleepConsistency: {
      daily: [
        {
          id: "c1",
          date: "2026-01-01",
          score: null,
          bedtimeMinutesLocal: 30,
          wakeMinutesLocal: 450,
        },
        {
          id: "c2",
          date: "2026-01-02",
          score: 0,
          bedtimeMinutesLocal: 1380,
          wakeMinutesLocal: 420,
        },
      ],
    },
    healthspan: {
      trend: [
        {
          id: "h1",
          date: "2026-01-01",
          healthAgeYears: null,
          ageDeltaYears: -1.5,
          paceOfAging: null,
        },
      ],
    },
    strain: {
      daily: [
        {
          id: "s1",
          date: "2026-01-01",
          score: 9.5,
          quality: { publishable: true },
        },
        {
          id: "s2",
          date: "2026-01-02",
          score: 4,
          quality: { publishable: false },
        },
        {
          id: "s3",
          date: "2026-01-03",
          score: null,
          quality: { publishable: true },
        },
      ],
    },
    recovery: {
      daily: [
        {
          id: "r1",
          date: "2026-01-01",
          score: 60,
          status: "partial",
          quality: { publishable: true },
        },
        {
          id: "r2",
          date: "2026-01-02",
          score: 70,
          status: "available",
          quality: { publishable: true },
        },
        {
          id: "r3",
          date: "2026-01-03",
          score: 55,
          status: "insufficient_data",
          quality: { publishable: true },
        },
        {
          id: "r4",
          date: "2026-01-04",
          score: 50,
          status: "partial",
          quality: { publishable: false },
        },
      ],
    },
    days: [
      {
        id: "day1",
        date: "2026-01-01",
        supportingMetrics: {
          respiratoryRate: value("AVAILABLE", 15.2),
          oxygenSaturation: value("PARTIAL", 94),
          skinTemperatureDeviation: value("MISSING", null),
          zone3AndAbove: value("AVAILABLE", 0),
        },
      },
      {
        id: "day2",
        date: "2026-01-02",
        supportingMetrics: {
          respiratoryRate: value("MISSING", null),
          oxygenSaturation: value("AVAILABLE", 97),
          skinTemperatureDeviation: value("AVAILABLE", null),
          zone3AndAbove: value("MISSING", null),
        },
      },
    ],
  };
}

void describe("adaptExploreSeries", () => {
  const series = adaptExploreSeries(analytics());

  void it("sorts each series by date", () => {
    assert.deepEqual(series.steps, [
      { date: "2026-01-01", value: 5000 },
      { date: "2026-01-02", value: 8000 },
    ]);
  });

  void it("drops null and non-finite values instead of zeroing them", () => {
    assert.deepEqual(series.restingHeartRate, []);
    assert.deepEqual(series.sleepConsistency, [
      { date: "2026-01-02", value: 0 },
    ]);
    assert.deepEqual(series.healthAge, []);
    assert.deepEqual(series.ageDelta, [{ date: "2026-01-01", value: -1.5 }]);
  });

  void it("keeps supporting metrics only when AVAILABLE, including real zeros", () => {
    assert.deepEqual(series.respiratoryRate, [
      { date: "2026-01-01", value: 15.2 },
    ]);
    assert.deepEqual(series.oxygenSaturation, [
      { date: "2026-01-02", value: 97 },
    ]);
    assert.deepEqual(series.skinTemperature, []);
    assert.deepEqual(series.zone3Minutes, [{ date: "2026-01-01", value: 0 }]);
  });

  void it("keeps strain only when publishable", () => {
    assert.deepEqual(series.strain, [{ date: "2026-01-01", value: 9.5 }]);
  });

  void it("keeps publishable recovery that is available or partial", () => {
    assert.deepEqual(series.recovery, [
      { date: "2026-01-01", value: 60 },
      { date: "2026-01-02", value: 70 },
    ]);
  });

  void it("maps sleep duration and debt from the debt rows", () => {
    assert.deepEqual(series.sleepDuration, [
      { date: "2026-01-01", value: 420 },
    ]);
    assert.deepEqual(series.sleepDebt, [{ date: "2026-01-01", value: 60 }]);
  });

  void it("unwraps after-midnight bedtimes and leaves wake times as-is", () => {
    assert.deepEqual(series.bedtime, [
      { date: "2026-01-01", value: 1470 },
      { date: "2026-01-02", value: 1380 },
    ]);
    assert.deepEqual(
      series.wakeTime.map((point) => point.value),
      [450, 420],
    );
  });
});

void describe("unwrapBedtime", () => {
  void it("moves times before noon past midnight", () => {
    assert.equal(unwrapBedtime(0), 1440);
    assert.equal(unwrapBedtime(719), 2159);
    assert.equal(unwrapBedtime(720), 720);
    assert.equal(unwrapBedtime(1410), 1410);
  });
});

void describe("exploreQueryRange / exploreWindow", () => {
  const now = new Date("2026-09-27T03:00:00Z"); // still 9/26 in Chicago

  void it("fetches everything for the unbounded range", () => {
    assert.equal(exploreQueryRange(null, now), null);
    assert.deepEqual(exploreWindow(null, "America/Chicago", now), {
      from: null,
      to: "2026-09-26",
    });
  });

  void it("pads the fetch for lag and time zones", () => {
    assert.deepEqual(exploreQueryRange(30, now), {
      start: "2026-08-20T00:00:00Z",
      endExclusive: "2026-09-29T00:00:00Z",
    });
  });

  void it("ends the window today in the account's zone", () => {
    assert.deepEqual(exploreWindow(30, "America/Chicago", now), {
      from: "2026-08-28",
      to: "2026-09-26",
    });
    assert.deepEqual(exploreWindow(1, "UTC", now), {
      from: "2026-09-27",
      to: "2026-09-27",
    });
  });
});
