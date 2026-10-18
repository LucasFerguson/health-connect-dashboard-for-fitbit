"use client";

import { LazyECharts as ReactECharts } from "../ui/LazyECharts";
import {
  buildHrCandles,
  hrRampColorForMean,
} from "~/domain/dayViewPresentation";
import type { HeartRateTimeline } from "~/domain/dayView";
import type { HeartRateDetail } from "~/domain/heartRateDetail";
import {
  HR_RAMP,
  HR_RAMP_HEX,
  HR_SCALE_MAX,
  HR_SCALE_MIN,
  bpmToLanePercent,
} from "./timelineConstants";

export type HeartRateChartMode = "candles" | "line";

const MINUTES_PER_DAY = 24 * 60;

/**
 * HR lane. With `detail` (bucketed from the raw samples, see
 * `~/domain/heartRateDetail`) it draws either 5-minute candlesticks or a
 * 1-minute mean line, per `mode`. Without it, it falls back to the
 * backend's hourly candles from `timeline.heartRate.hours[]`. Candle wicks
 * span min→max and bodies the interquartile range p25→p75, colored from the
 * shared HR ramp by the bucket's mean. Empty buckets and hours whose
 * `status !== "available"` leave a gap rather than a fabricated value.
 */
export function HeartRateLane({
  heartRate,
  detail,
  mode,
  restingHeartRateBpm,
}: {
  heartRate: HeartRateTimeline;
  detail: HeartRateDetail | null;
  mode: HeartRateChartMode;
  /** Optional resting-HR reference line, from `supportingMetrics.restingHeartRate`
   * when displayable. */
  restingHeartRateBpm?: number | null;
}) {
  const candles = buildHrCandles(heartRate.hours);
  const hasAnyCandles = candles.length > 0 || detail !== null;
  const rhrPercent =
    restingHeartRateBpm !== null && restingHeartRateBpm !== undefined
      ? bpmToLanePercent(restingHeartRateBpm)
      : null;

  const option = detail
    ? mode === "line"
      ? lineOption(detail)
      : candleOption(
          detail.candles.map((candle) => ({
            slot: candle.minute / detail.candleMinutes,
            ...candle,
          })),
          MINUTES_PER_DAY / detail.candleMinutes,
        )
    : candleOption(
        candles.map((candle) => ({ slot: candle.hour, ...candle })),
        24,
      );

  return (
    <div className="relative min-h-0 flex-1">
      {/* Grid lines at 25/50/75% are drawn in plain CSS rather than echarts
          so they align exactly with the overlay lines drawn by
          TimelineOverlays, which share the same percentage math. */}
      <div className="border-ink-500 bg-ink-850 absolute inset-0 border-b border-l">
        <div className="bg-ink-600 absolute inset-x-0 top-1/4 h-px" />
        <div className="bg-ink-600 absolute inset-x-0 top-1/2 h-px" />
        <div className="bg-ink-600 absolute inset-x-0 top-3/4 h-px" />
        {rhrPercent !== null ? (
          <>
            <div
              className="bg-brand-400 absolute inset-x-0 h-px opacity-45"
              style={{ top: `${rhrPercent}%` }}
            />
            <span
              className="text-brand-400 absolute right-1 -translate-y-full font-mono text-[8px] tracking-[.06em] max-sm:text-[11px]"
              style={{ top: `${rhrPercent}%` }}
            >
              RHR {Math.round(restingHeartRateBpm ?? 0)}
            </span>
          </>
        ) : null}
        {!hasAnyCandles ? (
          <div className="text-ink-200 absolute inset-0 flex items-center justify-center px-4 text-center font-mono text-[9px] tracking-[.04em] max-sm:text-[11px]">
            {heartRate.note ?? "No hourly heart-rate data for this day."}
          </div>
        ) : (
          <ReactECharts
            option={option}
            style={{ height: "100%", width: "100%" }}
            opts={{ renderer: "svg" }}
          />
        )}
      </div>
    </div>
  );
}

const yAxis = {
  type: "value",
  min: HR_SCALE_MIN,
  max: HR_SCALE_MAX,
  show: false,
  splitLine: { show: false },
};
const grid = { left: 0, right: 0, top: 4, bottom: 4, containLabel: false };

/**
 * echarts' candlestick takes [open, close, low, high] per box; we pass
 * [p25, p75, min, max] so the body is the IQR and the wick the full range.
 * The x axis is a fixed grid of `slotCount` equal slots across the day, with
 * "-" in empty slots, so candles stay at their time of day and gaps show.
 */
function candleOption(
  candles: Array<{
    slot: number;
    min: number;
    p25: number;
    mean: number;
    p75: number;
    max: number;
  }>,
  slotCount: number,
) {
  const bySlot = new Map(candles.map((candle) => [candle.slot, candle]));
  const data = Array.from({ length: slotCount }, (_, slot) => {
    const candle = bySlot.get(slot);
    if (!candle) return { value: ["-", "-", "-", "-"] };
    const color = hrRampColorForMean(
      candle.mean,
      HR_RAMP,
      HR_SCALE_MIN,
      HR_SCALE_MAX,
    );
    return {
      value: [candle.p25, candle.p75, candle.min, candle.max],
      itemStyle: {
        color,
        color0: color,
        borderColor: color,
        borderColor0: color,
        // Hourly candles are wide enough for an outline; at 5 minutes
        // there are 288 of them and a 1px border would swallow the body.
        borderWidth: slotCount > 24 ? 0.5 : 1,
      },
    };
  });
  return {
    animation: false,
    backgroundColor: "transparent",
    grid,
    xAxis: {
      type: "category",
      data: Array.from({ length: slotCount }, (_, slot) => slot),
      show: false,
      boundaryGap: true,
    },
    yAxis,
    series: [{ type: "candlestick", data, barMaxWidth: 24 }],
  };
}

/**
 * The 1-minute means as a line on a 0-1440 minute axis, colored by bpm with
 * the same six-stop ramp (and the same cut points) as the candles. A gap of
 * more than `MAX_LINE_GAP_MINUTES` between points breaks the line instead of
 * drawing a straight run across missing data.
 */
const MAX_LINE_GAP_MINUTES = 5;

function lineOption(detail: HeartRateDetail) {
  const half = detail.lineMinutes / 2;
  const data: Array<[number, number] | [number, null]> = [];
  let previous: number | null = null;
  for (const point of detail.points) {
    if (previous !== null && point.minute - previous > MAX_LINE_GAP_MINUTES) {
      data.push([previous + half + 0.01, null]);
    }
    data.push([point.minute + half, point.mean]);
    previous = point.minute;
  }
  const step = (HR_SCALE_MAX - HR_SCALE_MIN) / HR_RAMP_HEX.length;
  return {
    animation: false,
    backgroundColor: "transparent",
    grid,
    xAxis: { type: "value", min: 0, max: MINUTES_PER_DAY, show: false },
    yAxis,
    visualMap: {
      show: false,
      type: "piecewise",
      dimension: 1,
      pieces: HR_RAMP_HEX.map((color, index) => ({
        ...(index > 0 ? { gte: HR_SCALE_MIN + step * index } : {}),
        ...(index < HR_RAMP_HEX.length - 1
          ? { lt: HR_SCALE_MIN + step * (index + 1) }
          : {}),
        color,
      })),
    },
    series: [
      {
        type: "line",
        data,
        showSymbol: false,
        connectNulls: false,
        lineStyle: { width: 1.25 },
      },
    ],
  };
}
