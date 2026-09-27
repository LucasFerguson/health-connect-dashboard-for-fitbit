import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_SELECTION,
  exploreSearch,
  parseExploreParams,
  rangeDays,
  resolveSelection,
} from "./exploreParams";
import {
  METRICS,
  describeDifference,
  formatClock,
  formatMetricAxis,
  formatMetricDelta,
  formatMetricValue,
  formatSlopeStep,
  habitMetric,
} from "./exploreMetrics";

void describe("parseExploreParams", () => {
  void it("defaults an empty query", () => {
    assert.deepEqual(parseExploreParams({}), DEFAULT_SELECTION);
  });

  void it("round-trips through exploreSearch", () => {
    const selection = {
      x: "restingHeartRate",
      y: "heartRateVariability",
      mode: "line",
      lag: -3,
      range: "all",
    } as const;
    const search = exploreSearch(selection);
    assert.equal(
      search,
      "x=restingHeartRate&y=heartRateVariability&mode=line&lag=-3&range=all",
    );
    assert.deepEqual(
      parseExploreParams(new URLSearchParams(search)),
      selection,
    );
  });

  void it("falls back per key on bad input and clamps the lag", () => {
    assert.deepEqual(
      parseExploreParams({
        x: "nope",
        y: "bedtime",
        mode: "pie",
        lag: "12",
        range: "7",
      }),
      { ...DEFAULT_SELECTION, y: "bedtime", lag: 7 },
    );
    assert.equal(parseExploreParams({ lag: "-40" }).lag, -7);
    assert.equal(parseExploreParams({ lag: "1.5" }).lag, 0);
    assert.equal(parseExploreParams({ lag: "+2" }).lag, 2);
  });

  void it("reads the first of repeated params", () => {
    assert.equal(parseExploreParams({ x: ["weight", "steps"] }).x, "weight");
  });

  void it("maps ranges to days", () => {
    assert.equal(rangeDays("30"), 30);
    assert.equal(rangeDays("365"), 365);
    assert.equal(rangeDays("all"), null);
  });
});

void describe("explore metric formatting", () => {
  void it("formats clock minutes as AM/PM, folding unwrapped bedtimes", () => {
    assert.equal(formatClock(0), "12:00 AM");
    assert.equal(formatClock(1410), "11:30 PM");
    assert.equal(formatClock(1470), "12:30 AM");
    assert.equal(formatClock(720), "12:00 PM");
    assert.equal(formatClock(425.4), "7:05 AM");
    assert.equal(formatMetricValue(METRICS.bedtime, 1530), "1:30 AM");
    assert.equal(formatMetricAxis(METRICS.bedtime, 1440), "12 AM");
  });

  void it("formats durations and numbers with units", () => {
    assert.equal(formatMetricValue(METRICS.sleepDuration, 432), "7h 12m");
    assert.equal(formatMetricValue(METRICS.steps, 12345.6), "12,346 steps");
    assert.equal(formatMetricValue(METRICS.oxygenSaturation, 96), "96%");
    assert.equal(formatMetricValue(METRICS.restingHeartRate, 52), "52 bpm");
    assert.equal(formatMetricAxis(METRICS.sleepDuration, 450), "7.5h");
  });

  void it("formats signed deltas and slope steps", () => {
    assert.equal(formatMetricDelta(METRICS.sleepDuration, -15.2), "−15m");
    assert.equal(formatMetricDelta(METRICS.restingHeartRate, 1.26), "+1.3 bpm");
    assert.equal(formatMetricDelta(METRICS.strain, 0), "±0");
    assert.equal(formatSlopeStep(METRICS.steps), "1,000 steps");
    assert.equal(formatSlopeStep(METRICS.bedtime), "1h");
    assert.equal(formatSlopeStep(METRICS.strain), "1 point");
    assert.equal(formatSlopeStep(METRICS.recovery), "10 points");
  });
});

void describe("habit axes in the URL", () => {
  void it("accepts habit ids syntactically and resolves unknown ones", () => {
    const parsed = parseExploreParams({
      x: "habit:whoop:abc",
      y: "habit:whoop:gone",
    });
    assert.equal(parsed.x, "habit:whoop:abc");
    assert.equal(parseExploreParams({ x: "habit:" }).x, DEFAULT_SELECTION.x);
    const resolved = resolveSelection(parsed, (id) => id === "habit:whoop:abc");
    assert.equal(resolved.x, "habit:whoop:abc");
    assert.equal(resolved.y, DEFAULT_SELECTION.y);
  });

  void it("formats binary values and group differences", () => {
    const habit = habitMetric({
      id: "whoop:abc",
      question: "Consumed caffeine?",
      firstSeenDate: "2026-01-09",
      lastSeenDate: "2026-04-08",
      entryCount: 19,
    });
    assert.equal(habit.id, "habit:whoop:abc");
    assert.equal(habit.kind, "binary");
    assert.match(habit.note, /Jan 9 – Apr 8, 2026/);
    assert.equal(formatMetricValue(habit, 1), "Yes");
    assert.equal(formatMetricValue(habit, 0), "No");
    assert.deepEqual(describeDifference(METRICS.sleepDuration, -38), {
      amount: "38m",
      word: "shorter",
    });
    assert.deepEqual(describeDifference(METRICS.bedtime, 45), {
      amount: "45m",
      word: "later",
    });
    assert.deepEqual(describeDifference(METRICS.restingHeartRate, 1.25), {
      amount: "1.3 bpm",
      word: "higher",
    });
    assert.equal(describeDifference(METRICS.steps, 0).word, null);
  });
});
