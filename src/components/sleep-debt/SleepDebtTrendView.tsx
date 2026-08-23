"use client";

import ReactECharts from "echarts-for-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type {
  DailySleepDebt,
  SleepDebtAnalytics,
  SleepDebtBreakdown,
} from "~/domain/analytics";
import { formatDurationMinutes } from "~/features/health/metricFormatters";

type RangeDays = 7 | 30 | 180;

const ranges: Array<{ label: string; days: RangeDays }> = [
  { label: "W", days: 7 },
  { label: "M", days: 30 },
  { label: "6M", days: 180 },
];

export function SleepDebtTrendView({
  analytics,
  selectedDate,
}: {
  analytics: SleepDebtAnalytics;
  selectedDate?: string;
}) {
  const [rangeDays, setRangeDays] = useState<RangeDays>(30);
  const period = useMemo(
    () => selectPeriod(analytics.daily, rangeDays, selectedDate),
    [analytics.daily, rangeDays, selectedDate],
  );
  const average = averageDebt(period.current);
  const priorAverage = averageDebt(period.previous);
  const difference =
    average !== null && priorAverage !== null ? average - priorAverage : null;
  const breakdown = buildBreakdown(period.current);
  const option = buildChartOption(period.current);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#253038] to-[#101619] px-4 py-6 text-white">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="inline-flex rounded-lg px-2 py-1 text-sm text-sky-200 hover:bg-white/10 hover:text-white"
        >
          ← Health dashboard
        </Link>

        <header className="mt-6 rounded-2xl border border-white/10 bg-white/10 p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-sky-200 uppercase">
                Trend view
              </p>
              <h1 className="mt-2 text-3xl font-extrabold">Sleep debt</h1>
              <p className="mt-2 max-w-2xl text-sm text-white/60">
                Shortfall from your{" "}
                {formatDurationMinutes(analytics.targetMinutes)} nightly target,
                calculated from reconciled sleep sessions.
              </p>
            </div>
            <div
              className="flex rounded-xl bg-black/20 p-1"
              aria-label="Time range"
            >
              {ranges.map((range) => (
                <button
                  key={range.days}
                  type="button"
                  onClick={() => setRangeDays(range.days)}
                  aria-pressed={rangeDays === range.days}
                  className={`min-w-12 rounded-lg px-4 py-2 text-xs font-bold transition ${
                    rangeDays === range.days
                      ? "bg-white/15 text-white"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-white/45 uppercase">
                Average
              </p>
              <p className="mt-1 text-5xl font-light tracking-tight">
                {average === null ? "—" : formatClockDuration(average)}
              </p>
              {difference !== null ? (
                <p
                  className={`mt-2 inline-flex rounded-md px-2 py-1 text-xs font-semibold ${
                    difference <= 0
                      ? "bg-emerald-400/15 text-emerald-300"
                      : "bg-amber-400/15 text-amber-200"
                  }`}
                >
                  {difference <= 0 ? "↓" : "↑"}{" "}
                  {formatDurationMinutes(Math.abs(difference))} vs prior period
                </p>
              ) : null}
            </div>
            <p className="text-sm font-semibold text-white/75">
              {periodLabel(period.current, rangeDays)}
            </p>
          </div>

          <p className="mt-6 max-w-3xl text-sm leading-6 text-white/70">
            Your average sleep debt for this period was{" "}
            {average === null
              ? "not available"
              : formatDurationMinutes(average)}
            {priorAverage === null
              ? "."
              : `, compared with ${formatDurationMinutes(priorAverage)} in the previous period.`}
          </p>

          {period.current.length ? (
            <div
              className="mt-6 h-[26rem]"
              role="img"
              aria-label={`Daily and rolling sleep debt for ${periodLabel(period.current, rangeDays)}`}
            >
              <ReactECharts
                option={option}
                style={{ height: "100%", width: "100%" }}
              />
            </div>
          ) : (
            <div className="mt-8 rounded-xl border border-dashed border-white/15 p-12 text-center text-white/45">
              No sleep records are available in this period.
            </div>
          )}
        </header>

        <Breakdown breakdown={breakdown} />

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <article className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold">How it is calculated</h2>
            <p className="mt-2 text-sm leading-6 text-white/60">
              {analytics.methodology}
            </p>
          </article>
          <article className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold">What the trend means</h2>
            <p className="mt-2 text-sm leading-6 text-white/60">
              Bars show each recorded day&apos;s shortfall. The white line
              smooths those readings into a seven-day average; lower is better.
              Surplus sleep remains available in the prepared data but does not
              erase another day&apos;s debt.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}

function Breakdown({ breakdown }: { breakdown: SleepDebtBreakdown }) {
  const categories = [
    { key: "high" as const, label: "High (>45m)", color: "#7dd3fc" },
    {
      key: "moderate" as const,
      label: "Moderate (30–45m)",
      color: "#647f8d",
    },
    { key: "low" as const, label: "Low (<30m)", color: "#405661" },
    { key: "none" as const, label: "No debt", color: "#26363e" },
  ];
  return (
    <section className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5">
      <h2 className="text-sm font-semibold tracking-wide uppercase">
        Sleep debt breakdown ({breakdown.recordedDays} recorded days)
      </h2>
      <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-white/5">
        {categories.map((category) => (
          <span
            key={category.key}
            style={{
              backgroundColor: category.color,
              width: `${percentage(breakdown[category.key], breakdown.recordedDays)}%`,
            }}
          />
        ))}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {categories.map((category) => (
          <div key={category.key} className="flex items-center gap-2 text-sm">
            <span
              className="h-3 w-3 rounded-sm"
              style={{ background: category.color }}
            />
            <strong>{breakdown[category.key]}×</strong>
            <span className="text-white/55">{category.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function selectPeriod(
  data: DailySleepDebt[],
  rangeDays: RangeDays,
  selectedDate?: string,
) {
  const lastDate = selectedDate ?? data.at(-1)?.date;
  if (!lastDate) return { current: [], previous: [] };
  const end = parseDate(lastDate);
  const currentStart = end - (rangeDays - 1) * 86_400_000;
  const previousEnd = currentStart - 86_400_000;
  const previousStart = previousEnd - (rangeDays - 1) * 86_400_000;
  return {
    current: data.filter((day) => {
      const instant = parseDate(day.date);
      return instant >= currentStart && instant <= end;
    }),
    previous: data.filter((day) => {
      const instant = parseDate(day.date);
      return instant >= previousStart && instant <= previousEnd;
    }),
  };
}

function buildChartOption(data: DailySleepDebt[]) {
  return {
    animation: false,
    grid: { top: 30, right: 18, bottom: 42, left: 54 },
    legend: { top: 0, textStyle: { color: "#cbd5e1" } },
    tooltip: {
      trigger: "axis",
      valueFormatter: (value: number) => formatDurationMinutes(value),
    },
    xAxis: {
      type: "category",
      data: data.map((day) => day.date),
      axisLabel: { color: "#94a3b8", hideOverlap: true },
      axisLine: { lineStyle: { color: "rgba(255,255,255,0.15)" } },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        color: "#94a3b8",
        formatter: (value: number) => `${Math.round(value / 60)}h`,
      },
      splitLine: { lineStyle: { color: "rgba(255,255,255,0.08)" } },
    },
    series: [
      {
        name: "Daily debt",
        type: "bar",
        data: data.map((day) => day.debtMinutes),
        itemStyle: { color: "#8fc5df", borderRadius: [4, 4, 0, 0] },
      },
      {
        name: "7-day average",
        type: "line",
        data: data.map((day) => day.rolling7DayAverageMinutes),
        symbol: "none",
        lineStyle: { color: "#ffffff", width: 2, type: "dashed" },
      },
    ],
  };
}

function averageDebt(days: DailySleepDebt[]): number | null {
  return days.length
    ? days.reduce((total, day) => total + day.debtMinutes, 0) / days.length
    : null;
}

function buildBreakdown(days: DailySleepDebt[]): SleepDebtBreakdown {
  return days.reduce<SleepDebtBreakdown>(
    (result, day) => ({
      ...result,
      recordedDays: result.recordedDays + 1,
      [day.category]: result[day.category] + 1,
    }),
    { recordedDays: 0, none: 0, low: 0, moderate: 0, high: 0 },
  );
}

function periodLabel(days: DailySleepDebt[], rangeDays: RangeDays): string {
  if (!days.length) return `Last ${rangeDays} days`;
  return `${days[0]?.date} – ${days.at(-1)?.date}`;
}

function formatClockDuration(minutes: number): string {
  const rounded = Math.round(minutes);
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, "0")} hr`;
}

function parseDate(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}

function percentage(value: number, total: number): number {
  return total ? (value / total) * 100 : 0;
}
