/**
 * GraphQL-backed read for the four metric detail pages. Same pattern as
 * `getSleepDebtAnalytics`.
 *
 * Adapts HCGateway's `MetricSeries` onto the `MetricAnalytics` shape
 * `MetricDetailPage` already consumes. The adapter does no health-data
 * computation: every number here is already prepared server-side.
 */
import type {
  DailyMetricSummary,
  MetricAnalytics,
  MetricUnit,
} from "~/domain/analytics";
import type { MetricKind } from "~/features/health/metricPresentation";
import type {
  MetricSeriesPageQuery,
  MetricUnit as GraphQLMetricUnit,
} from "~/types/__generated__/graphql";
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
 * The unit each series is expected in, as the domain spells it and as the
 * `MetricUnit` enum does. The expected unit wins over the wire value: the
 * charts and formatters are written around it, and a mismatch means the
 * backend changed contract — logged loudly rather than relabelling a real
 * number (see `resolveUnit`).
 */
const expectedUnit: Record<SeriesName, [MetricUnit, GraphQLMetricUnit]> = {
  steps: ["steps", "STEPS"],
  activeCalories: ["kcal", "KCAL"],
  totalCalories: ["kcal", "KCAL"],
  restingHeartRate: ["bpm", "BPM"],
  weight: ["kg", "KG"],
};

/** Which series backs each page's primary chart. */
const primarySeries: Record<MetricKind, SeriesName> = {
  steps: "steps",
  calories: "activeCalories",
  "heart-rate": "restingHeartRate",
  weight: "weight",
};

/** Throws when GraphQL can't serve these pages; see `withAnalytics`. */
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
    daily: series.daily.map(toDailySummary),
    overview: {
      latest: series.overview.latest
        ? toDailySummary(series.overview.latest)
        : null,
      previous: series.overview.previous
        ? toDailySummary(series.overview.previous)
        : null,
      average7Day: series.overview.average7Day,
      average30Day: series.overview.average30Day,
      changeFromPrevious: series.overview.changeFromPrevious,
      sampleCount: series.overview.sampleCount,
    },
    rolling7Day: series.rolling7Day.map((point) => ({
      date: point.date,
      value: point.value,
      sampleCount: point.sampleCount,
    })),
    monthly: series.monthly.map((point) => ({
      month: point.month,
      value: point.value,
      sampleCount: point.sampleCount,
    })),
  };
}

function resolveUnit(name: SeriesName, unit: GraphQLMetricUnit): MetricUnit {
  const [domainUnit, wireUnit] = expectedUnit[name];
  if (unit !== wireUnit) {
    console.error(
      `GraphQL metric-series ${name} reported unit ${unit}, expected ${wireUnit}; rendering as "${domainUnit}"`,
    );
  }
  return domainUnit;
}

function toDailySummary(day: GraphQLMetricDay): DailyMetricSummary {
  return {
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
  };
}
