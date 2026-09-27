import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_SELECTION,
  exploreSearch,
  parseExploreParams,
  rangeDays,
} from "./exploreParams";
import {
  METRICS,
  formatClock,
  formatMetricAxis,
  formatMetricDelta,
  formatMetricValue,
  formatSlopeStep,
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
