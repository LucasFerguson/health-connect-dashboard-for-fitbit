/**
 * Fine-grained heart-rate series for the day view's HR lane, built from the
 * raw `sourceRecords.heartRate` samples. The backend's `timeline.heartRate`
 * only has hourly candles; this buckets the same day's samples into
 * `CANDLE_MINUTES` candles (min/p25/mean/p75/max) and `LINE_MINUTES` mean
 * points for the line view.
 *
 * Like the backend's hourly candles (`_hourly_heart_rate` in HCGateway's
 * `day_dashboard.py`), only the source with the most samples that day is
 * used, so two apps recording the same heartbeat don't get blended.
 */

export const CANDLE_MINUTES = 5;
export const LINE_MINUTES = 1;
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

export interface HeartRatePoint {
  /** Minutes from the axis start to the start of this bucket. */
  minute: number;
  mean: number;
}

export interface HeartRateDetail {
  source: string;
  sampleCount: number;
  candleMinutes: number;
  lineMinutes: number;
  candles: HeartRateCandle[];
  points: HeartRatePoint[];
}

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
    lineMinutes: LINE_MINUTES,
    candles: bucket(samples, CANDLE_MINUTES).map(([minute, values]) => {
      values.sort((a, b) => a - b);
      return {
        minute,
        min: values[0]!,
        p25: quantile(values, 0.25),
        mean: values.reduce((sum, value) => sum + value, 0) / values.length,
        p75: quantile(values, 0.75),
        max: values[values.length - 1]!,
        sampleCount: values.length,
      };
    }),
    points: bucket(samples, LINE_MINUTES).map(([minute, values]) => ({
      minute,
      mean: values.reduce((sum, value) => sum + value, 0) / values.length,
    })),
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
