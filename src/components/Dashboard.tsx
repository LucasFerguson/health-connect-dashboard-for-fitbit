"use client";

import type { HealthSnapshot } from "~/domain/health";
import { HealthDataProvider } from "~/features/health/HealthDataProvider";
import { SleepCalendar } from "./SleepCalendar";
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
          <section aria-labelledby="coming-heading">
            <h2 id="coming-heading" className="mb-3 text-2xl font-bold">
              More health signals
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {["Steps", "Calories", "Resting heart rate", "Weight"].map(
                (label) => (
                  <article
                    key={label}
                    className="min-h-28 rounded-xl border border-white/10 bg-white/5 p-4"
                  >
                    <h3 className="font-semibold">{label}</h3>
                    <p className="mt-2 text-sm text-white/50">
                      Ready for its data adapter
                    </p>
                  </article>
                ),
              )}
            </div>
          </section>
        </div>
      </main>
    </HealthDataProvider>
  );
}
