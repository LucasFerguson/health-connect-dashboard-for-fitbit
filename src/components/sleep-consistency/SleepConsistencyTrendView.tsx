"use client";

import { LazyECharts as ReactECharts } from "../ui/LazyECharts";
import Link from "next/link";
import { useMemo, useState } from "react";
import type {
  DailySleepConsistency,
  SleepConsistencyAnalytics,
  SleepConsistencyBreakdown,
} from "~/domain/analytics";
import { healthSourceLabel } from "~/features/health/sourceLabels";
import { CalendarHeatmap } from "../heatmap/CalendarHeatmap";
import { TrendBreakdown } from "../sleep-trends/TrendBreakdown";
import {
  TrendRangeTabs,
  type TrendRangeDays,
} from "../sleep-trends/TrendRangeTabs";

export function SleepConsistencyTrendView({
  analytics,
  selectedDate,
}: {
  analytics: SleepConsistencyAnalytics;
  selectedDate?: string;
}) {
  const [rangeDays, setRangeDays] = useState<TrendRangeDays>(30);
  const period = useMemo(
    () => selectPeriod(analytics.daily, rangeDays, selectedDate),
    [analytics.daily, rangeDays, selectedDate],
  );
  const average = averageScore(period.current);
  const priorAverage = averageScore(period.previous);
  const difference =
    average !== null && priorAverage !== null ? average - priorAverage : null;
  const breakdown = buildBreakdown(period.current);
  const selected = selectedDate
    ? analytics.daily.find((day) => day.date === selectedDate)
    : null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#253038] to-[#101619] px-4 py-6 text-white">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="inline-flex rounded-lg px-2 py-1 text-sm text-emerald-200 hover:bg-white/10 hover:text-white"
        >
          ← Health dashboard
        </Link>
        <header className="mt-6 rounded-2xl border border-white/10 bg-white/10 p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.2em] text-emerald-200 uppercase">
                Trend view
              </p>
              <h1 className="mt-2 text-3xl font-extrabold">
                Sleep consistency
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-white/60">
                A versioned estimate of bedtime and wake-time regularity. Higher
                is better.
              </p>
            </div>
            <TrendRangeTabs value={rangeDays} onChange={setRangeDays} />
          </div>

          <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-white/45 uppercase">
                Average
              </p>
              <p className="mt-1 text-5xl font-light tracking-tight">
                {formatScore(average)}
              </p>
              {difference !== null ? (
                <p
                  className={`mt-2 inline-flex rounded-md px-2 py-1 text-xs font-semibold ${difference >= 0 ? "bg-emerald-400/15 text-emerald-300" : "bg-amber-400/15 text-amber-200"}`}
                >
                  {difference >= 0 ? "↑" : "↓"}{" "}
                  {Math.abs(Math.round(difference))} points vs prior period
                </p>
              ) : null}
            </div>
            <p className="text-sm font-semibold text-white/75">
              {periodLabel(period.current, rangeDays)}
            </p>
          </div>

          <p className="mt-6 max-w-3xl text-sm leading-6 text-white/70">
            Your average sleep consistency for this period was{" "}
            {formatScore(average)}
            {priorAverage === null
              ? "."
              : `, compared with ${formatScore(priorAverage)} in the previous period.`}
          </p>

          {period.current.length ? (
            <div
              className="mt-6 h-[26rem]"
              role="img"
              aria-label={`Daily and rolling sleep consistency for ${periodLabel(period.current, rangeDays)}`}
            >
              <ReactECharts
                option={buildChartOption(period.current)}
                style={{ height: "100%", width: "100%" }}
              />
            </div>
          ) : (
            <div className="mt-8 rounded-xl border border-dashed border-white/15 p-12 text-center text-white/45">
              No scored nights are available in this period.
            </div>
          )}
        </header>

        {selectedDate ? (
          <SelectedNight day={selected ?? null} date={selectedDate} />
        ) : null}

        <div className="mt-6">
          <CalendarHeatmap
            data={analytics.daily.flatMap((day) =>
              day.score === null ? [] : [{ date: day.date, value: day.score }],
            )}
            title="Consistency calendar"
            description="A year of schedule regularity. Darker days represent more consistent bedtime and wake timing."
            label="Sleep consistency"
            color="#34d399"
            formatValue={(value) => `${Math.round(value)}%`}
            initialDate={selectedDate}
          />
        </div>

        <TrendBreakdown
          title="Sleep consistency breakdown"
          total={breakdown.scoredDays}
          items={[
            {
              label: "Optimal (80%+)",
              count: breakdown.optimal,
              color: "#34d399",
            },
            {
              label: "Sufficient (70–79%)",
              count: breakdown.sufficient,
              color: "#94a3b8",
            },
            { label: "Poor (<70%)", count: breakdown.poor, color: "#fbbf24" },
          ]}
        />

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <article className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold">How it is calculated</h2>
            <p className="mt-2 text-sm leading-6 text-white/60">
              {analytics.methodology}
            </p>
          </article>
          <article className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold">Designed for refinement</h2>
            <p className="mt-2 text-sm leading-6 text-white/60">
              The pipeline stores baseline times, deviations, sample counts,
              source, and quality flags—not only the final score. A later
              algorithm can be compared with this version without rewriting the
              original sleep records.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}

