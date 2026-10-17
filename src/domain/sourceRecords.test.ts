import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatCelsius,
  formatDeltaCelsius,
  formatDeltaFahrenheit,
  formatDuration,
  formatFahrenheit,
  formatMeasurementLocation,
  formatMilliseconds,
  groupHrvByNight,
  hrvNightOf,
  hrvRecordsRange,
  median,
  parseHrvRecordsWindow,
  skinTemperatureRows,
  type SkinTemperatureSourceRecord,
} from "./sourceRecords";

const TZ = "America/Chicago";

void describe("temperature formatting", () => {
  void it("shows an implausible baseline as reported, in °C and °F", () => {
    assert.equal(formatCelsius(41.61033976670075), "41.61 °C");
    assert.equal(formatFahrenheit(41.61033976670075), "106.90 °F");
  });

  void it("renders a missing baseline as a dash, never 0", () => {
    assert.equal(formatCelsius(null), "—");
    assert.equal(formatFahrenheit(null), "—");
  });

  void it("converts a delta without the +32 offset and signs it", () => {
    assert.equal(formatDeltaCelsius(-0.03), "−0.03 °C");
    assert.equal(formatDeltaFahrenheit(-0.03), "−0.05 °F");
    assert.equal(formatDeltaCelsius(0.4474), "+0.45 °C");
    assert.equal(formatDeltaFahrenheit(0.4474), "+0.81 °F");
    assert.equal(formatDeltaCelsius(0), "0.00 °C");
  });
});

void describe("formatMeasurementLocation", () => {
  void it("shows the constant and its Health Connect meaning", () => {
    assert.equal(formatMeasurementLocation(0), "0 · Unknown");
    assert.equal(formatMeasurementLocation(3), "3 · Wrist");
  });

  void it("still shows a number Health Connect doesn't define", () => {
    assert.equal(
      formatMeasurementLocation(9),
      "9 · not a Health Connect value",
    );
  });

  void it("renders an absent location as a dash", () => {
    assert.equal(formatMeasurementLocation(null), "—");
  });
});

void describe("formatDuration", () => {
  void it("writes hours and minutes", () => {
    assert.equal(
      formatDuration("2026-09-19T09:41:00.000Z", "2026-09-19T14:49:00.000Z"),
      "5 h 8 min",
    );
    assert.equal(
      formatDuration("2026-09-19T09:41:00.000Z", "2026-09-19T10:26:00.000Z"),
      "45 min",
    );
  });
});

void describe("skinTemperatureRows", () => {
  const evening: SkinTemperatureSourceRecord = {
    id: "a",
    source: "com.fitbit.FitbitMobile",
    startAt: "2026-09-19T00:37:00.000Z",
    endAt: "2026-09-19T03:49:00.000Z",
    baselineCelsius: 41.61,
    deltas: [{ observedAt: "2026-09-19T00:37:00.000Z", celsius: 0.45 }],
    measurementLocation: 0,
  };
  const morning: SkinTemperatureSourceRecord = {
    id: "b",
    source: "com.fitbit.FitbitMobile",
    startAt: "2026-09-19T09:41:00.000Z",
    endAt: "2026-09-19T14:49:00.000Z",
    baselineCelsius: null,
    deltas: [
      { observedAt: "2026-09-19T12:00:00.000Z", celsius: 0.1 },
      { observedAt: "2026-09-19T09:41:00.000Z", celsius: -0.2 },
    ],
    measurementLocation: null,
  };

  void it("lists every record newest first, dated by local end date", () => {
    const rows = skinTemperatureRows([evening, morning], TZ);
    assert.deepEqual(
      rows.map((row) => [row.record.id, row.night, row.start, row.end]),
      [
        ["b", "2026-09-19", "4:41 AM", "9:49 AM"],
        ["a", "2026-09-18", "7:37 PM", "10:49 PM"],
      ],
    );
  });

  void it("keeps every delta in time order and dashes missing fields", () => {
    const [row] = skinTemperatureRows([morning], TZ);
    assert.deepEqual(
      row?.deltas.map((delta) => [delta.time, delta.celsius]),
      [
        ["4:41 AM", "−0.20 °C"],
        ["7:00 AM", "+0.10 °C"],
      ],
    );
    assert.equal(row?.baselineCelsius, "—");
    assert.equal(row?.measurementLocation, "—");
  });
});

void describe("hrvNightOf", () => {
  void it("puts readings on either side of midnight in the same night", () => {
    // 11:15 PM and 4:15 AM local, Chicago (CDT).
    assert.equal(hrvNightOf("2026-09-18T04:15:00.000Z", TZ), "2026-09-18");
    assert.equal(hrvNightOf("2026-09-18T09:15:00.000Z", TZ), "2026-09-18");
    // 11:59 AM belongs to that morning; 12:00 PM starts the next night.
    assert.equal(hrvNightOf("2026-09-18T16:59:00.000Z", TZ), "2026-09-18");
    assert.equal(hrvNightOf("2026-09-18T17:00:00.000Z", TZ), "2026-09-19");
  });
});

void describe("groupHrvByNight", () => {
  const reading = (id: string, observedAt: string, milliseconds: number) => ({
    id,
    source: "com.fitbit.FitbitMobile",
    observedAt,
    milliseconds,
  });

  void it("groups by wake date, newest first, with count/min/median/max", () => {
    const nights = groupHrvByNight(
      [
        reading("1", "2026-09-18T04:15:00.000Z", 196.2),
        reading("2", "2026-09-18T09:00:00.000Z", 120),
        reading("3", "2026-09-18T04:20:00.000Z", 18.3),
        reading("4", "2026-09-19T05:00:00.000Z", 131),
      ],
      TZ,
    );
    assert.deepEqual(
      nights.map((night) => [
        night.night,
        night.count,
        night.min,
        night.median,
        night.max,
      ]),
      [
        ["2026-09-19", 1, 131, 131, 131],
        ["2026-09-18", 3, 18.3, 120, 196.2],
      ],
    );
    assert.deepEqual(
      nights[1]?.readings.map((item) => item.id),
      ["1", "3", "2"],
    );
  });

  void it("keeps a 0 reading rather than dropping it", () => {
    const [night] = groupHrvByNight(
      [reading("z", "2026-09-18T04:15:00.000Z", 0)],
      TZ,
    );
    assert.equal(night?.count, 1);
    assert.equal(night?.min, 0);
  });

  void it("returns no nights for no readings", () => {
    assert.deepEqual(groupHrvByNight([], TZ), []);
  });
});

void describe("median", () => {
  void it("averages the middle pair of an even count", () => {
    assert.equal(median([4, 1, 3, 2]), 2.5);
  });
});

void describe("formatMilliseconds", () => {
  void it("keeps the reported tenth", () => {
    assert.equal(formatMilliseconds(196.2), "196.2 ms");
    assert.equal(formatMilliseconds(200), "200 ms");
  });
});

void describe("HRV records window", () => {
  void it("defaults to 30 days", () => {
    assert.equal(parseHrvRecordsWindow(undefined), "30");
    assert.equal(parseHrvRecordsWindow("bogus"), "30");
    assert.equal(parseHrvRecordsWindow("all"), "all");
  });

  void it("builds a TimeRange, or none for all history", () => {
    const now = new Date("2026-10-17T12:00:00.000Z");
    assert.deepEqual(hrvRecordsRange("30", now), {
      start: "2026-09-17T12:00:00.000Z",
      endExclusive: "2026-10-17T13:00:00.000Z",
    });
    assert.equal(hrvRecordsRange("all", now), null);
  });
});
