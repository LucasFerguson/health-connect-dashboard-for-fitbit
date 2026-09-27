import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  axisStartMs,
  formatClock,
  formatClockMinutes,
  formatHourLabel,
  percentToClockLabel,
  percentToInstantMs,
  slotHourLabel,
  timeToPercent,
} from "./dayViewTime";

void describe("formatClockMinutes", () => {
  void it("uses 12-hour AM/PM and drops :00 on whole hours", () => {
    assert.equal(formatClockMinutes(0), "12 AM");
    assert.equal(formatClockMinutes(2 * 60), "2 AM");
    assert.equal(formatClockMinutes(6 * 60 + 30), "6:30 AM");
    assert.equal(formatClockMinutes(12 * 60), "12 PM");
    assert.equal(formatClockMinutes(12 * 60 + 5), "12:05 PM");
    assert.equal(formatClockMinutes(22 * 60), "10 PM");
    assert.equal(formatClockMinutes(23 * 60 + 59), "11:59 PM");
  });

  void it("wraps values outside one day", () => {
    assert.equal(formatClockMinutes(24 * 60), "12 AM");
    assert.equal(formatClockMinutes(25 * 60 + 15), "1:15 AM");
    assert.equal(formatClockMinutes(-60), "11 PM");
  });
});

void describe("hour labels", () => {
  void it("formats clock hours", () => {
    assert.equal(formatHourLabel(0), "12 AM");
    assert.equal(formatHourLabel(13), "1 PM");
  });

  void it("accounts for the day-start pivot", () => {
    assert.equal(slotHourLabel(2, 0), "2 AM");
    assert.equal(slotHourLabel(0, 18), "6 PM");
    assert.equal(slotHourLabel(8, 18), "2 AM");
  });
});

void describe("formatClock", () => {
  void it("renders in the given zone, not UTC", () => {
    const iso = "2026-01-15T08:41:00Z";
    assert.equal(formatClock(iso, "UTC"), "8:41 AM");
    assert.equal(formatClock(iso, "America/New_York"), "3:41 AM");
    assert.equal(formatClock(iso, "Asia/Tokyo"), "5:41 PM");
  });

  void it("accepts epoch ms", () => {
    assert.equal(
      formatClock(Date.parse("2026-01-15T22:00:00Z"), "UTC"),
      "10 PM",
    );
  });
});

void describe("percent <-> instant", () => {
  void it("labels axis positions", () => {
    assert.equal(percentToClockLabel(0, 0), "12 AM");
    assert.equal(percentToClockLabel(12.5, 0), "3 AM");
    assert.equal(percentToClockLabel(50, 18), "6 AM");
  });

  void it("maps a percent back to the instant timeToPercent came from", () => {
    const zone = "America/Los_Angeles";
    const ms = percentToInstantMs(12.5, "2026-07-01", 0, zone);
    assert.equal(ms, axisStartMs("2026-07-01", 0, zone) + 3 * 3_600_000);
    assert.equal(formatClock(ms, zone), "3 AM");
    assert.equal(
      timeToPercent(new Date(ms).toISOString(), "2026-07-01", 0, zone),
      12.5,
    );
  });
});
