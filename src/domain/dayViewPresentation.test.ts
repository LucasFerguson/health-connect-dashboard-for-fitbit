import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { HeartRateHour, NearbyDay, SyncStatus } from "~/domain/dayView";
import {
  absenceReason,
  buildDayStripCells,
  buildHrCandles,
  describeSyncStatus,
  formatRelativeTime,
  hrRampColorForMean,
  isDisplayableStatus,
} from "./dayViewPresentation";

void describe("isDisplayableStatus", () => {
  void it("treats available and partial as displayable", () => {
    assert.equal(isDisplayableStatus("available"), true);
    assert.equal(isDisplayableStatus("partial"), true);
  });

  void it("treats every other status as not displayable", () => {
    assert.equal(isDisplayableStatus("missing"), false);
    assert.equal(isDisplayableStatus("insufficient_data"), false);
    assert.equal(isDisplayableStatus("not_implemented"), false);
    assert.equal(isDisplayableStatus("blocked"), false);
    assert.equal(isDisplayableStatus("unavailable"), false);
    assert.equal(isDisplayableStatus("sample_time_only"), false);
  });
});

void describe("absenceReason", () => {
  void it("prefers the API's own note when present", () => {
    assert.equal(
      absenceReason("missing", "No sleep recorded for this day."),
      "No sleep recorded for this day.",
    );
  });

  void it("falls back to a generic label per status when note is absent", () => {
    assert.equal(absenceReason("missing", null), "No data recorded.");
    assert.equal(absenceReason("missing", undefined), "No data recorded.");
    assert.equal(
      absenceReason("insufficient_data", null),
      "Not enough data yet.",
    );
    assert.equal(absenceReason("not_implemented", null), "Not available.");
    assert.equal(absenceReason("blocked", null), "Unavailable.");
  });
});

function hour(overrides: Partial<HeartRateHour>): HeartRateHour {
  return {
    hour: 0,
    status: "available",
    sampleCount: 10,
    min: 50,
    p25: 55,
    mean: 60,
    p75: 65,
    max: 70,
    ...overrides,
  };
}

void describe("buildHrCandles", () => {
  void it("maps available hours to candle geometry", () => {
    const candles = buildHrCandles([hour({ hour: 3 })]);
    assert.equal(candles.length, 1);
    assert.deepEqual(candles[0], {
      hour: 3,
      min: 50,
      max: 70,
      p25: 55,
      p75: 65,
      mean: 60,
      sampleCount: 10,
    });
  });

  void it("skips hours with status !== available (gap in the lane)", () => {
    const candles = buildHrCandles([
      hour({
        hour: 1,
        status: "missing",
        min: null,
        max: null,
        p25: null,
        p75: null,
        mean: null,
        sampleCount: 0,
      }),
      hour({ hour: 2 }),
    ]);
    assert.equal(candles.length, 1);
    assert.equal(candles[0]?.hour, 2);
  });

  void it("skips an available hour that is nonetheless missing a required numeric field", () => {
    const candles = buildHrCandles([hour({ hour: 5, p25: null })]);
    assert.equal(candles.length, 0);
  });

  void it("falls back mean to the IQR midpoint when mean is null but available", () => {
    const candles = buildHrCandles([hour({ hour: 4, mean: null })]);
    assert.equal(candles[0]?.mean, 60); // (55 + 65) / 2
  });
});

void describe("hrRampColorForMean", () => {
  const ramp = ["a", "b", "c", "d", "e"];

  void it("picks the lowest stop at the scale minimum", () => {
    assert.equal(hrRampColorForMean(40, ramp, 40, 180), "a");
  });

  void it("picks the highest stop at or above the scale maximum", () => {
    assert.equal(hrRampColorForMean(180, ramp, 40, 180), "e");
    assert.equal(hrRampColorForMean(999, ramp, 40, 180), "e");
  });

  void it("clamps below the minimum to the lowest stop", () => {
    assert.equal(hrRampColorForMean(0, ramp, 40, 180), "a");
  });

  void it("picks a middle stop proportionally", () => {
    // midpoint of [40,180] is 110 -> fraction .5 -> index floor(2.5) = 2
    assert.equal(hrRampColorForMean(110, ramp, 40, 180), "c");
  });
});

function nearbyDay(
  date: string,
  overrides: Partial<NearbyDay> = {},
): NearbyDay {
  return {
    date,
    dayState: "recorded",
    sleepDuration: {
      status: "missing",
      value: null,
    },
    strain: {
      status: "missing",
      value: null,
    },
    ...overrides,
  };
}

