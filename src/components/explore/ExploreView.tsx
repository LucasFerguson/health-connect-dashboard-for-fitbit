"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { Card } from "~/components/ui/Card";
import { Label } from "~/components/ui/Label";
import { PageShell } from "~/components/ui/PageShell";
import { Spinner } from "~/components/ui/Spinner";
import { notchStyle } from "~/components/ui/notch";
import { pairSeries, summarizePairs } from "~/domain/correlation";
import type { DateKey } from "~/domain/health";
import {
  METRICS,
  buildCatalog,
  formatMetricDelta,
  formatSlopeStep,
  metricGroups,
  seriesOf,
  type ExploreSeries,
  type MetricDefinition,
  type MetricId,
} from "~/domain/exploreMetrics";
import {
  EXPLORE_RANGES,
  MAX_LAG,
  exploreSearch,
  type ExploreMode,
  type ExploreRange,
  type ExploreSelection,
} from "~/domain/exploreParams";
import { ExploreGroupChart } from "./ExploreGroupChart";
import { ExploreLineChart } from "./ExploreLineChart";
import {
  GroupComparisonView,
  HabitCrossTab,
  HabitOutOfRange,
} from "./HabitComparison";
import { Stat, formatR, yPhrase } from "./ExploreStat";
import { ExploreScatterChart } from "./ExploreScatterChart";
import { EXPLORE_COLORS } from "./chartTheme";

type Window = { from: DateKey | null; to: DateKey };

/**
 * `/explore`: plot any daily metric against any other. The selection lives
 * in the URL. Axis, mode and lag changes rewrite it in place with
 * `history.replaceState` (Next keeps `useSearchParams` in sync, and nothing
 * refetches); a range change navigates, because the server fetches only the
 * selected window.
 *
 * A habit (a yes/no journal question) on either axis changes the view: a
 * 0/1 scatter hides everything in two stacked lines, so the pairing becomes
 * a group comparison (the other metric on yes days vs no days), or a 2×2
 * table when both axes are habits. See `HabitComparison.tsx`.
 */
