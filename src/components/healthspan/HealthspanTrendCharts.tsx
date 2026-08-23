"use client";

import ReactECharts from "echarts-for-react";
import type { DailyHealthspanEstimate } from "~/domain/analytics";

export function HealthspanTrendCharts({
  trend,
}: {
  trend: DailyHealthspanEstimate[];
}) {
  const age = trend.filter((day) => day.healthAgeYears !== null);
  const pace = trend.filter((day) => day.paceOfAging !== null);
  return (
    <section
      className="grid gap-5 lg:grid-cols-2"
      aria-label="Healthspan trends"
    >
      <TrendChart
        title="Health age trend"
        ariaLabel="Health age compared with chronological age"
        option={{
          animation: false,
          grid: { top: 42, right: 18, bottom: 38, left: 52 },
          legend: { top: 0, textStyle: { color: "#cbd5e1" } },
          tooltip: {
            trigger: "axis",
            valueFormatter: (value: number) => `${value.toFixed(1)} years`,
          },
          xAxis: axis(age.map((day) => day.date)),
          yAxis: valueAxis("years"),
          series: [
            {
              name: "Health age",
              type: "line",
              step: "end",
              symbol: "none",
              data: age.map((day) => day.healthAgeYears),
              lineStyle: { color: "#f59e0b", width: 3 },
              itemStyle: { color: "#f59e0b" },
            },
            {
              name: "Chronological age",
              type: "line",
              symbol: "none",
              data: age.map((day) => day.chronologicalAgeYears),
              lineStyle: { color: "#f8fafc", width: 2 },
              itemStyle: { color: "#f8fafc" },
            },
          ],
        }}
      />
      <TrendChart
        title="Pace of aging trend"
        ariaLabel="Pace of aging compared with the one-times baseline"
        option={{
          animation: false,
          grid: { top: 42, right: 18, bottom: 38, left: 52 },
          legend: { top: 0, textStyle: { color: "#cbd5e1" } },
          tooltip: {
            trigger: "axis",
            valueFormatter: (value: number) => `${value.toFixed(2)}×`,
          },
          xAxis: axis(pace.map((day) => day.date)),
          yAxis: { ...valueAxis("×"), min: -1, max: 3 },
          series: [
            {
              name: "Your pace",
              type: "line",
              symbol: "none",
              data: pace.map((day) => day.paceOfAging),
              lineStyle: { color: "#7dd3fc", width: 3 },
              itemStyle: { color: "#7dd3fc" },
            },
            {
              name: "1× baseline",
              type: "line",
              symbol: "none",
              data: pace.map(() => 1),
              lineStyle: { color: "#f8fafc", width: 1.5 },
              itemStyle: { color: "#f8fafc" },
            },
          ],
        }}
      />
    </section>
  );
}

function TrendChart({
  title,
  ariaLabel,
  option,
}: {
  title: string;
  ariaLabel: string;
  option: object;
}) {
  return (
    <article className="rounded-xl border border-white/10 bg-white/5 p-5">
      <h2 className="font-semibold tracking-wide uppercase">{title}</h2>
      <div className="mt-4 h-80" role="img" aria-label={ariaLabel}>
        <ReactECharts
          option={option}
          style={{ height: "100%", width: "100%" }}
        />
      </div>
    </article>
  );
}

function axis(dates: string[]) {
  return {
    type: "category",
    data: dates,
    axisLabel: { color: "#94a3b8", hideOverlap: true },
    axisLine: { lineStyle: { color: "rgba(255,255,255,0.15)" } },
  };
}

function valueAxis(unit: string) {
  return {
    type: "value",
    axisLabel: { color: "#94a3b8", formatter: `{value}${unit}` },
    splitLine: { lineStyle: { color: "rgba(255,255,255,0.08)" } },
  };
}
