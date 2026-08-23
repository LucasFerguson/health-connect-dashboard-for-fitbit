"use client";

import { addDays, format, parseISO } from "date-fns";
import { useMemo } from "react";
import { useHealthData } from "~/features/health/HealthDataProvider";
import { selectDailyHealth } from "~/features/health/dailySelectors";
import {
  formatCalories,
  formatHeartRate,
  formatKilograms,
  formatPounds,
  formatSteps,
} from "~/features/health/metricFormatters";
import { healthSourceLabel } from "~/features/health/sourceLabels";
import { DailyMetricTile } from "./DailyMetricTile";

export function DailyHealthSummary() {
  const { snapshot, selectedDate, selectDate } = useHealthData();
  const date = selectedDate ?? snapshot.generatedAt.slice(0, 10);
  const day = useMemo(
    () => selectDailyHealth(snapshot, date),
    [snapshot, date],
  );
  const sleepSources = [
    ...new Set(
      day.sleepEvents.map((event) => healthSourceLabel(event.primary.source)),
    ),
  ].join(" + ");

  const shiftDate = (amount: number) =>
    selectDate(format(addDays(parseISO(date), amount), "yyyy-MM-dd"));

  return (
    <section aria-labelledby="daily-health-heading">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-violet-200 uppercase">
            Day at a glance
          </p>
          <h2 id="daily-health-heading" className="mt-1 text-2xl font-bold">
            {format(parseISO(date), "EEEE, MMMM d, yyyy")}
          </h2>
          <p className="mt-1 text-sm text-white/55">
            Choose a date here or from the sleep calendar below.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 p-2">
          <button
            type="button"
            aria-label="Previous day"
            onClick={() => shiftDate(-1)}
            className="rounded-lg px-3 py-2 text-lg text-white/70 hover:bg-white/10 hover:text-white"
          >
            ←
          </button>
          <label className="sr-only" htmlFor="daily-health-date">
            Health summary date
          </label>
          <input
            id="daily-health-date"
            type="date"
            value={date}
            onChange={(event) => selectDate(event.target.value || null)}
            className="rounded-lg border border-white/15 bg-[#21154b] px-3 py-2 text-sm text-white [color-scheme:dark]"
          />
          <button
            type="button"
            aria-label="Next day"
            onClick={() => shiftDate(1)}
            className="rounded-lg px-3 py-2 text-lg text-white/70 hover:bg-white/10 hover:text-white"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <DailyMetricTile
          title="Sleep"
          value={day.sleep ? formatDuration(day.sleep.sleepMinutes) : null}
          secondary={
            day.sleep
              ? `${day.sleep.eventCount} session${day.sleep.eventCount === 1 ? "" : "s"}`
              : null
          }
          source={sleepSources || null}
          accent="#8b5cf6"
        />
        <DailyMetricTile
          title="Steps"
          value={day.steps ? formatSteps(day.steps.value) : null}
          secondary="steps"
          source={source(day.steps?.source)}
          href={`/steps?date=${date}`}
          accent="#a78bfa"
        />
        <DailyMetricTile
          title="Calories"
          value={
            day.activeCalories ? formatCalories(day.activeCalories.value) : null
          }
          secondary={
            day.totalCalories
              ? `${formatCalories(day.totalCalories.value)} total`
              : "active calories"
          }
          source={source(day.activeCalories?.source)}
          href={`/calories?date=${date}`}
          accent="#fb923c"
        />
        <DailyMetricTile
          title="Resting heart rate"
          value={
            day.restingHeartRate
              ? formatHeartRate(day.restingHeartRate.value)
              : null
          }
          source={source(day.restingHeartRate?.source)}
          href={`/resting-heart-rate?date=${date}`}
          accent="#fb7185"
        />
        <DailyMetricTile
          title="Weight"
          value={day.weight ? formatKilograms(day.weight.value) : null}
          secondary={day.weight ? formatPounds(day.weight.value) : null}
          source={source(day.weight?.source)}
          href={`/weight?date=${date}`}
          accent="#2dd4bf"
        />
      </div>
    </section>
  );
}

function source(value: string | undefined): string | null {
  return value ? healthSourceLabel(value) : null;
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  return `${hours}h ${remainingMinutes}m`;
}