export function ExploreView({
  initialSelection,
  habitMetrics,
  series,
  window,
}: {
  initialSelection: ExploreSelection;
  habitMetrics: MetricDefinition[];
  series: ExploreSeries;
  window: Window;
}) {
  const router = useRouter();
  const [selection, setSelection] = useState(initialSelection);
  const [loadingRange, startRangeTransition] = useTransition();
  const lastRange = useRef(initialSelection.range);

  useEffect(() => {
    const search = exploreSearch(selection);
    if (selection.range !== lastRange.current) {
      lastRange.current = selection.range;
      startRangeTransition(() => {
        router.replace(`/explore?${search}`, { scroll: false });
      });
    } else if (globalThis.location.search !== `?${search}`) {
      globalThis.history.replaceState(null, "", `?${search}`);
    }
  }, [selection, router]);

  const update = (patch: Partial<ExploreSelection>) =>
    setSelection((current) => ({ ...current, ...patch }));

  const catalog = useMemo(() => buildCatalog(habitMetrics), [habitMetrics]);
  const groups = useMemo(() => metricGroups(catalog), [catalog]);
  const x = catalog.get(selection.x) ?? METRICS.steps;
  const y = catalog.get(selection.y) ?? METRICS.sleepDuration;
  const counts = useMemo(
    () => countInWindow(series, window, catalog),
    [series, window, catalog],
  );
  const pairs = useMemo(
    () =>
      pairSeries(
        seriesOf(series, selection.x),
        seriesOf(series, selection.y),
        selection.lag,
        window,
      ),
    [series, selection.x, selection.y, selection.lag, window],
  );
  const summary = useMemo(() => summarizePairs(pairs), [pairs]);
  const binaryX = x.kind === "binary";
  const binaryY = y.kind === "binary";
  // A habit with no answers in the window: say where its answers are
  // instead of drawing an empty chart.
  const emptyHabit = [x, y].find(
    (metric) => metric.kind === "binary" && (counts.get(metric.id) ?? 0) === 0,
  );

  return (
    <PageShell>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <h1 className="font-display text-[28px] leading-none tracking-[.12em]">
            EXPLORE
          </h1>
          <p className="text-ink-100 font-prose mt-2 max-w-2xl text-sm">
            Plot any daily metric against any other to look for relationships.
            Only days where both metrics have a value are compared; a missing
            day is left out, never counted as zero.
          </p>
        </div>
        <Label>
          {window.from ? `${window.from} → ${window.to}` : `ALL → ${window.to}`}
        </Label>
      </header>

      <Card className="mb-4 flex flex-col gap-4" padding="p-4">
        <div className="grid items-end gap-3 md:grid-cols-[1fr_auto_1fr]">
          <MetricPicker
            axis="X"
            color={EXPLORE_COLORS.x}
            value={selection.x}
            counts={counts}
            groups={groups}
            catalog={catalog}
            onChange={(id) => update({ x: id })}
          />
          <button
            type="button"
            onClick={() => update({ x: selection.y, y: selection.x })}
            className="border-ink-500 text-ink-100 hover:border-ink-400 hover:bg-ink-700 hover:text-ink-0 flex h-9 items-center justify-center gap-1.5 self-end border px-3 font-mono text-[10px] tracking-[.08em] transition-colors duration-[120ms]"
            style={notchStyle(7)}
            aria-label="Swap X and Y"
            title="Swap X and Y"
          >
            <span aria-hidden className="text-sm leading-none">
              ⇄
            </span>
            SWAP
          </button>
          <MetricPicker
            axis="Y"
            color={EXPLORE_COLORS.y}
            value={selection.y}
            counts={counts}
            groups={groups}
            catalog={catalog}
            onChange={(id) => update({ y: id })}
          />
        </div>

        <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
          <ToggleGroup<ExploreMode>
            label="MODE"
            value={selection.mode}
            options={[
              {
                value: "scatter",
                label:
                  binaryX && binaryY
                    ? "2×2"
                    : binaryX || binaryY
                      ? "GROUPS"
                      : "SCATTER",
              },
              { value: "line", label: "LINE" },
            ]}
            onChange={(mode) => update({ mode })}
          />
          <div className="flex items-end gap-2">
            <ToggleGroup<ExploreRange>
              label="RANGE"
              value={selection.range}
              options={EXPLORE_RANGES.map((range) => ({
                value: range.key,
                label: range.label,
              }))}
              onChange={(range) => update({ range })}
            />
            {loadingRange ? (
              <span className="mb-2">
                <Spinner size={12} />
              </span>
            ) : null}
          </div>
          <LagControl
            lag={selection.lag}
            x={x}
            y={y}
            onChange={(lag) => update({ lag })}
          />
        </div>
      </Card>

      {emptyHabit ? (
        <HabitOutOfRange
          habit={emptyHabit}
          range={selection.range}
          loading={loadingRange}
          onShowAll={() => update({ range: "all" })}
        />
      ) : (
        <>
          {binaryX && binaryY ? null : binaryX || binaryY ? (
            <GroupComparisonView
              x={x}
              y={y}
              pairs={pairs}
              summary={summary}
              lag={selection.lag}
              className={clsx(loadingRange && "opacity-60")}
            />
          ) : (
            <StatsRow
              x={x}
              y={y}
              summary={summary}
              lag={selection.lag}
              className={clsx(loadingRange && "opacity-60")}
            />
          )}

          <Card
            className={clsx(
              binaryX && binaryY ? "" : "mt-4",
              loadingRange && "opacity-60",
            )}
            padding="p-3 sm:p-4"
          >
            {selection.mode === "scatter" ? (
              summary.n === 0 ? (
                <NoOverlap x={x} y={y} counts={counts} />
              ) : binaryX && binaryY ? (
                <HabitCrossTab
                  x={x}
                  y={y}
                  pairs={pairs}
                  summary={summary}
                  lag={selection.lag}
                />
              ) : binaryX || binaryY ? (
                <ExploreGroupChart
                  x={x}
                  y={y}
                  pairs={pairs}
                  lag={selection.lag}
                />
              ) : (
                <ExploreScatterChart
                  x={x}
                  y={y}
                  pairs={pairs}
                  summary={summary}
                />
              )
            ) : (
              <ExploreLineChart
                x={x}
                y={y}
                xSeries={seriesOf(series, selection.x)}
                ySeries={seriesOf(series, selection.y)}
                lag={selection.lag}
                window={window}
              />
            )}
          </Card>
        </>
      )}

      <p className="text-ink-100 font-prose mt-4 max-w-3xl text-xs leading-5">
        Correlation is not causation. Two metrics can move together because
        something else drives both (a busy week, illness, the season), and when
        you compare many pairs and lags, some will look related by chance alone.
        Treat a pattern here as a question to test, not an answer.
      </p>
    </PageShell>
  );
}

type Counts = ReadonlyMap<MetricId, number>;

