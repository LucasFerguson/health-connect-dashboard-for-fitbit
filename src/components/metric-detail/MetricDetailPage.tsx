import Link from "next/link";
import type { MetricAnalytics } from "~/domain/analytics";
import { healthSourceLabel } from "~/features/health/sourceLabels";
import type { MetricKind } from "~/features/health/metricPresentation";
import { metricPresentation } from "~/features/health/metricPresentation";
import { MetricHistoryChart } from "./MetricHistoryChart";
import { MonthlyMetricChart } from "./MonthlyMetricChart";
import { YearHeatmap } from "./YearHeatmap";

export function MetricDetailPage({
  kind,
  analytics,
  secondaryAnalytics,
  selectedDate,
}: {
  kind: MetricKind;
  analytics: MetricAnalytics;
  secondaryAnalytics?: MetricAnalytics;
  selectedDate?: string;
}) {
  const presentation = metricPresentation(kind);
  const { latest, average7Day, average30Day, changeFromPrevious, sampleCount } =
    analytics.overview;
  const selected = selectedDate
    ? analytics.daily.find((day) => day.date === selectedDate)
    : null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c] px-4 py-6 text-white">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/"
          className="inline-flex rounded-lg px-2 py-1 text-sm text-violet-200 hover:bg-white/10 hover:text-white"
        >
          ← Health dashboard
        </Link>
        <header className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold tracking-[0.18em] text-violet-200 uppercase">
              {presentation.eyebrow}
            </p>
            <h1 className="mt-1 text-4xl font-extrabold tracking-tight">
              {presentation.title}
            </h1>
            <p className="mt-2 text-white/65">{presentation.description}</p>
          </div>
          {latest ? (
            <div className="rounded-xl border border-white/10 bg-white/10 px-5 py-3 text-right">
              <p className="text-xs text-white/50">
                Latest reading · {latest.date}
              </p>
              <p className="mt-1 text-2xl font-bold">
                {presentation.formatValue(latest.value)}
              </p>
              <p className="text-xs text-white/45">
                {healthSourceLabel(latest.source)}
              </p>
            </div>
          ) : null}
        </header>

        {selectedDate ? (
          <section className="mt-8 rounded-xl border border-violet-300/25 bg-violet-300/10 p-5">
            <p className="text-xs font-semibold tracking-wide text-violet-200 uppercase">
              Selected day · {selectedDate}
            </p>
            {selected ? (
              <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-3xl font-bold">
                    {presentation.formatValue(selected.value)}
                  </p>
                  <p className="mt-1 text-sm text-white/55">
                    Displayed source: {healthSourceLabel(selected.source)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selected.bySource.map((reading) => (
                    <div
                      key={reading.source}
                      className="rounded-lg border border-white/10 bg-black/10 px-3 py-2 text-sm"
                    >
                      <span className="text-white/55">
                        {healthSourceLabel(reading.source)}
                      </span>{" "}
                      <strong>{presentation.formatValue(reading.value)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-white/55">
                No {presentation.title.toLowerCase()} reading was recorded for
                this day.
              </p>
            )}
          </section>
        ) : null}

        <section
          className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4"
          aria-label="Summary statistics"
        >
          <SummaryStat
            label="7-day average"
            value={formatNullable(average7Day, presentation.formatValue)}
          />
          <SummaryStat
            label="30-day average"
            value={formatNullable(average30Day, presentation.formatValue)}
          />
          <SummaryStat
            label="Change from prior"
            value={formatChange(changeFromPrevious, presentation.formatValue)}
          />
          <SummaryStat label="Recorded days" value={String(sampleCount)} />
        </section>

        {analytics.daily.length ? (
          <div className="mt-8 flex flex-col gap-6">
            <YearHeatmap
              data={analytics.daily}
              kind={kind}
              initialDate={selectedDate}
            />
            <MetricHistoryChart
              analytics={analytics}
              secondary={secondaryAnalytics}
              kind={kind}
            />
            <MonthlyMetricChart data={analytics.monthly} kind={kind} />
          </div>
        ) : (
          <div className="mt-8 rounded-xl border border-dashed border-white/15 p-12 text-center text-white/45">
            These visualizations will appear after measurements are available.
          </div>
        )}
      </div>
    </main>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border border-white/10 bg-white/10 p-4">
      <p className="text-xs text-white/50">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </article>
  );
}

function formatNullable(
  value: number | null,
  formatter: (value: number) => string,
): string {
  return value === null ? "Not enough data" : formatter(value);
}

function formatChange(
  value: number | null,
  formatter: (value: number) => string,
): string {
  if (value === null) return "Not enough data";
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${formatter(Math.abs(value))}`;
}
