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
type GraphQLMetricSeries = NonNullable<Analytics["steps"]>;
type GraphQLMetricDay = GraphQLMetricSeries["daily"][number];

/** The five series the query can fetch, keyed as `HealthAnalytics` names them. */
type SeriesName =
  | "steps"
  | "activeCalories"
  | "totalCalories"
  | "restingHeartRate"
  | "weight";

/** What a metric page renders: its primary series, plus calories' overlay. */
export interface MetricPageSeries {
  primary: MetricAnalytics;
  secondary?: MetricAnalytics;
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

/**
 * The series each page renders: `MetricDetailPage` draws its primary series,
 * and only /calories overlays a second (total against active energy).
 */
const pageSeries: Record<
  MetricKind,
  { primary: SeriesName; secondary?: SeriesName }
> = {
  steps: { primary: "steps" },
  calories: { primary: "activeCalories", secondary: "totalCalories" },
  "heart-rate": { primary: "restingHeartRate" },
  weight: { primary: "weight" },
};

/**
 * Fetches only the series `kind`'s page renders, via the query's `@include`
 * variables. Throws when GraphQL can't serve the page; see `withAnalytics`.
 */
export function getMetricSeries(kind: MetricKind) {
  const { primary, secondary } = pageSeries[kind];
  const wanted = (name: SeriesName) => name === primary || name === secondary;
  return withAnalytics(
    "metric-series",
    METRIC_SERIES_QUERY,
    (analytics): MetricPageSeries => ({
      primary: toMetricAnalytics(primary, analytics[primary]),
      secondary: secondary
        ? toMetricAnalytics(secondary, analytics[secondary])
        : undefined,
    }),
    {
      steps: wanted("steps"),
      activeCalories: wanted("activeCalories"),
      totalCalories: wanted("totalCalories"),
      restingHeartRate: wanted("restingHeartRate"),
      weight: wanted("weight"),
    },
  );
}

function toMetricAnalytics(
  name: SeriesName,
  series: GraphQLMetricSeries | undefined,
): MetricAnalytics {
  // Only reachable if the variables and `pageSeries` disagree; failing here
  // surfaces as a FrontendMappingError instead of a page of empty charts.
  if (!series) throw new Error(`metric series ${name} was not fetched`);
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
