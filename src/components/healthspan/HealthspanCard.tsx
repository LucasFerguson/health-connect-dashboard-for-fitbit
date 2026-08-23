"use client";

import Link from "next/link";
import { useHealthData } from "~/features/health/HealthDataProvider";

export function HealthspanCard() {
  const healthspan = useHealthData().snapshot.analytics.healthspan;
  const latest = healthspan.latest;
  return (
    <section
      className="overflow-hidden rounded-2xl border border-amber-300/20 bg-[radial-gradient(circle_at_20%_20%,rgba(251,191,36,0.18),transparent_38%),rgba(255,255,255,0.08)] p-5 sm:p-7"
      aria-labelledby="healthspan-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.2em] text-amber-200 uppercase">
            Experimental healthspan
          </p>
          <h2 id="healthspan-heading" className="mt-2 text-3xl font-extrabold">
            Health age and pace of aging
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/60">
            An explainable composite of sleep duration, sleep consistency,
            steps, and resting heart rate. Every year added or removed is
            traceable to a prepared signal.
          </p>
          <Link
            href="/healthspan"
            className="mt-5 inline-flex rounded-lg bg-amber-300/15 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-300/25"
          >
            Open healthspan →
          </Link>
        </div>
        <div className="grid min-w-64 grid-cols-2 gap-3">
          <Stat
            label="Health age"
            value={
              latest?.healthAgeYears === null ||
              latest?.healthAgeYears === undefined
                ? "Calibrating"
                : `${latest.healthAgeYears.toFixed(1)} yr`
            }
          />
          <Stat
            label="Pace"
            value={
              healthspan.paceOfAging === null
                ? "—"
                : `${healthspan.paceOfAging.toFixed(2)}×`
            }
          />
          <Stat
            label="Age adjustment"
            value={
              latest?.ageDeltaYears === null ||
              latest?.ageDeltaYears === undefined
                ? "—"
                : signedYears(latest.ageDeltaYears)
            }
          />
          <Stat
            label="Factors ready"
            value={`${latest?.factors.length ?? 0} / 4`}
          />
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/15 p-3">
      <p className="text-xs text-white/45">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function signedYears(value: number): string {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)} yr`;
}
