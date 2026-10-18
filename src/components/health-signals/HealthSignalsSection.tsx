"use client";

import { useHealthData } from "~/features/health/HealthDataProvider";
import {
  formatCalories,
  formatHeartRate,
  formatSteps,
  formatWeight,
} from "~/features/health/metricFormatters";
import { MetricCard } from "./MetricCard";

const integer = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });

export function HealthSignalsSection() {
  const { analytics } = useHealthData().snapshot;
  const totalCalories = analytics.totalCalories.overview.latest;

  // The heading and intro live in the overview's collapsible section.
  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        id="steps"
        title="Steps"
        analytics={analytics.steps}
        formatValue={formatSteps}
        color="#a78bfa"
        chartType="bar"
        href="/steps"
      />
      <MetricCard
        id="calories"
        title="Active calories"
        analytics={analytics.activeCalories}
        formatValue={formatCalories}
        color="#fb923c"
        chartType="bar"
        href="/calories"
        secondary={
          totalCalories ? (
            <p className="mt-3 rounded-lg bg-white/5 px-3 py-2 text-xs text-white/75">
              Latest total: {integer.format(totalCalories.value)} kcal on{" "}
              {totalCalories.date}
            </p>
          ) : null
        }
      />
      <MetricCard
        id="resting-heart-rate"
        title="Resting heart rate"
        analytics={analytics.restingHeartRate}
        formatValue={formatHeartRate}
        color="#fb7185"
        chartType="line"
        href="/resting-heart-rate"
      />
      <MetricCard
        id="weight"
        title="Weight"
        analytics={analytics.weight}
        formatValue={formatWeight}
        color="#2dd4bf"
        chartType="line"
        trendDays={90}
        href="/weight"
      />
    </div>
  );
}
