import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  dailyChartWindow,
  shortDateLabel,
  shortMonthLabel,
} from "./metricChartWindow";

function consecutiveDates(start: string, count: number): string[] {
  const first = Date.parse(`${start}T00:00:00Z`);
  return Array.from({ length: count }, (_, index) =>
    new Date(first + index * 86_400_000).toISOString().slice(0, 10),
  );
}

void describe("dailyChartWindow", () => {
  void it("shows everything on wide screens", () => {
    assert.equal(
      dailyChartWindow(consecutiveDates("2025-01-01", 640), false),
      null,
    );
  });

  void it("opens on the last 90 calendar days on a phone", () => {
    const dates = consecutiveDates("2025-01-01", 640);
    const window = dailyChartWindow(dates, true);
    // 639 − 550 + 1 = 90 days on screen.
    assert.deepEqual(window, { startValue: 550, endValue: 639 });
  });

  void it("counts calendar days, not recorded days, across gaps", () => {
    const dates = ["2026-01-01", "2026-06-01", "2026-09-01", "2026-09-30"];
    assert.deepEqual(dailyChartWindow(dates, true), {
      startValue: 2,
      endValue: 3,
    });
  });

  void it("shows the full range when the history is already short", () => {
    assert.equal(
      dailyChartWindow(consecutiveDates("2026-08-01", 60), true),
      null,
    );
    assert.equal(dailyChartWindow([], true), null);
  });
});

void describe("short axis labels", () => {
  void it("abbreviates ISO dates and months", () => {
    assert.equal(shortDateLabel("2026-10-08"), "Oct 8");
    assert.equal(shortMonthLabel("2025-01"), "Jan ’25");
  });

  void it("leaves other values alone", () => {
    assert.equal(shortDateLabel("Week 3"), "Week 3");
    assert.equal(shortMonthLabel("2025-13"), "2025-13");
  });
});
