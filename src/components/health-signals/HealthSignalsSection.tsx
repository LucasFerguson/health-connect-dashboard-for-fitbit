"use client";

import { useHealthData } from "~/features/health/HealthDataProvider";
import { MetricCard } from "./MetricCard";

const integer = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });

export function HealthSignalsSection() {
  const { analytics } = useHealthData().snapshot;
  const totalCalories = analytics.totalCalories.overview.latest;

  return (
    <section aria-labelledby="signals-heading">
      <div className="mb-3">
        <h2 id="signals-heading" className="text-2xl font-bold">
          Health signals
        </h2>
        <p className="mt-1 text-sm text-white/60">
          Prepared daily analytics with source-aware aggregation.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          id="steps"
          title="Steps"
          analytics={analytics.steps}
          formatValue={(value) => integer.format(value)}
          color="#a78bfa"
          chartType="bar"
        />
        <MetricCard
          id="calories"
          title="Active calories"
          analytics={analytics.activeCalories}
          formatValue={(value) => `${integer.format(value)} kcal`}
          color="#fb923c"
          chartType="bar"
          secondary={
            totalCalories ? (
              <p className="mt-3 rounded-lg bg-white/5 px-3 py-2 text-xs text-white/60">
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
          formatValue={(value) => `${integer.format(value)} bpm`}
          color="#fb7185"
          chartType="line"
        />
        <MetricCard
          id="weight"
          title="Weight"
          analytics={analytics.weight}
          formatValue={(value) => `${decimal.format(value)} kg`}
          color="#2dd4bf"
          chartType="line"
          trendDays={90}
          secondary={
            analytics.weight.overview.latest ? (
              <p className="mt-3 text-xs text-white/50">
                {decimal.format(
                  analytics.weight.overview.latest.value * 2.2046226218,
                )}{" "}
                lb
              </p>
            ) : null
          }
        />
      </div>
    </section>
  );
}
