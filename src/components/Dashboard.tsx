import type { HealthSnapshot } from "~/domain/health";
import { HealthDataProvider } from "~/features/health/HealthDataProvider";
import { DeviceSleepComparison } from "./DeviceSleepComparison";
import { DailyHealthSummary } from "./daily-health/DailyHealthSummary";
import { ConnectedStatusBar } from "./dashboard/ConnectedStatusBar";
import { OverviewSection } from "./dashboard/OverviewSection";
import { HealthSignalsSection } from "./health-signals/HealthSignalsSection";
import { HealthspanCard } from "./healthspan/HealthspanCard";
import { SleepCalendar } from "./SleepCalendar";
import { SleepConsistencySummaryCard } from "./sleep-consistency/SleepConsistencySummaryCard";
import { SleepDebtSummaryCard } from "./sleep-debt/SleepDebtSummaryCard";
import { SleepStagesGraph } from "./SleepStagesGraph";

export function Dashboard({ snapshot }: { snapshot: HealthSnapshot }) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c] px-4 py-6 text-white">
      <div className="mx-auto max-w-7xl">
        <HealthDataProvider initialSnapshot={snapshot}>
          <ConnectedStatusBar />
          <header className="mb-5 sm:mb-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Health <span className="text-violet-300">Dashboard</span>
                </h1>
                <p className="mt-1 text-sm text-white/80">
                  Your health data, under your control.
                </p>
              </div>
            </div>
          </header>
          <div className="flex flex-col gap-6 sm:gap-8">
            <DailyHealthSummary />
            <HealthspanCard />
            <section aria-labelledby="sleep-heading">
              <h2
                id="sleep-heading"
                className="mb-3 text-xl font-bold sm:text-2xl"
              >
                Sleep overview
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
                <article className="rounded-xl bg-white/10 p-3 sm:min-h-96 sm:p-4">
                  <h3 className="mb-3 text-lg font-semibold">Sleep calendar</h3>
                  <SleepCalendar />
                </article>
                <article className="rounded-xl bg-white/10 p-3 sm:p-4 lg:col-span-2">
                  <h3 className="mb-3 text-lg font-semibold">Sleep stages</h3>
                  <SleepStagesGraph />
                </article>
              </div>
            </section>
            {/* Lower sections fold away on phones; open on larger screens. */}
            <OverviewSection
              id="sleep-debt-consistency"
              title="Sleep debt and consistency"
              description="Rolling sleep debt against your target, and how regular your sleep schedule has been."
            >
              <div className="grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-2">
                <SleepDebtSummaryCard />
                <SleepConsistencySummaryCard />
              </div>
            </OverviewSection>
            <OverviewSection
              id="device-comparison"
              title="Device sleep comparison"
              description="Average sleep reported by each source. Paired differences compare devices only when they recorded the same sleep event."
            >
              <DeviceSleepComparison />
            </OverviewSection>
            <OverviewSection
              id="signals"
              title="Long-term health trends"
              description="Longer-range trends from the prepared, source-aware daily record."
            >
              <HealthSignalsSection />
            </OverviewSection>
          </div>
        </HealthDataProvider>
      </div>
    </main>
  );
}
