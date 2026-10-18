"use client";

import { LazyECharts as ReactECharts } from "../ui/LazyECharts";
import type { RecoveryDay } from "~/server/health/getRecoveryAnalytics";
import { displayScore } from "~/domain/recovery";
import { useNarrowScreen } from "./useNarrowScreen";

const PHONE_WINDOW_DAYS = 90;

/**
 * Recovery score over time. Only days with a numeric score are plotted; the
 * points sit on a time axis and the line breaks wherever a calendar day
 * between two scored days has no score, so missing days read as gaps.
 */
export function RecoveryChart({ daily }: { daily: RecoveryDay[] }) {
  const narrow = useNarrowScreen();
  const scored = daily
    .flatMap((day) => {
      // Insufficient days and null scores stay out of the numeric chart.
      const score = displayScore(day);
      return score === null ? [] : [{ ...day, score }];
    })
    .sort((a, b) => a.date.localeCompare(b.date));
  const data: [string, number | null][] = [];
  scored.forEach((day, index) => {
    const prev = scored[index - 1];
    if (prev && dayGap(prev.date, day.date) > 1) data.push([prev.date, null]);
    data.push([day.date, day.score]);
  });

  // On a phone, open on the last 90 days instead of squeezing all history
  // into ~300px; the slider still reaches every scored day.
  const last = scored.at(-1)?.date;
  const windowStart =
    narrow && last ? isoDaysBefore(last, PHONE_WINDOW_DAYS) : undefined;
  const option = {
    animation: false,
    grid: { top: 20, right: 18, bottom: 44, left: 44 },
    tooltip: { trigger: "axis", confine: true },
    dataZoom: [
      { type: "inside", startValue: windowStart },
      { type: "slider", height: 18, bottom: 4, startValue: windowStart },
    ],
    xAxis: {
      type: "time",
      axisLabel: { color: "#94a3b8", hideOverlap: true },
      axisLine: { lineStyle: { color: "rgba(255,255,255,0.15)" } },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 100,
      axisLabel: { color: "#94a3b8" },
      splitLine: { lineStyle: { color: "rgba(255,255,255,0.08)" } },
    },
    series: [
      {
        name: "Recovery",
        type: "line",
        data,
        connectNulls: false,
        symbolSize: 4,
        itemStyle: { color: "#4fc98a" },
        lineStyle: { color: "#4fc98a", width: 2 },
      },
    ],
  };

  if (scored.length === 0) {
    return <p className="text-ink-200 text-sm">No scored days to chart yet.</p>;
  }
  return (
    <div className="h-72" role="img" aria-label="Recovery score over time">
      <ReactECharts option={option} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}

function isoDaysBefore(date: string, days: number) {
  const time = Date.parse(date);
  if (Number.isNaN(time)) return undefined;
  return new Date(time - days * 86_400_000).toISOString().slice(0, 10);
}

function dayGap(from: string, to: string) {
  return (Date.parse(to) - Date.parse(from)) / 86_400_000;
}
