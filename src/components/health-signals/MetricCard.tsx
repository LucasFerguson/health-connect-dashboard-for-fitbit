import Link from "next/link";
import type { ReactNode } from "react";
import type { MetricAnalytics } from "~/domain/analytics";
import { healthSourceLabel } from "~/features/health/sourceLabels";
import { MetricTrendChart } from "./MetricTrendChart";

export function MetricCard({
  id,
  title,
  analytics,
  formatValue,
  color,
  chartType,
  secondary,
  trendDays,
  href,
}: {
  id: string;
  title: string;
  analytics: MetricAnalytics;
  formatValue: (value: number) => string;
  color: string;
  chartType: "bar" | "line";
  secondary?: ReactNode;
  trendDays?: number;
  href: string;
}) {
  const { latest, average7Day, changeFromPrevious } = analytics.overview;

  const card = (
    <article
      className="group rounded-xl border border-white/10 bg-white/10 p-5 transition hover:border-white/25 hover:bg-white/[0.13]"
      aria-labelledby={`${id}-heading`}
    >
      <div className="flex min-h-24 items-start justify-between gap-3">
        <div>
          <h3 id={`${id}-heading`} className="text-lg font-semibold">
            {title}
          </h3>
          {latest ? (
            <>
              <p className="mt-2 text-3xl font-bold tracking-tight">
                {formatValue(latest.value)}
              </p>
              <p className="mt-1 text-xs text-white/65">
                {latest.date} · {healthSourceLabel(latest.source)}
              </p>
            </>
          ) : (
            <p className="mt-4 text-sm text-white/65">No measurements yet</p>
          )}
        </div>
        {average7Day !== null ? (
          <div className="text-right text-xs text-white/70">
            <span className="block">7-day average</span>
            <strong className="mt-1 block text-sm text-white/85">
              {formatValue(average7Day)}
            </strong>
          </div>
        ) : null}
      </div>

      {secondary}
      {changeFromPrevious !== null ? (
        <p className="mt-3 text-xs text-white/70">
          {formatSigned(changeFromPrevious, formatValue)} from previous reading
        </p>
      ) : null}
      {latest ? (
        <MetricTrendChart
          data={analytics.daily}
          type={chartType}
          color={color}
          label={title}
          days={trendDays}
        />
      ) : (
        <div className="mt-4 flex h-44 items-center justify-center rounded-lg border border-dashed border-white/15 text-sm text-white/50">
          Trend appears after data is recorded
        </div>
      )}
      <p className="mt-2 text-xs font-medium text-violet-200 group-hover:text-white">
        Open detailed analytics →
      </p>
    </article>
  );

  return (
    <Link
      href={href}
      className="block rounded-xl focus:ring-2 focus:ring-violet-300 focus:outline-none"
    >
      {card}
    </Link>
  );
}

function formatSigned(value: number, formatter: (value: number) => string) {
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${formatter(Math.abs(value))}`;
}
