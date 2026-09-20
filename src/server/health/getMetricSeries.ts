/**
 * GraphQL-backed read for the four metric detail pages. Same pattern as
 * `getSleepDebtAnalytics` — see GRAPHQL_MIGRATION_REDUNDANCY.md.
 *
 * Adapts HCGateway's `MetricSeries` onto the `MetricAnalytics` shape
 * `MetricDetailPage` already consumes. The adapter does no health-data
 * computation: every number here is already prepared server-side.
 */
import type {
  DailyMetricSummary,
  MetricAnalytics,
  MetricTrendPoint,
  MetricUnit,
} from "~/domain/analytics";
import type { MetricKind } from "~/features/health/metricPresentation";
import type { MetricSeriesPageQuery } from "~/types/__generated__/graphql";
import { withAnalytics } from "./graphql/fetchAnalytics";
import { METRIC_SERIES_QUERY } from "./graphql/metricSeriesQuery";

type Analytics = MetricSeriesPageQuery["viewer"]["analytics"];
type GraphQLMetricSeries = Analytics["steps"];
type GraphQLMetricDay = GraphQLMetricSeries["daily"][number];

/** The five series this query fetches, keyed as `HealthAnalytics` names them. */
type SeriesName =
  | "steps"
  | "activeCalories"
  | "totalCalories"
  | "restingHeartRate"
  | "weight";

export interface MetricSeriesSet {
  steps: MetricAnalytics;
  activeCalories: MetricAnalytics;
  totalCalories: MetricAnalytics;
  restingHeartRate: MetricAnalytics;
  weight: MetricAnalytics;
}

/**
 * The unit each series is expected to arrive in. `MetricSeries.unit` is
 * `String!` over the wire but `MetricAnalytics.unit` is a closed union, and
 * casting a raw string into that union would let a backend change (say `lb`
 * instead of `kg`) render a wrong unit label next to a real number. So the
 * unit is decided here per series and the wire value is only checked against
 * it — see `resolveUnit`. Verified against live data: the backend currently
 * sends exactly "steps", "kcal", "kcal", "bpm", "kg".
 */
const expectedUnit: Record<SeriesName, MetricUnit> = {
  steps: "steps",
  activeCalories: "kcal",
  totalCalories: "kcal",
  restingHeartRate: "bpm",
  weight: "kg",
};

/** Which series backs each page's primary chart. */
const primarySeries: Record<MetricKind, SeriesName> = {
  steps: "steps",
  calories: "activeCalories",
  "heart-rate": "restingHeartRate",
  weight: "weight",
};

/** Returns `null` when GraphQL can't serve these pages; see `withAnalytics`. */
export function getMetricSeries() {
  return withAnalytics("metric-series", METRIC_SERIES_QUERY, (analytics) => {
    const series: MetricSeriesSet = {
      steps: toMetricAnalytics("steps", analytics.steps),
      activeCalories: toMetricAnalytics(
        "activeCalories",
        analytics.activeCalories,
      ),
      totalCalories: toMetricAnalytics(
        "totalCalories",
        analytics.totalCalories,
      ),
      restingHeartRate: toMetricAnalytics(
        "restingHeartRate",
        analytics.restingHeartRate,
      ),
      weight: toMetricAnalytics("weight", analytics.weight),
    };
    return series;
  });
}

/** The series a `MetricKind` page charts as its primary metric. */
export function selectMetricSeries(
  kind: MetricKind,
  series: MetricSeriesSet,
): MetricAnalytics {
  return series[primarySeries[kind]];
}

function toMetricAnalytics(
  name: SeriesName,
  series: GraphQLMetricSeries,
): MetricAnalytics {
  return {
    unit: resolveUnit(name, series.unit),
    daily: series.daily.flatMap(toDailySummary),
    overview: {
      latest: series.overview.latest
        ? (toDailySummary(series.overview.latest)[0] ?? null)
        : null,
      previous: series.overview.previous
        ? (toDailySummary(series.overview.previous)[0] ?? null)
        : null,
      average7Day: series.overview.average7Day,
      average30Day: series.overview.average30Day,
      changeFromPrevious: series.overview.changeFromPrevious,
      sampleCount: series.overview.sampleCount,
    },
    rolling7Day: series.rolling7Day.flatMap(toTrendPoint),
    monthly: series.monthly.map((point) => ({
      month: point.month,
      value: point.value,
      sampleCount: point.sampleCount,
    })),
  };
}

/**
 * Keeps the wire `unit` from being cast blindly into `MetricUnit`. The expected
 * unit wins, because the charts and formatters are already written around it;
 * a mismatch means the backend changed contract and is logged loudly rather
 * than silently relabelling the axis.
 */
function resolveUnit(name: SeriesName, unit: string): MetricUnit {
  const expected = expectedUnit[name];
  if (unit !== expected) {
    console.error(
      `GraphQL metric-series ${name} reported unit "${unit}", expected "${expected}"; rendering as "${expected}"`,
    );
  }
  return expected;
}

/**
 * `MetricDay.source` is nullable in the schema but `DailyMetricSummary.source`
 * is required, and it labels the value in the UI ("633 steps from Fitbit").
 * A day with a real value but no attribution is dropped rather than labelled
 * with an invented or empty source: the value itself is never faked, and a
 * missing day reads as missing instead of as a fabricated attribution.
 *
 * Returns an array so callers can `flatMap` — measured against live data this
 * drops nothing today (0 null sources across all five series), so it is purely
 * a guard against the schema's looseness. See the backend follow-up list:
 * `source` should be non-null, or the domain type should admit null.
 */
function toDailySummary(day: GraphQLMetricDay): [DailyMetricSummary] | [] {
  if (day.source === null) return [];
  return [
    {
      date: day.date,
      value: day.value,
      source: day.source,
      bySource: day.bySource.map((contribution) => ({
        source: contribution.source,
        value: contribution.value,
        observationCount: contribution.observationCount,
        coverageMinutes: contribution.coverageMinutes,
      })),
      qualityFlags: day.qualityFlags,
    },
  ];
}

/**
 * `RollingPoint.value` is nullable — a trailing window with no data has no
 * average — but `MetricTrendPoint.value` is required.
 *
 * Such points are dropped, not defaulted. Any default is wrong here: 0 draws
 * the trend line down to the floor, which for steps or weight reads as a real
 * measured collapse, and carrying the previous value forward invents a
 * plateau that flattens the very trend the line exists to show. Dropping
 * leaves a gap, and a gap is what actually happened. The `date` on each point
 * means the chart still places the remaining points correctly rather than
 * closing the gap up.
 *
 * Measured against live data this drops nothing today (0 null values across
 * all five series), so it is a guard rather than a routine filter.
 */
function toTrendPoint(point: {
  date: string;
  value: number | null;
  sampleCount: number;
}): [MetricTrendPoint] | [] {
  if (point.value === null) return [];
  return [
    { date: point.date, value: point.value, sampleCount: point.sampleCount },
  ];
}
