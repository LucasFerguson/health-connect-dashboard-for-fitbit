"use client";

import ReactECharts from "echarts-for-react";
import {
  HR_SCALE_MAX,
  HR_SCALE_MIN,
  bpmToLanePercent,
} from "./timelineConstants";

/** One hour's HR aggregate — min/max/p25/p75/mean — the shape a real
 * candlestick data source would provide. This app has no hourly HR
 * pipeline today (only a single daily resting-HR value), so `candles` is
 * always undefined at the moment; the prop exists so wiring in real data
 * later is a data change, not a rewrite of this component. */
export interface HourlyHrCandle {
  hourStartIso: string;
  min: number;
  p25: number;
  p75: number;
  max: number;
  mean: number;
}

/**
 * HR candlesticks lane. Hourly min/max/p25/p75 aggregates don't exist in
 * this app's backend yet (resting heart rate is a single daily value), so
 * this renders the honest lane frame — axis, grid lines, and the resting-HR
 * reference line from real daily data when available — with no synthesized
 * per-hour candles. Pass `candles` once an hourly HR pipeline exists; the
 * echarts option below is already shaped to draw a candlestick series from
 * it (see the commented series stub).
 */
export function HeartRateLane({
  restingHeartRateBpm,
  candles,
}: {
  restingHeartRateBpm: number | null;
  candles?: HourlyHrCandle[];
}) {
  const rhrPercent =
    restingHeartRateBpm !== null ? bpmToLanePercent(restingHeartRateBpm) : null;

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
    series: candles
      ? [
          {
            type: "candlestick",
            data: candles.map((candle) => [
              candle.p25,
              candle.p75,
              candle.min,
              candle.max,
            ]),
            itemStyle: {
              color: "var(--color-hr-2)",
              color0: "var(--color-hr-2)",
              borderColor: "var(--color-hr-2)",
              borderColor0: "var(--color-hr-2)",
            },
          },
        ]
      : [],
  };

  return (
    <div className="relative min-h-0 flex-1">
      {/* Grid lines at 25/50/75% + sleep-window ground tone are drawn in
          plain CSS rather than echarts so they align exactly with the
          overlay lines drawn by TimelineOverlays, which share the same
          percentage math. */}
      <div className="border-ink-500 bg-ink-850 absolute inset-0 border-b border-l">
        <div className="absolute inset-x-0 top-0 h-full w-[29.17%] bg-[var(--color-sleep-ground)]" />
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
        {!candles ? (
          <div className="text-ink-200 absolute inset-0 flex items-center justify-center px-4 text-center font-mono text-[9px] tracking-[.04em]">
            Hourly HR detail not available yet — only a daily resting rate is
            recorded.
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
