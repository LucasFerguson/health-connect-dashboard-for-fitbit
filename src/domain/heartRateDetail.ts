/**
 * Fine-grained heart-rate series for the day view's HR lane, built from the
 * raw `sourceRecords.heartRate` samples. The backend's `timeline.heartRate`
 * only has hourly candles; this keeps every sample of the day for the line
 * view (Fitbit writes one every few seconds) and buckets them into
 * `CANDLE_MINUTES` candles (min/p25/mean/p75/max) for the candle view.
 *
 * Like the backend's hourly candles (`_hourly_heart_rate` in HCGateway's
 * `day_dashboard.py`), only the source with the most samples that day is
 * used, so two apps recording the same heartbeat don't get blended.
 */

export const CANDLE_MINUTES = 5;
const MINUTES_PER_DAY = 24 * 60;

export interface HeartRateSampleInput {
  observedAt: string;
  bpm: number;
}

export interface HeartRateRecordInput {
  source: string;
  samples: HeartRateSampleInput[];
}

export interface HeartRateCandle {
  /** Minutes from the axis start to the start of this bucket. */
  minute: number;
  min: number;
  p25: number;
  mean: number;
  p75: number;
  max: number;
  sampleCount: number;
}

/** One raw sample: [seconds from the axis start, bpm]. Tuples rather than
 * objects keep the ~28k samples of a day small on the way to the browser. */
export type HeartRateSamplePoint = [second: number, bpm: number];

export interface HeartRateDetail {
  source: string;
  sampleCount: number;
  candleMinutes: number;
  candles: HeartRateCandle[];
  /** Every sample from `source`, oldest first. */
  samples: HeartRateSamplePoint[];
}

const roundTenth = (value: number) => Math.round(value * 10) / 10;

/** Linear-interpolated quantile of an ascending-sorted array. */
function quantile(sorted: number[], q: number): number {
  const position = (sorted.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  const weight = position - lower;
  return sorted[lower]! * (1 - weight) + sorted[upper]! * weight;
}

/**
 * Buckets the samples falling inside `[axisStartMs, axisStartMs + 24h)`.
 * Returns null when there are no usable samples, so the lane can fall back
 * to the backend's hourly candles.
 */
export function buildHeartRateDetail(
  records: HeartRateRecordInput[],
  axisStartMs: number,
): HeartRateDetail | null {
  const axisEndMs = axisStartMs + MINUTES_PER_DAY * 60_000;
  const bySource = new Map<string, Array<{ minute: number; bpm: number }>>();
  for (const record of records) {
    for (const sample of record.samples) {
      const at = Date.parse(sample.observedAt);
      if (!Number.isFinite(at) || at < axisStartMs || at >= axisEndMs) continue;
      // HCGateway's reader turns a sample with no bpm into 0; that's a
      // missing reading, not a heartbeat of zero.
      if (!Number.isFinite(sample.bpm) || sample.bpm <= 0) continue;
      const list = bySource.get(record.source) ?? [];
      list.push({ minute: (at - axisStartMs) / 60_000, bpm: sample.bpm });
      bySource.set(record.source, list);
    }
  }

  let source: string | null = null;
  let samples: Array<{ minute: number; bpm: number }> = [];
  for (const [name, list] of bySource) {
    if (list.length > samples.length) {
      source = name;
      samples = list;
    }
  }
  if (source === null || samples.length === 0) return null;

  return {
    source,
    sampleCount: samples.length,
    candleMinutes: CANDLE_MINUTES,
    candles: bucket(samples, CANDLE_MINUTES).map(([minute, values]) => {
      values.sort((a, b) => a - b);
      return {
        minute,
        min: values[0]!,
        // Tenths are plenty on a 40-180 bpm lane and keep the payload small.
        p25: roundTenth(quantile(values, 0.25)),
        mean: roundTenth(
          values.reduce((sum, value) => sum + value, 0) / values.length,
        ),
        p75: roundTenth(quantile(values, 0.75)),
        max: values[values.length - 1]!,
        sampleCount: values.length,
      };
    }),
    samples: samples
      .map(
        ({ minute, bpm }): HeartRateSamplePoint => [
          Math.round(minute * 60),
          bpm,
        ],
      )
      .sort((a, b) => a[0] - b[0]),
  };
}

/** Groups samples into fixed-width buckets, oldest first; empty buckets are
 * left out so the chart shows a gap, never a made-up value. */
function bucket(
  samples: Array<{ minute: number; bpm: number }>,
  width: number,
): Array<[number, number[]]> {
  const buckets = new Map<number, number[]>();
  for (const { minute, bpm } of samples) {
    const start = Math.floor(minute / width) * width;
    const list = buckets.get(start) ?? [];
    list.push(bpm);
    buckets.set(start, list);
  }
  return [...buckets.entries()].sort((a, b) => a[0] - b[0]);
}

/** The sample nearest `second` (from the axis start), if one is within
 * `maxGapSeconds`; for the timeline's hover readout. Binary search, since
 * `samples` is sorted. */
export function nearestSample(
  samples: HeartRateSamplePoint[],
  second: number,
  maxGapSeconds = 60,
): HeartRateSamplePoint | null {
  let low = 0;
  let high = samples.length - 1;
  while (low < high) {
    const middle = (low + high) >> 1;
    if (samples[middle]![0] < second) low = middle + 1;
    else high = middle;
  }
  let best: HeartRateSamplePoint | null = null;
  for (const index of [low - 1, low]) {
    const sample = samples[index];
    if (!sample) continue;
    if (!best || Math.abs(sample[0] - second) < Math.abs(best[0] - second)) {
      best = sample;
    }
  }
  return best && Math.abs(best[0] - second) <= maxGapSeconds ? best : null;
}
