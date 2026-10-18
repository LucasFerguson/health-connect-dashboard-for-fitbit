import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildHeartRateDetail, nearestSample } from "./heartRateDetail";

const START = Date.parse("2026-10-17T04:00:00Z");
const at = (minutes: number) =>
  new Date(START + minutes * 60_000).toISOString();

void describe("buildHeartRateDetail", () => {
  void it("buckets samples into 5-minute candles and keeps every sample", () => {
    const detail = buildHeartRateDetail(
      [
        {
          source: "com.fitbit.FitbitMobile",
          samples: [
            { observedAt: at(0), bpm: 60 },
            { observedAt: at(0.5), bpm: 70 },
            { observedAt: at(2), bpm: 80 },
            { observedAt: at(4.9), bpm: 90 },
            { observedAt: at(12), bpm: 100 },
          ],
        },
      ],
      START,
    )!;
    assert.equal(detail.sampleCount, 5);
    assert.deepEqual(
      detail.candles.map((candle) => candle.minute),
      [0, 10],
    );
    const first = detail.candles[0]!;
    assert.equal(first.min, 60);
    assert.equal(first.max, 90);
    assert.equal(first.mean, 75);
    assert.equal(first.p25, 67.5);
    assert.equal(first.p75, 82.5);
    assert.deepEqual(detail.samples, [
      [0, 60],
      [30, 70],
      [120, 80],
      [294, 90],
      [720, 100],
    ]);
  });

  void it("keeps only the source with the most samples", () => {
    const detail = buildHeartRateDetail(
      [
        { source: "a", samples: [{ observedAt: at(1), bpm: 50 }] },
        {
          source: "b",
          samples: [
            { observedAt: at(1), bpm: 70 },
            { observedAt: at(2), bpm: 72 },
          ],
        },
      ],
      START,
    )!;
    assert.equal(detail.source, "b");
    assert.equal(detail.sampleCount, 2);
  });

  void it("drops samples outside the day and zero-bpm placeholders", () => {
    const detail = buildHeartRateDetail(
      [
        {
          source: "a",
          samples: [
            { observedAt: at(-1), bpm: 60 },
            { observedAt: at(24 * 60), bpm: 60 },
            { observedAt: at(30), bpm: 0 },
          ],
        },
      ],
      START,
    );
    assert.equal(detail, null);
  });
});

void describe("nearestSample", () => {
  const samples: Array<[number, number]> = [
    [0, 60],
    [10, 62],
    [500, 90],
  ];
  void it("finds the closest sample on either side", () => {
    assert.deepEqual(nearestSample(samples, 4), [0, 60]);
    assert.deepEqual(nearestSample(samples, 6), [10, 62]);
    assert.deepEqual(nearestSample(samples, 480), [500, 90]);
  });
  void it("returns null across a gap wider than the limit", () => {
    assert.equal(nearestSample(samples, 250), null);
    assert.equal(nearestSample([], 0), null);
  });
});
