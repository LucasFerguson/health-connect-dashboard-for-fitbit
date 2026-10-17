import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { METRICS, formatMetricValue } from "~/domain/exploreMetrics";
import { formatHrv, formatTemperatureDeviation } from "./metricFormatters";

void describe("formatTemperatureDeviation", () => {
  void it("always signs a deviation and rounds to tenths", () => {
    assert.equal(formatTemperatureDeviation(0.34), "+0.3 °C");
    assert.equal(formatTemperatureDeviation(-0.26), "−0.3 °C");
    assert.equal(formatTemperatureDeviation(1), "+1.0 °C");
  });

  void it("writes a value that rounds to zero without a sign", () => {
    assert.equal(formatTemperatureDeviation(0), "0.0 °C");
    assert.equal(formatTemperatureDeviation(-0.04), "0.0 °C");
  });
});

void describe("formatHrv", () => {
  void it("writes whole milliseconds", () => {
    assert.equal(formatHrv(42.4), "42 ms");
  });
});

void describe("explore skin temperature", () => {
  void it("is written as a signed deviation", () => {
    const metric = METRICS.skinTemperature;
    assert.equal(formatMetricValue(metric, 0.3), "+0.3°C");
    assert.equal(formatMetricValue(metric, -0.25), "−0.25°C");
    assert.equal(formatMetricValue(metric, -0.001), "0°C");
  });
});