function countInWindow(
  series: ExploreSeries,
  window: Window,
  catalog: ReadonlyMap<MetricId, MetricDefinition>,
): Counts {
  const counts = new Map<MetricId, number>();
  for (const id of catalog.keys()) {
    counts.set(
      id,
      seriesOf(series, id).filter(
        (point) =>
          (!window.from || point.date >= window.from) &&
          point.date <= window.to,
      ).length,
    );
  }
  return counts;
}

function MetricPicker({
  axis,
  color,
  value,
  counts,
  groups,
  catalog,
  onChange,
}: {
  axis: "X" | "Y";
  color: string;
  value: MetricId;
  counts: Counts;
  groups: { group: string; metrics: MetricDefinition[] }[];
  catalog: ReadonlyMap<MetricId, MetricDefinition>;
  onChange: (id: MetricId) => void;
}) {
  const id = `explore-metric-${axis}`;
  const metric = catalog.get(value) ?? METRICS.steps;
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="flex items-center gap-2">
        <span
          aria-hidden
          className="block size-2.5"
          style={{ backgroundColor: color }}
        />
        <Label>{axis} AXIS</Label>
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => {
          const next = [...catalog.values()].find(
            (option) => option.id === event.target.value,
          );
          if (next) onChange(next.id);
        }}
        className="border-ink-500 bg-ink-900 text-ink-0 hover:border-ink-400 focus-visible:border-brand-400 h-9 w-full min-w-0 border px-2.5 font-mono text-[12px] outline-none"
        style={notchStyle(7)}
      >
        {groups.map(({ group, metrics }) => (
          <optgroup key={group} label={group}>
            {metrics.map((option) => {
              const count = counts.get(option.id) ?? 0;
              // A habit stays selectable with no answers in range: picking
              // it shows where its answers are and offers the range that
              // has them, instead of a dead option.
              const habit = option.kind === "binary";
              return (
                <option
                  key={option.id}
                  value={option.id}
                  disabled={count === 0 && !habit && option.id !== value}
                >
                  {option.label}
                  {count === 0
                    ? habit
                      ? " — none in range"
                      : " — no data"
                    : ` · ${count}d`}
                </option>
              );
            })}
          </optgroup>
        ))}
      </select>
      <p className="text-ink-200 font-prose text-[11px] leading-4">
        {metric.note}
      </p>
    </div>
  );
}

function ToggleGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <div role="group" aria-label={label} className="flex">
        {options.map((option, index) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.value)}
              className={clsx(
                "h-8 border px-3 font-mono text-[10px] tracking-[.08em] transition-colors duration-[120ms]",
                index > 0 && "-ml-px",
                active
                  ? "border-brand-400 bg-brand-950 text-ink-0 relative z-10"
                  : "border-ink-500 text-ink-100 hover:bg-ink-700 hover:text-ink-0",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** "Y is read 1 day after X" etc. */
function describeLag(lag: number, x: MetricDefinition, y: MetricDefinition) {
  // Journal questions are quoted and keep their case, so the sentence
  // doesn't read "does consumed caffeine? lead?".
  const name = (metric: MetricDefinition) =>
    metric.kind === "binary" ? `“${metric.label}”` : metric.label;
  const inline = (metric: MetricDefinition) =>
    metric.kind === "binary" ? name(metric) : metric.label.toLowerCase();
  if (lag === 0) return `Same day: ${name(x)} and ${name(y)} from one date.`;
  const days = `${Math.abs(lag)} day${Math.abs(lag) === 1 ? "" : "s"}`;
  return lag > 0
    ? `${name(y)} from ${days} after ${name(x)}: does ${inline(x)} lead?`
    : `${name(y)} from ${days} before ${name(x)}: does ${inline(y)} lead?`;
}

function LagControl({
  lag,
  x,
  y,
  onChange,
}: {
  lag: number;
  x: MetricDefinition;
  y: MetricDefinition;
  onChange: (lag: number) => void;
}) {
  const stepper =
    "border-ink-500 text-ink-100 hover:bg-ink-700 hover:text-ink-0 flex size-8 items-center justify-center border font-mono text-sm disabled:opacity-40 disabled:pointer-events-none";
  return (
    <div className="flex min-w-0 flex-1 basis-72 flex-col gap-1.5">
      <Label>
        LAG · Y SHIFTED {lag > 0 ? "+" : lag < 0 ? "−" : "±"}
        {Math.abs(lag)}D
      </Label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={stepper}
          onClick={() => onChange(lag - 1)}
          disabled={lag <= -MAX_LAG}
          aria-label="Read Y one day earlier"
        >
          −
        </button>
        <input
          type="range"
          min={-MAX_LAG}
          max={MAX_LAG}
          step={1}
          value={lag}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-label="Lag in days: Y is read this many days after X"
          aria-valuetext={describeLag(lag, x, y)}
          className="accent-brand-400 min-w-0 flex-1"
        />
        <button
          type="button"
          className={stepper}
          onClick={() => onChange(lag + 1)}
          disabled={lag >= MAX_LAG}
          aria-label="Read Y one day later"
        >
          +
        </button>
        <button
          type="button"
          className={clsx(stepper, "w-auto px-2 text-[10px] tracking-[.08em]")}
          onClick={() => onChange(0)}
          disabled={lag === 0}
        >
          RESET
        </button>
      </div>
      <p className="text-ink-100 font-prose text-[11px] leading-4">
        X on day <em>d</em> is paired with Y on day{" "}
        <em>
          d {lag >= 0 ? "+" : "−"} {Math.abs(lag)}
        </em>
        . {describeLag(lag, x, y)}
      </p>
    </div>
  );
}

function StatsRow({
  x,
  y,
  summary,
  lag,
  className,
}: {
  x: MetricDefinition;
  y: MetricDefinition;
  summary: ReturnType<typeof summarizePairs>;
  lag: number;
  className?: string;
}) {
  const { n, pearson, pearsonInterval, spearman, regression, description } =
    summary;
  const slope =
    regression === null
      ? null
      : formatMetricDelta(y, regression.slope * x.slopeStep);
  const xLabel = x.label.toLowerCase();
  const yLabel = yPhrase(y, lag);
  const perStep =
    x.kind === "clock"
      ? `each ${formatSlopeStep(x)} later ${xLabel}`
      : `each extra ${formatSlopeStep(x)} of ${xLabel}`;

  return (
    <section aria-label="Correlation statistics" className={className}>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="PAIRED DAYS · n"
          value={String(n)}
          caption={
            n > 0 && n < 10
              ? "FEW DAYS: READ WITH CARE"
              : "BOTH METRICS PRESENT"
          }
        />
        <Stat
          label="PEARSON r"
          accent={EXPLORE_COLORS.point}
          value={formatR(pearson)}
          caption={
            pearsonInterval
              ? `95% CI ${formatR(pearsonInterval.low)} … ${formatR(pearsonInterval.high)}`
              : undefined
          }
        />
        <Stat
          label="SPEARMAN ρ"
          value={formatR(spearman)}
          caption="RANK-BASED"
        />
        <Stat
          label={`TREND PER ${formatSlopeStep(x).toUpperCase()}`}
          value={slope ?? "—"}
          caption={
            regression ? `r² ${regression.rSquared.toFixed(2)}` : undefined
          }
        />
      </div>
      <p className="text-ink-50 font-prose mt-3 text-sm">
        {n < 3 ? (
          <>
            {n === 0 ? "No days" : `Only ${n} day${n === 1 ? "" : "s"}`} with
            both {xLabel} and {yLabel} in this range: at least 3 are needed to
            measure a relationship.
          </>
        ) : description === null ? (
          <>
            One of the metrics doesn&apos;t vary across these days, so there is
            no correlation to measure.
          </>
        ) : (
          <>
            <strong className="text-ink-0 font-semibold">
              {description[0]!.toUpperCase() + description.slice(1)}
              {description.endsWith("correlation") ? "" : " correlation"}
            </strong>{" "}
            between {xLabel} and {yLabel} across {n} days
            {pearsonInterval &&
            pearsonInterval.low < 0 &&
            pearsonInterval.high > 0
              ? "; the 95% interval includes zero, so it may be chance."
              : "."}
            {regression && pearson !== null && Math.abs(pearson) >= 0.1
              ? ` On the trend line, ${perStep} goes with ${slope} of ${yLabel}.`
              : ""}
          </>
        )}
      </p>
    </section>
  );
}

function NoOverlap({
  x,
  y,
  counts,
}: {
  x: MetricDefinition;
  y: MetricDefinition;
  counts: Counts;
}) {
  return (
    <div className="text-ink-100 flex h-[360px] flex-col items-center justify-center gap-2 px-4 text-center font-mono text-[11px] sm:h-[480px]">
      <span>NO DAYS WITH BOTH METRICS</span>
      <span className="text-ink-200">
        {x.label}: {counts.get(x.id) ?? 0} days · {y.label}:{" "}
        {counts.get(y.id) ?? 0} days in this range. Try a longer range, a
        different lag, or the line view.
      </span>
    </div>
  );
}
