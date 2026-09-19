"use client";

import { LazyECharts as ReactECharts } from "../ui/LazyECharts";
import {
  buildHrCandles,
  hrRampColorForMean,
} from "~/domain/dayViewPresentation";
import type { HeartRateTimeline } from "~/server/health/dayAnalyticsSchema";
import {
  HR_RAMP,
  HR_SCALE_MAX,
  HR_SCALE_MIN,
  bpmToLanePercent,
} from "./timelineConstants";

/**
 * HR candlesticks lane, built from `timeline.heartRate.hours[]` — real
 * hourly min/p25/mean/p75/max aggregates now that the backend computes
 * them (requirement #5). Wick spans min→max; body spans the interquartile
 * range p25→p75; color comes from the shared HR ramp keyed by the hour's
 * mean. Hours with `status !== "available"` are skipped, leaving a gap in
 * the lane rather than a fabricated candle.
 */
export function HeartRateLane({
  heartRate,
  restingHeartRateBpm,
}: {
  heartRate: HeartRateTimeline;
  /** Optional resting-HR reference line, from `supportingMetrics.restingHeartRate`
   * when displayable. */
  restingHeartRateBpm?: number | null;
}) {
  const candles = buildHrCandles(heartRate.hours);
  const hasAnyCandles = candles.length > 0;
  const rhrPercent =
    restingHeartRateBpm !== null && restingHeartRateBpm !== undefined
      ? bpmToLanePercent(restingHeartRateBpm)
      : null;

  // echarts candlestick series expects [open, close, low, high] per box;
  // we map that to [p25, p75, min, max] so the body renders as the IQR and
  // the wick as the full min-max range, per requirement #5. Missing hours
  // are represented as "-" so the category axis stays a stable 0-23 grid
  // with a visible gap rather than a compressed/reindexed series.
  const seriesData = Array.from({ length: 24 }, (_, hour) => {
    const candle = candles.find((c) => c.hour === hour);
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
      },
    };
  });

  const option = {
    animation: false,
    backgroundColor: "transparent",
    grid: { left: 0, right: 0, top: 4, bottom: 4, containLabel: false },
    xAxis: {
      type: "category",
      data: Array.from({ length: 24 }, (_, hour) => hour),
      show: false,
      boundaryGap: true,
    },
    yAxis: {
      type: "value",
      min: HR_SCALE_MIN,
      max: HR_SCALE_MAX,
      show: false,
      splitLine: { show: false },
    },
    series: [
      {
        type: "candlestick",
        data: seriesData,
      },
    ],
  };

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
              className="text-brand-400 absolute right-1 -translate-y-full font-mono text-[8px] tracking-[.06em]"
              style={{ top: `${rhrPercent}%` }}
            >
              RHR {Math.round(restingHeartRateBpm ?? 0)}
            </span>
          </>
        ) : null}
        {!hasAnyCandles ? (
          <div className="text-ink-200 absolute inset-0 flex items-center justify-center px-4 text-center font-mono text-[9px] tracking-[.04em]">
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
