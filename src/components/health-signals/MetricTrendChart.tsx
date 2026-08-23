"use client";

import ReactECharts from "echarts-for-react";
import type { DailyMetricSummary } from "~/domain/analytics";

export function MetricTrendChart({
  data,
  type,
  color,
  label,
  days = 30,
}: {
  data: DailyMetricSummary[];
  type: "bar" | "line";
  color: string;
  label: string;
  days?: number;
}) {
  const visible = data.slice(-days);
  const values = visible.map((item) => [item.date, item.value]);
  const option = {
    animation: false,
    grid: { top: 12, right: 8, bottom: 28, left: 48 },
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      data: visible.map((item) => item.date),
      axisLabel: { color: "#94a3b8", hideOverlap: true },
      axisLine: { lineStyle: { color: "rgba(255,255,255,0.15)" } },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "#94a3b8" },
      splitLine: { lineStyle: { color: "rgba(255,255,255,0.08)" } },
    },
    series: [
      {
        name: label,
        type,
        data: values.map(([, value]) => value),
        symbol: "none",
        itemStyle: { color, borderRadius: type === "bar" ? [3, 3, 0, 0] : 0 },
        lineStyle: { color, width: 2.5 },
        areaStyle: type === "line" ? { color: `${color}20` } : undefined,
      },
    ],
  };

  const range = visible.length
    ? `${visible[0]?.date} through ${visible.at(-1)?.date}`
    : "no recorded dates";

  return (
    <div
      role="img"
      aria-label={`${label} trend for ${range}`}
      className="mt-4 h-44"
    >
      <ReactECharts option={option} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}