void describe("buildDayStripCells", () => {
  void it("returns exactly 15 cells for a full radius=7 nearbyDays window, sorted and including selected", () => {
    const days: NearbyDay[] = [];
    for (let offset = -7; offset <= 7; offset++) {
      const d = new Date(
        Date.parse("2026-08-15T00:00:00Z") + offset * 86_400_000,
      )
        .toISOString()
        .slice(0, 10);
      days.push(nearbyDay(d));
    }
    // shuffle input order to prove sorting works
    const shuffled = [...days].reverse();
    const cells = buildDayStripCells(shuffled, "2026-08-15");
    assert.equal(cells.length, 15);
    assert.equal(cells[0]?.date, "2026-08-08");
    assert.equal(cells[14]?.date, "2026-08-22");
    const selected = cells.filter((c) => c.isSelected);
    assert.equal(selected.length, 1);
    assert.equal(selected[0]?.date, "2026-08-15");
  });

  void it("marks future days and computes sleep/strain fractions only for displayable statuses", () => {
    const days = [
      nearbyDay("2026-08-14", {
        sleepDuration: {
          status: "available",
          value: 240,
        },
        strain: {
          status: "available",
          value: 10.5,
        },
      }),
      nearbyDay("2026-08-16", { dayState: "future" }),
    ];
    const cells = buildDayStripCells(days, "2026-08-14");
    const recorded = cells.find((c) => c.date === "2026-08-14")!;
    assert.equal(recorded.sleepFraction, 0.5); // 240/480
    assert.ok(
      recorded.strainFraction &&
        Math.abs(recorded.strainFraction - 0.5) < 0.001,
    );
    assert.equal(recorded.isFuture, false);

    const future = cells.find((c) => c.date === "2026-08-16")!;
    assert.equal(future.isFuture, true);
    assert.equal(future.sleepFraction, null);
    assert.equal(future.strainFraction, null);
  });

  void it("draws no bars for a date the backend has no stored day for", () => {
    const cells = buildDayStripCells(
      [nearbyDay("2026-08-14", { sleepDuration: null, strain: null })],
      "2026-08-15",
    );
    assert.equal(cells[0]?.sleepFraction, null);
    assert.equal(cells[0]?.strainFraction, null);
  });

  void it("clamps fractions to a max of 1", () => {
    const days = [
      nearbyDay("2026-08-14", {
        sleepDuration: {
          status: "available",
          value: 900,
        },
        strain: {
          status: "partial",
          value: 30,
        },
      }),
    ];
    const cells = buildDayStripCells(days, "2026-08-14");
    assert.equal(cells[0]?.sleepFraction, 1);
    assert.equal(cells[0]?.strainFraction, 1);
  });
});

function syncStatus(overrides: Partial<SyncStatus>): SyncStatus {
  return {
    observedActive: false,
    state: "never_observed",
    lastUploadAt: null,
    activeUntil: null,
    secondsSinceLastUpload: null,
    lastRecordType: null,
    lastRecordCount: null,
    totalUploadRequests: 0,
    totalRecordsReceived: 0,
    activityWindowSeconds: 120,
    note: "",
    ...overrides,
  };
}

void describe("formatRelativeTime", () => {
  const now = new Date("2026-08-24T12:00:00Z");

  void it("renders very recent times as just now", () => {
    assert.equal(formatRelativeTime("2026-08-24T11:59:50Z", now), "just now");
  });

  void it("renders minutes ago", () => {
    assert.equal(formatRelativeTime("2026-08-24T11:55:00Z", now), "5m ago");
  });

  void it("renders hours ago", () => {
    assert.equal(formatRelativeTime("2026-08-24T09:00:00Z", now), "3h ago");
  });

  void it("renders days ago", () => {
    assert.equal(formatRelativeTime("2026-08-12T12:00:00Z", now), "12d ago");
  });
});

void describe("describeSyncStatus", () => {
  const now = new Date("2026-08-24T12:00:00Z");

  void it("covers the receiving state with a detail", () => {
    const result = describeSyncStatus(
      syncStatus({ state: "receiving", lastUploadAt: "2026-08-24T11:59:30Z" }),
      now,
    );
    assert.equal(result.label, "RECEIVING");
    assert.equal(result.detail, "just now");
  });

  void it("covers the idle state with a detail", () => {
    const result = describeSyncStatus(
      syncStatus({ state: "idle", lastUploadAt: "2026-08-24T09:00:00Z" }),
      now,
    );
    assert.equal(result.label, "IDLE");
    assert.equal(result.detail, "3h ago");
  });

  void it("covers never_observed with no detail even if lastUploadAt were somehow set", () => {
    const result = describeSyncStatus(
      syncStatus({ state: "never_observed", lastUploadAt: null }),
      now,
    );
    assert.equal(result.label, "NEVER SYNCED");
    assert.equal(result.detail, null);
  });
});
