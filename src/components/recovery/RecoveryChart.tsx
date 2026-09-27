"use client";

import { LazyECharts as ReactECharts } from "../ui/LazyECharts";
import type { RecoveryDay } from "~/server/health/getRecoveryAnalytics";

/**
 * Recovery score over time. Only days with a numeric score are plotted; the
 * points sit on a time axis and the line breaks wherever a calendar day
 * between two scored days has no score, so missing days read as gaps.
 */
export function RecoveryChart({ daily }: { daily: RecoveryDay[] }) {
  const scored = daily
    .flatMap((day) =>
      day.score === null ? [] : [{ ...day, score: day.score }],
    )
    .sort((a, b) => a.date.localeCompare(b.date));
  const data: [string, number | null][] = [];
  scored.forEach((day, index) => {
    const prev = scored[index - 1];
    if (prev && dayGap(prev.date, day.date) > 1) data.push([prev.date, null]);
    data.push([day.date, day.score]);
  });

  const option = {
    animation: false,
    grid: { top: 20, right: 18, bottom: 44, left: 44 },
    tooltip: { trigger: "axis" },
    dataZoom: [{ type: "inside" }, { type: "slider", height: 18, bottom: 4 }],
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

function dayGap(from: string, to: string) {
  return (Date.parse(to) - Date.parse(from)) / 86_400_000;
}
