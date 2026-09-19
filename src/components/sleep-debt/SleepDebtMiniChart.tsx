"use client";

import { LazyECharts as ReactECharts } from "../ui/LazyECharts";
import type { DailySleepDebt } from "~/domain/analytics";

export function SleepDebtMiniChart({ data }: { data: DailySleepDebt[] }) {
  const visible = data.slice(-30);
  const option = {
    animation: false,
    grid: { top: 10, right: 4, bottom: 22, left: 38 },
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      data: visible.map((day) => day.date),
      axisLabel: { color: "#94a3b8", hideOverlap: true },
      axisLine: { lineStyle: { color: "rgba(255,255,255,0.12)" } },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        color: "#94a3b8",
        formatter: (value: number) => `${Math.round(value / 60)}h`,
      },
      splitLine: { lineStyle: { color: "rgba(255,255,255,0.07)" } },
    },
    series: [
      {
        name: "Daily sleep debt",
        type: "bar",
        data: visible.map((day) => day.debtMinutes),
        itemStyle: { color: "#7dd3fc", borderRadius: [3, 3, 0, 0] },
      },
      {
        name: "7-day average",
        type: "line",
        data: visible.map((day) => day.rolling7DayAverageMinutes),
        symbol: "none",
        lineStyle: { color: "#f8fafc", width: 2 },
      },
    ],
  };

  return (
    <div
      className="mt-4 h-52"
      role="img"
      aria-label="Thirty-day sleep debt trend"
    >
      <ReactECharts option={option} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}
