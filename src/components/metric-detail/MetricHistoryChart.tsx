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
  const { diverging, formatValue } = presentation;
  // A deviation metric (skin temperature) is charted around its zero
  // baseline: each day colored by sign, with the baseline drawn in.
  const dailyData = diverging
    ? analytics.daily.map((day) => ({
        value: day.value,
        itemStyle: {
          color: day.value < 0 ? diverging.negativeColor : presentation.color,
        },
      }))
    : analytics.daily.map((day) => day.value);
  const option = {
    animation: false,
    grid: { top: 46, right: 18, bottom: 44, left: 64 },
    legend: { top: 4, textStyle: { color: "#cbd5e1" } },
    tooltip: {
      trigger: "axis",
      ...(diverging
        ? {
            valueFormatter: (value: unknown) =>
              typeof value === "number" ? formatValue(value) : "—",
          }
        : {}),
    },
    dataZoom: [{ type: "inside" }, { type: "slider", height: 18, bottom: 4 }],
    xAxis: {
      type: "category",
      data: dates,
      axisLabel: { color: "#94a3b8", hideOverlap: true },
      axisLine: { lineStyle: { color: "rgba(255,255,255,0.15)" } },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        color: "#94a3b8",
        ...(diverging ? { formatter: diverging.formatTick } : {}),
      },
      splitLine: { lineStyle: { color: "rgba(255,255,255,0.08)" } },
    },
    series: [
      {
        name:
          kind === "calories"
            ? "Active calories"
            : diverging
              ? "Nightly deviation"
              : "Daily reading",
        type: presentation.chartType,
        data: dailyData,
        symbol: "none",
        itemStyle: { color: presentation.color },
        lineStyle: { color: presentation.color, width: 1.5, opacity: 0.55 },
        ...(diverging
          ? {
              markLine: {
                silent: true,
                symbol: "none",
                data: [{ yAxis: 0 }],
                lineStyle: { color: "rgba(255,255,255,0.5)", type: "solid" },
                // The description says 0 is the baseline; a line label
                // would sit behind the bars.
                label: { show: false },
              },
            }
          : {}),
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
      <p className="mt-1 text-sm text-white/70">
        {diverging
          ? "Each night's deviation from your baseline (0), with a calendar-based seven-day average. Drag the range control to focus on a period."
          : "Daily readings with a calendar-based seven-day average. Drag the range control to focus on a period."}
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
