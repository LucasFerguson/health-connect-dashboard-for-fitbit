"use client";

import { LazyECharts as ReactECharts } from "../ui/LazyECharts";
import type { DailySleepConsistency } from "~/domain/analytics";

export function SleepConsistencyMiniChart({
  data,
}: {
  data: DailySleepConsistency[];
}) {
  const visible = data.filter((day) => day.score !== null).slice(-30);
  const option = {
    animation: false,
    grid: { top: 10, right: 4, bottom: 22, left: 38 },
    tooltip: {
      trigger: "axis",
      valueFormatter: (value: number) => `${Math.round(value)}%`,
    },
    xAxis: {
      type: "category",
      data: visible.map((day) => day.date),
      axisLabel: { color: "#94a3b8", hideOverlap: true },
      axisLine: { lineStyle: { color: "rgba(255,255,255,0.12)" } },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 100,
      axisLabel: {
        color: "#94a3b8",
        formatter: (value: number) => `${value}%`,
      },
      splitLine: { lineStyle: { color: "rgba(255,255,255,0.07)" } },
    },
    series: [
      {
        name: "Daily consistency",
        type: "bar",
        data: visible.map((day) => day.score),
        itemStyle: { color: "#6ee7b7", borderRadius: [3, 3, 0, 0] },
      },
      {
        name: "7-day average",
        type: "line",
        data: visible.map((day) => day.rolling7DayAverageScore),
        symbol: "none",
        lineStyle: { color: "#f8fafc", width: 2 },
      },
    ],
  };

  return (
    <div
      className="mt-4 h-52"
      role="img"
      aria-label="Thirty-day sleep consistency trend"
    >
      <ReactECharts option={option} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}
