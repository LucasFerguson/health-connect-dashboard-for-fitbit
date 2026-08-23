import Link from "next/link";
import type { HealthspanAnalytics, HealthspanFactor } from "~/domain/analytics";
import { formatDurationMinutes } from "~/features/health/metricFormatters";
import { HealthspanTrendCharts } from "./HealthspanTrendCharts";

export function HealthspanPage({
  analytics,
}: {
  analytics: HealthspanAnalytics;
}) {
  const latest = analytics.latest;
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#182023] to-[#0d1214] px-4 py-6 text-white">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/"
          className="inline-flex rounded-lg px-2 py-1 text-sm text-amber-200 hover:bg-white/10 hover:text-white"
        >
          ← Health dashboard
        </Link>

        <header className="mt-6 text-center">
          <p className="text-xs font-semibold tracking-[0.25em] text-white/55 uppercase">
            Healthspan · {analytics.modelVersion}
          </p>
          <div className="mx-auto mt-8 flex h-72 w-72 items-center justify-center [border-radius:45%_55%_61%_39%/43%_38%_62%_57%] bg-[radial-gradient(circle,rgba(8,12,14,0.95)_28%,rgba(245,158,11,0.34)_55%,rgba(250,204,21,0.74)_78%,rgba(245,158,11,0.18)_80%,transparent_81%)]">
            <div>
              <p className="text-5xl font-bold tracking-tight">
                {latest?.healthAgeYears === null ||
                latest?.healthAgeYears === undefined
                  ? "—"
                  : latest.healthAgeYears.toFixed(1)}
              </p>
              <p className="mt-1 text-xs font-bold tracking-[0.16em] text-white/55 uppercase">
                Health age
              </p>
              <p className="mt-2 text-sm text-sky-200">
                {latest?.chronologicalAgeYears === null ||
                latest?.chronologicalAgeYears === undefined
                  ? "Birth date required"
                  : `${latest.chronologicalAgeYears.toFixed(1)} chronological`}
              </p>
            </div>
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-6 text-white/55">
            Experimental wellness estimate—not a biological-age test or medical
            measurement.
          </p>
        </header>

        {analytics.calibrationReasons.length ? (
          <section className="mt-8 rounded-xl border border-sky-300/20 bg-sky-300/10 p-5">
            <h2 className="font-semibold text-sky-100">
              Health age is calibrating
            </h2>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-white/65">
              {analytics.calibrationReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section
          className="mt-8 grid gap-4 sm:grid-cols-3"
          aria-label="Healthspan summary"
        >
          <Summary
            label="Age adjustment"
            value={
              latest?.ageDeltaYears === null ||
              latest?.ageDeltaYears === undefined
                ? "—"
                : signedYears(latest.ageDeltaYears)
            }
          />
          <Summary
            label="Pace of aging"
            value={
              analytics.paceOfAging === null
                ? "Calibrating"
                : `${analytics.paceOfAging.toFixed(2)}×`
            }
          />
          <Summary
            label="Prepared factors"
            value={`${latest?.factors.length ?? 0} of 4`}
          />
        </section>

        <section className="mt-8 rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">What moves your health age</h2>
              <p className="mt-1 text-sm text-white/55">
                Thirty-day prepared averages and their exact model contribution.
              </p>
            </div>
            <p className="text-xs text-white/40">
              Latest estimate: {latest?.date ?? "not available"}
            </p>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {(latest?.factors ?? []).map((factor) => (
              <FactorCard key={factor.key} factor={factor} />
            ))}
          </div>
          {!latest?.factors.length ? (
            <p className="mt-6 text-sm text-white/45">
              Factor cards will appear once prepared signal coverage is
              available.
            </p>
          ) : null}
        </section>

        <div className="mt-8">
          <HealthspanTrendCharts trend={analytics.trend} />
        </div>

        <section className="mt-8 rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-semibold">Model notes</h2>
          <p className="mt-2 text-sm leading-6 text-white/60">
            {analytics.methodology}
          </p>
          <p className="mt-3 text-sm leading-6 text-white/45">
            Exact birth date is used only by the processing context; the
            analytics model exposes whether it is configured without storing it
            in the summary document.
          </p>
        </section>
      </div>
    </main>
  );
}

function FactorCard({ factor }: { factor: HealthspanFactor }) {
  const position = factorPosition(factor);
  return (
    <article className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xs font-bold tracking-wide uppercase">
            {factor.label}
          </h3>
          <p className="mt-2 text-xl font-semibold">
            {formatFactorValue(factor)}
          </p>
          <p className="mt-1 text-xs text-white/40">
            {factor.coverageDays} recorded days · reference{" "}
            {formatReference(factor)}
          </p>
        </div>
        <strong
          className={
            factor.ageImpactYears <= 0 ? "text-emerald-300" : "text-amber-300"
          }
        >
          {signedYears(factor.ageImpactYears)}
        </strong>
      </div>
      <div className="relative mt-5 h-2 rounded-full bg-gradient-to-r from-amber-400 via-slate-500 to-emerald-400">
        <span
          className="absolute top-1/2 h-4 w-1 -translate-y-1/2 rounded bg-white shadow"
          style={{ left: `${position}%` }}
        />
      </div>
    </article>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
      <p className="text-xs text-white/45">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </article>
  );
}

function formatFactorValue(factor: HealthspanFactor): string {
  switch (factor.unit) {
    case "minutes":
      return formatDurationMinutes(factor.value);
    case "percent":
      return `${Math.round(factor.value)}%`;
    case "steps":
      return `${Math.round(factor.value).toLocaleString()} steps`;
    case "bpm":
      return `${Math.round(factor.value)} bpm`;
  }
}

function formatReference(factor: HealthspanFactor): string {
  return formatFactorValue({ ...factor, value: factor.referenceValue });
}

function factorPosition(factor: HealthspanFactor): number {
  switch (factor.key) {
    case "sleep_duration":
      return clamp(((factor.value - 300) / 240) * 100);
    case "sleep_consistency":
      return clamp(factor.value);
    case "steps":
      return clamp((factor.value / 16_000) * 100);
    case "resting_heart_rate":
      return clamp(((90 - factor.value) / 50) * 100);
  }
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function signedYears(value: number): string {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)} years`;
}
