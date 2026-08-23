"use client";

import ReactECharts from "echarts-for-react";
import Link from "next/link";
import type { DailySleepSummary } from "~/domain/analytics";
import { formatDurationMinutes } from "~/features/health/metricFormatters";
import { CalendarHeatmap } from "../heatmap/CalendarHeatmap";

export function SleepQuantityView({
  daily,
  targetMinutes,
  selectedDate,
}: {
  daily: DailySleepSummary[];
  targetMinutes: number;
  selectedDate?: string;
}) {
  const latest = daily.at(-1) ?? null;
  const selected = selectedDate
    ? daily.find((day) => day.date === selectedDate)
    : null;
  const average7 = latest ? calendarAverage(daily, latest.date, 7) : null;
  const average30 = latest ? calendarAverage(daily, latest.date, 30) : null;
  const monthly = monthlyAverages(daily);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#2e2651] to-[#11151f] px-4 py-6 text-white">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="inline-flex rounded-lg px-2 py-1 text-sm text-violet-200 hover:bg-white/10 hover:text-white"
        >
          ← Health dashboard
        </Link>
        <header className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold tracking-[0.2em] text-violet-200 uppercase">
              Sleep analytics
            </p>
            <h1 className="mt-2 text-4xl font-extrabold">Sleep quantity</h1>
            <p className="mt-2 text-white/60">
              Total reconciled sleep across each day, including separate naps
              while avoiding overlapping device duplicates.
            </p>
          </div>
          {latest ? (
            <div className="rounded-xl border border-white/10 bg-white/10 px-5 py-3 text-right">
              <p className="text-xs text-white/45">Latest · {latest.date}</p>
              <p className="mt-1 text-2xl font-bold">
                {formatDurationMinutes(latest.sleepMinutes)}
              </p>
            </div>
          ) : null}
        </header>

        {selectedDate ? (
          <section className="mt-8 rounded-xl border border-violet-300/25 bg-violet-300/10 p-5">
            <p className="text-xs font-semibold text-violet-200 uppercase">
              Selected day · {selectedDate}
            </p>
            {selected ? (
              <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
                <p className="text-3xl font-bold">
                  {formatDurationMinutes(selected.sleepMinutes)}
                </p>
                <p className="text-sm text-white/55">
                  {selected.eventCount} sleep session
                  {selected.eventCount === 1 ? "" : "s"} ·{" "}
                  {selected.recordingCount} device recording
                  {selected.recordingCount === 1 ? "" : "s"}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-white/55">
                No sleep was recorded for this day.
              </p>
            )}
          </section>
        ) : null}

        <section
          className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4"
          aria-label="Sleep quantity summary"
        >
          <Summary label="7-day average" value={formatNullable(average7)} />
          <Summary label="30-day average" value={formatNullable(average30)} />
          <Summary
            label="Nightly target"
            value={formatDurationMinutes(targetMinutes)}
          />
          <Summary label="Recorded days" value={String(daily.length)} />
        </section>

        <div className="mt-8">
          <CalendarHeatmap
            data={daily.map((day) => ({
              date: day.date,
              value: day.sleepMinutes,
            }))}
            title="Sleep quantity calendar"
            description="A full year of recorded sleep. Darker days represent more total sleep."
            label="Sleep quantity"
            color="#a78bfa"
            formatValue={formatDurationMinutes}
            initialDate={selectedDate}
          />
        </div>

        <section className="mt-6 rounded-xl border border-white/10 bg-white/10 p-5">
          <h2 className="text-xl font-semibold">Daily sleep trend</h2>
          <p className="mt-1 text-sm text-white/55">
            Daily quantity compared with your configured target.
          </p>
          <div
            className="mt-4 h-96"
            role="img"
            aria-label="Daily sleep quantity history"
          >
            <ReactECharts
              option={dailyOption(daily, targetMinutes)}
              style={{ height: "100%", width: "100%" }}
            />
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-white/10 bg-white/10 p-5">
          <h2 className="text-xl font-semibold">Monthly direction</h2>
          <p className="mt-1 text-sm text-white/55">
            Average sleep per recorded day; missing days are excluded.
          </p>
          <div
            className="mt-4 h-72"
            role="img"
            aria-label="Monthly sleep quantity averages"
          >
            <ReactECharts
              option={monthlyOption(monthly)}
              style={{ height: "100%", width: "100%" }}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border border-white/10 bg-white/10 p-4">
      <p className="text-xs text-white/45">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </article>
  );
}

function dailyOption(daily: DailySleepSummary[], targetMinutes: number) {
  return {
    animation: false,
    grid: { top: 42, right: 18, bottom: 44, left: 58 },
    legend: { top: 0, textStyle: { color: "#cbd5e1" } },
    tooltip: {
      trigger: "axis",
      valueFormatter: (value: number) => formatDurationMinutes(value),
    },
    dataZoom: [{ type: "inside" }, { type: "slider", height: 18, bottom: 4 }],
    xAxis: axis(daily.map((day) => day.date)),
    yAxis: durationAxis(),
    series: [
      {
        name: "Recorded sleep",
        type: "bar",
        data: daily.map((day) => day.sleepMinutes),
        itemStyle: { color: "#a78bfa", borderRadius: [3, 3, 0, 0] },
      },
      {
        name: "Target",
        type: "line",
        data: daily.map(() => targetMinutes),
        symbol: "none",
        lineStyle: { color: "#f8fafc", width: 2, type: "dashed" },
      },
    ],
  };
}

function monthlyOption(monthly: Array<{ month: string; value: number }>) {
  return {
    animation: false,
    grid: { top: 20, right: 18, bottom: 34, left: 58 },
    tooltip: {
      trigger: "axis",
      valueFormatter: (value: number) => formatDurationMinutes(value),
    },
    xAxis: axis(monthly.map((item) => item.month)),
    yAxis: durationAxis(),
    series: [
      {
        name: "Average sleep",
        type: "bar",
        data: monthly.map((item) => item.value),
        itemStyle: { color: "#8b5cf6", borderRadius: [4, 4, 0, 0] },
      },
    ],
  };
}

function axis(values: string[]) {
  return {
    type: "category",
    data: values,
    axisLabel: { color: "#94a3b8", hideOverlap: true },
    axisLine: { lineStyle: { color: "rgba(255,255,255,0.15)" } },
  };
}

function durationAxis() {
  return {
    type: "value",
    axisLabel: {
      color: "#94a3b8",
      formatter: (value: number) => `${Math.round(value / 60)}h`,
    },
    splitLine: { lineStyle: { color: "rgba(255,255,255,0.08)" } },
  };
}

function calendarAverage(
  daily: DailySleepSummary[],
  endDate: string,
  days: number,
): number | null {
  const end = Date.parse(`${endDate}T00:00:00Z`);
  const start = end - (days - 1) * 86_400_000;
  const values = daily.filter((day) => {
    const instant = Date.parse(`${day.date}T00:00:00Z`);
    return instant >= start && instant <= end;
  });
  return values.length
    ? values.reduce((total, day) => total + day.sleepMinutes, 0) / values.length
    : null;
}

function monthlyAverages(daily: DailySleepSummary[]) {
  const groups = new Map<string, number[]>();
  for (const day of daily) {
    const month = day.date.slice(0, 7);
    groups.set(month, [...(groups.get(month) ?? []), day.sleepMinutes]);
  }
  return [...groups.entries()].map(([month, values]) => ({
    month,
    value: values.reduce((total, value) => total + value, 0) / values.length,
  }));
}

function formatNullable(value: number | null): string {
  return value === null ? "No data" : formatDurationMinutes(value);
}