function SelectedNight({
  day,
  date,
}: {
  day: DailySleepConsistency | null;
  date: string;
}) {
  return (
    <section className="mt-6 rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-5">
      <p className="text-xs font-semibold text-emerald-200 uppercase">
        Selected night · {date}
      </p>
      {day ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Detail label="Score" value={formatScore(day.score)} />
          <Detail
            label="Bedtime"
            value={formatLocalTime(day.bedtimeMinutesLocal)}
          />
          <Detail
            label="Wake time"
            value={formatLocalTime(day.wakeMinutesLocal)}
          />
          <Detail label="Source" value={healthSourceLabel(day.source)} />
        </div>
      ) : (
        <p className="mt-2 text-sm text-white/55">
          No main sleep was recorded for this day.
        </p>
      )}
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-white/45">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function selectPeriod(
  data: DailySleepConsistency[],
  rangeDays: TrendRangeDays,
  selectedDate?: string,
) {
  const scored = data.filter(hasScore);
  const lastDate = selectedDate ?? scored.at(-1)?.date;
  if (!lastDate) return { current: [], previous: [] };
  const end = parseDate(lastDate);
  const currentStart = end - (rangeDays - 1) * 86_400_000;
  const previousEnd = currentStart - 86_400_000;
  const previousStart = previousEnd - (rangeDays - 1) * 86_400_000;
  return {
    current: scored.filter((day) => between(day.date, currentStart, end)),
    previous: scored.filter((day) =>
      between(day.date, previousStart, previousEnd),
    ),
  };
}

function buildChartOption(data: DailySleepConsistency[]) {
  return {
    animation: false,
    grid: { top: 30, right: 18, bottom: 42, left: 54 },
    legend: { top: 0, textStyle: { color: "#cbd5e1" } },
    tooltip: {
      trigger: "axis",
      valueFormatter: (value: number) => `${Math.round(value)}%`,
    },
    xAxis: {
      type: "category",
      data: data.map((day) => day.date),
      axisLabel: { color: "#94a3b8", hideOverlap: true },
      axisLine: { lineStyle: { color: "rgba(255,255,255,0.15)" } },
    },
    yAxis: {
      type: "value",
      min: 0,
      max: 100,
      axisLabel: {
        color: "#94a3b8",
        formatter: (value: number) => `${value}%`,
      },
      splitLine: { lineStyle: { color: "rgba(255,255,255,0.08)" } },
    },
    series: [
      {
        name: "Daily score",
        type: "bar",
        data: data.map((day) => day.score),
        itemStyle: { color: "#8fc5df", borderRadius: [4, 4, 0, 0] },
      },
      {
        name: "7-day average",
        type: "line",
        data: data.map((day) => day.rolling7DayAverageScore),
        symbol: "none",
        lineStyle: { color: "#ffffff", width: 2, type: "dashed" },
      },
    ],
  };
}

function averageScore(days: DailySleepConsistency[]): number | null {
  const scores = days
    .map((day) => day.score)
    .filter((score): score is number => score !== null);
  return scores.length
    ? scores.reduce((total, score) => total + score, 0) / scores.length
    : null;
}

function buildBreakdown(
  days: DailySleepConsistency[],
): SleepConsistencyBreakdown {
  return days.reduce<SleepConsistencyBreakdown>(
    (result, day) => {
      if (!day.category) return result;
      return {
        ...result,
        scoredDays: result.scoredDays + 1,
        [day.category]: result[day.category] + 1,
      };
    },
    { scoredDays: 0, optimal: 0, sufficient: 0, poor: 0 },
  );
}

function hasScore(
  day: DailySleepConsistency,
): day is DailySleepConsistency & { score: number } {
  return day.score !== null;
}

function between(date: string, start: number, end: number): boolean {
  const instant = parseDate(date);
  return instant >= start && instant <= end;
}

function periodLabel(
  days: DailySleepConsistency[],
  rangeDays: TrendRangeDays,
): string {
  return days.length
    ? `${days[0]?.date} – ${days.at(-1)?.date}`
    : `Last ${rangeDays} days`;
}

function formatScore(value: number | null): string {
  return value === null ? "—" : `${Math.round(value)}%`;
}

function formatLocalTime(minutes: number): string {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${period}`;
}

function parseDate(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}
