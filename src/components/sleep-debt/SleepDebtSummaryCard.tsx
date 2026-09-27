"use client";

import Link from "next/link";
import { useHealthData } from "~/features/health/HealthDataProvider";
import { formatDurationMinutes } from "~/features/health/metricFormatters";
import { SleepDebtMiniChart } from "./SleepDebtMiniChart";

export function SleepDebtSummaryCard() {
  const { sleepDebt } = useHealthData().snapshot.analytics;
  if (!sleepDebt.latest) return null;

  return (
    <section
      aria-labelledby="sleep-debt-heading"
      className="rounded-xl border border-sky-300/15 bg-white/10 p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-sky-200 uppercase">
            Recovery trend
          </p>
          <h2 id="sleep-debt-heading" className="mt-1 text-2xl font-bold">
            Rolling sleep debt
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-white/70">
            Daily shortfall against a{" "}
            {formatDurationMinutes(sleepDebt.targetMinutes)} target. Missing
            sleep records are not counted as debt.
          </p>
        </div>
        <Link
          href="/sleep-debt"
          className="rounded-lg bg-sky-300/15 px-4 py-2 text-sm font-semibold text-sky-100 hover:bg-sky-300/25"
        >
          Explore sleep debt →
        </Link>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          label="Latest"
          value={formatDurationMinutes(sleepDebt.latest.debtMinutes)}
        />
        <Stat
          label="7-day average"
          value={formatNullable(sleepDebt.average7DayMinutes)}
        />
        <Stat
          label="30-day average"
          value={formatNullable(sleepDebt.average30DayMinutes)}
        />
        <Stat
          label="High-debt days"
          value={`${sleepDebt.breakdown30Day.high} of ${sleepDebt.breakdown30Day.recordedDays}`}
        />
      </div>
      <SleepDebtMiniChart data={sleepDebt.daily} />
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

function formatNullable(value: number | null): string {
  return value === null ? "No data" : formatDurationMinutes(value);
}
