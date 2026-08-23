"use client";

import type { HealthSnapshot } from "~/domain/health";
import { HealthDataProvider } from "~/features/health/HealthDataProvider";
import { DeviceSleepComparison } from "./DeviceSleepComparison";
import { DailyHealthSummary } from "./daily-health/DailyHealthSummary";
import { HealthSignalsSection } from "./health-signals/HealthSignalsSection";
import { HealthspanCard } from "./healthspan/HealthspanCard";
import { SleepCalendar } from "./SleepCalendar";
import { SleepConsistencySummaryCard } from "./sleep-consistency/SleepConsistencySummaryCard";
import { SleepDebtSummaryCard } from "./sleep-debt/SleepDebtSummaryCard";
import { SleepStagesGraph } from "./SleepStagesGraph";

export function Dashboard({ snapshot }: { snapshot: HealthSnapshot }) {
  return (
    <HealthDataProvider initialSnapshot={snapshot}>
      <main className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c] px-4 py-6 text-white">
        <header className="mx-auto mb-8 max-w-7xl">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Health <span className="text-violet-300">Dashboard</span>
              </h1>
              <p className="mt-1 text-sm text-white/70">
                Your health data, under your control.
              </p>
            </div>
            <p className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
              Source:{" "}
              {snapshot.source === "fixture" ? "demo data" : "Health Connect"}
            </p>
          </div>
        </header>
        <div className="mx-auto flex max-w-7xl flex-col gap-8">
          <DailyHealthSummary />
          <HealthspanCard />
          <section aria-labelledby="sleep-heading">
            <h2 id="sleep-heading" className="mb-3 text-2xl font-bold">
              Sleep overview
            </h2>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <article className="min-h-96 rounded-xl bg-white/10 p-4">
                <h3 className="mb-3 text-lg font-semibold">Sleep calendar</h3>
                <SleepCalendar />
              </article>
              <article className="rounded-xl bg-white/10 p-4 lg:col-span-2">
                <h3 className="mb-3 text-lg font-semibold">Sleep stages</h3>
                <SleepStagesGraph />
              </article>
            </div>
          </section>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <SleepDebtSummaryCard />
            <SleepConsistencySummaryCard />
          </div>
          <DeviceSleepComparison />
          <HealthSignalsSection />
        </div>
      </main>
    </HealthDataProvider>
  );
}
