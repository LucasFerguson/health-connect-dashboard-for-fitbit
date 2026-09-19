"use client";

import { LazyECharts as ReactECharts } from "../ui/LazyECharts";
import type { MonthlyMetricSummary } from "~/domain/analytics";
import type { MetricKind } from "~/features/health/metricPresentation";
import { metricPresentation } from "~/features/health/metricPresentation";

export function MonthlyMetricChart({
  data,
  kind,
}: {
  data: MonthlyMetricSummary[];
  kind: MetricKind;
}) {
  const presentation = metricPresentation(kind);
  const option = {
    animation: false,
    grid: { top: 20, right: 16, bottom: 32, left: 64 },
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      data: data.map((month) => month.month),
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
        name: "Average per recorded day",
        type: "bar",
        data: data.map((month) => month.value),
        itemStyle: { color: presentation.color, borderRadius: [5, 5, 0, 0] },
      },
    ],
  };

  return (
    <section className="rounded-xl border border-white/10 bg-white/10 p-5">
      <h2 className="text-xl font-semibold">Monthly direction</h2>
      <p className="mt-1 text-sm text-white/55">
        Average per recorded day. Missing days are excluded rather than treated
        as zero.
      </p>
      <div
        className="mt-4 h-72"
        role="img"
        aria-label={`${presentation.title} monthly averages`}
      >
        <ReactECharts
          option={option}
          style={{ height: "100%", width: "100%" }}
        />
      </div>
    </section>
  );
}
