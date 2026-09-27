"use client";

import Link from "next/link";
import { useHealthData } from "~/features/health/HealthDataProvider";
import { SleepConsistencyMiniChart } from "./SleepConsistencyMiniChart";

export function SleepConsistencySummaryCard() {
  const { sleepConsistency } = useHealthData().snapshot.analytics;
  if (!sleepConsistency.latest) return null;

  return (
    <section
      className="rounded-xl border border-emerald-300/15 bg-white/10 p-5"
      aria-labelledby="sleep-consistency-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-emerald-200 uppercase">
            Schedule trend
          </p>
          <h2
            id="sleep-consistency-heading"
            className="mt-1 text-2xl font-bold"
          >
            Sleep consistency
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-white/70">
            Bedtime and wake-time regularity against your preceding 14-day
            schedule.
          </p>
        </div>
        <Link
          href="/sleep-consistency"
          className="rounded-lg bg-emerald-300/15 px-4 py-2 text-sm font-semibold text-emerald-100 hover:bg-emerald-300/25"
        >
          Explore consistency →
        </Link>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-2">
        <Stat
          label="Latest"
          value={formatScore(sleepConsistency.latest.score)}
        />
        <Stat
          label="7-day average"
          value={formatScore(sleepConsistency.average7DayScore)}
        />
        <Stat
          label="30-day average"
          value={formatScore(sleepConsistency.average30DayScore)}
        />
        <Stat
          label="Optimal days"
          value={`${sleepConsistency.breakdown30Day.optimal} of ${sleepConsistency.breakdown30Day.scoredDays}`}
        />
      </div>
      <SleepConsistencyMiniChart data={sleepConsistency.daily} />
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-black/10 p-3">
      <p className="text-xs text-white/60">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function formatScore(value: number | null): string {
  return value === null ? "No data" : `${Math.round(value)}%`;
}
