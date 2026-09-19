"use client";

import { LazyECharts as ReactECharts } from "../ui/LazyECharts";
import type { MetricAnalytics } from "~/domain/analytics";
import type { MetricKind } from "~/features/health/metricPresentation";
import { metricPresentation } from "~/features/health/metricPresentation";

export function MetricHistoryChart({
  analytics,
  kind,
  secondary,
}: {
  analytics: MetricAnalytics;
  kind: MetricKind;
  secondary?: MetricAnalytics;
}) {
  const presentation = metricPresentation(kind);
  const rolling = new Map(
    analytics.rolling7Day.map((point) => [point.date, point.value]),
  );
  const secondaryByDate = new Map(
    secondary?.daily.map((point) => [point.date, point.value]) ?? [],
  );
  const dates = analytics.daily.map((day) => day.date);
  const option = {
    animation: false,
    grid: { top: 46, right: 18, bottom: 44, left: 64 },
    legend: { top: 4, textStyle: { color: "#cbd5e1" } },
    tooltip: { trigger: "axis" },
    dataZoom: [{ type: "inside" }, { type: "slider", height: 18, bottom: 4 }],
    xAxis: {
      type: "category",
      data: dates,
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
        name: kind === "calories" ? "Active calories" : "Daily reading",
        type: presentation.chartType,
        data: analytics.daily.map((day) => day.value),
        symbol: "none",
        itemStyle: { color: presentation.color },
        lineStyle: { color: presentation.color, width: 1.5, opacity: 0.55 },
      },
      {
        name: "7-day average",
        type: "line",
        data: dates.map((date) => rolling.get(date) ?? null),
        symbol: "none",
        itemStyle: { color: "#f8fafc" },
        lineStyle: { color: "#f8fafc", width: 3 },
      },
      ...(secondary
        ? [
            {
              name: "Total calories",
              type: "line",
              data: dates.map((date) => secondaryByDate.get(date) ?? null),
              symbol: "none",
              itemStyle: { color: "#facc15" },
              lineStyle: { color: "#facc15", width: 2 },
            },
          ]
        : []),
    ],
  };

  return (
    <section className="rounded-xl border border-white/10 bg-white/10 p-5">
      <h2 className="text-xl font-semibold">Progress and trend</h2>
      <p className="mt-1 text-sm text-white/55">
        Daily readings with a calendar-based seven-day average. Drag the range
        control to focus on a period.
      </p>
      <div
        className="mt-4 h-96"
        role="img"
        aria-label={`${presentation.title} daily history and seven-day trend`}
      >
        <ReactECharts
          option={option}
          style={{ height: "100%", width: "100%" }}
        />
      </div>
    </section>
  );
}
