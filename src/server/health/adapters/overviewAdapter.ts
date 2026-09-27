/**
 * Maps the overview query's `viewer.analytics` onto a whole `HealthSnapshot`.
 *
 * Extracted from `getOverviewSnapshot` so `HealthDataProvider` — a client
 * component that polls the same query through Apollo — reuses this mapping
 * instead of duplicating it. Same reason `sleepDebtAdapter` and friends exist;
 * the difference is that both callers of this one are on opposite sides of the
 * server/client boundary, so **this module must stay free of server-only
 * imports** (no `graphqlClient`, no `~/env`): one of them ships to the browser.
 *
 * Both callers must therefore keep selecting the same fields; `OVERVIEW_QUERY`
 * is the single source for that, and the parameter type below is the contract.
 *
 * Does no health-data computation — every value is already prepared
 * server-side.
 *
 * `sleepEvents` arrive WITHOUT stage timelines (see `overviewQuery.ts` for the
 * 5.5 MB → 321 KB reasoning), so every `SleepSession` here has `stages: []`.
 * Only `SleepStagesGraph` reads stages, and only for the selected day; it gets
 * them from the sleep-stages route on demand. Anything new that renders stages
 * from this snapshot must fetch them the same way rather than assuming they are
 * present.
 */
import type {
  DailyMetricSummary,
  DailySleepSummary,
  DeviceSleepSummary,
  HealthAnalytics,
  MetricAnalytics,
  MetricUnit,
  SleepEvent,
} from "~/domain/analytics";
import type { HealthSnapshot, SleepSession } from "~/domain/health";
import type { OverviewPageQuery } from "~/types/__generated__/graphql";
import { adaptHealthspan } from "./healthspanAdapter";
import { adaptSleepConsistency } from "./sleepConsistencyAdapter";
import { adaptSleepDebt } from "./sleepDebtAdapter";

/** The `viewer.analytics` selection the overview query makes. */
export type GraphQLOverviewAnalytics = OverviewPageQuery["viewer"]["analytics"];

/** The five metric series the overview selects, and their domain units. */
const METRIC_UNITS = {
  steps: "steps",
  activeCalories: "kcal",
  totalCalories: "kcal",
  restingHeartRate: "bpm",
  weight: "kg",
} as const satisfies Record<string, MetricUnit>;

type MetricName = keyof typeof METRIC_UNITS;

export function adaptOverview(
  analytics: GraphQLOverviewAnalytics,
): HealthSnapshot {
  const sleepEvents: SleepEvent[] = analytics.sleepEvents.map((event) => ({
    id: event.id,
    date: event.date,
    primary: toSession(event.primary),
    recordings: event.recordings.map(toSession),
  }));

  // The domain keeps a flat session list; the reducer uses it only to check
  // whether a previously selected session still exists after a refresh.
  // Deriving it from the events avoids selecting the same sessions twice.
  const sleepSessions: SleepSession[] = sleepEvents.flatMap(
    (event) => event.recordings,
  );

  const dailySleep: DailySleepSummary[] = analytics.days.flatMap((day) => {
    const sleep = day.headlineScores.sleepDuration;
    // MISSING days send nulls rather than zero. Dropping them means
    // `dailySleep` holds only days that had sleep, so a gap stays a gap.
    if (
      sleep.value === null ||
      sleep.eventCount === null ||
      sleep.recordingCount === null
    ) {
      return [];
    }
    return [
      {
        date: day.date,
        sleepMinutes: sleep.value,
        eventCount: sleep.eventCount,
        recordingCount: sleep.recordingCount,
      },
    ];
  });

  const deviceSleep: DeviceSleepSummary[] =
    analytics.deviceSleepComparisons.map((comparison) => ({
      source: comparison.source,
      recordingCount: comparison.recordingCount,
      averageSleepMinutes: comparison.averageSleepMinutes,
      comparisonCount: comparison.comparisonCount,
      averageDifferenceMinutes: comparison.averageDifferenceMinutes,
    }));

  const healthAnalytics: HealthAnalytics = {
    sleepEvents,
    dailySleep,
    sleepDebt: adaptSleepDebt(analytics.sleepDebt),
    sleepConsistency: adaptSleepConsistency(analytics.sleepConsistency),
    healthspan: adaptHealthspan(analytics.healthspan),
    deviceSleep,
    steps: toMetric("steps", analytics.steps),
    activeCalories: toMetric("activeCalories", analytics.activeCalories),
    totalCalories: toMetric("totalCalories", analytics.totalCalories),
    restingHeartRate: toMetric("restingHeartRate", analytics.restingHeartRate),
    weight: toMetric("weight", analytics.weight),
  };

  return {
    generatedAt: analytics.processedAt ?? new Date().toISOString(),
    sleepSessions,
    analytics: healthAnalytics,
  };
}

/**
 * Stages are omitted from the overview query, so sessions arrive without them.
 * `stages: []` is accurate for this payload — "none were requested" — and the
 * stage graph fetches them separately for the selected day.
 */
function toSession(session: {
  id: string;
  source: string;
  startAt: string;
  endAt: string;
  title: string | null;
  notes: string | null;
}): SleepSession {
  return {
    id: session.id,
    source: session.source,
    startAt: session.startAt,
    endAt: session.endAt,
    title: session.title,
    notes: session.notes,
    stages: [],
  };
}

interface GraphQLOverviewMetric {
  unit: string;
  overview: {
    average7Day: number | null;
    average30Day: number | null;
    changeFromPrevious: number | null;
    sampleCount: number;
    latest: GraphQLOverviewMetricDay | null;
    previous: GraphQLOverviewMetricDay | null;
  };
  daily: GraphQLOverviewMetricDay[];
}

interface GraphQLOverviewMetricDay {
  date: string;
  value: number;
  source: string | null;
  qualityFlags: string[];
}

/**
 * `rolling7Day` and `monthly` are not selected by the overview (nothing there
 * renders them — see `overviewQuery.ts`), so they are empty here. The metric
 * detail routes have their own query that does select them.
 *
 * The unit comes from `METRIC_UNITS` rather than the wire value: the domain
 * type is a closed union and the API sends `String!`, so a backend changing
 * "kg" to "lb" must not silently relabel real numbers. A mismatch is logged.
 */
function toMetric(
  name: MetricName,
  series: GraphQLOverviewMetric,
): MetricAnalytics {
  const unit = METRIC_UNITS[name];
  if (series.unit !== unit) {
    console.error(
      `GraphQL overview ${name} reported unit "${series.unit}", expected "${unit}"; rendering as "${unit}"`,
    );
  }
  return {
    unit,
    daily: series.daily.flatMap(toMetricDay),
    overview: {
      latest: series.overview.latest
        ? (toMetricDay(series.overview.latest)[0] ?? null)
        : null,
      previous: series.overview.previous
        ? (toMetricDay(series.overview.previous)[0] ?? null)
        : null,
      average7Day: series.overview.average7Day,
      average30Day: series.overview.average30Day,
      changeFromPrevious: series.overview.changeFromPrevious,
      sampleCount: series.overview.sampleCount,
    },
    rolling7Day: [],
    monthly: [],
  };
}

/**
 * `source` is nullable in the schema but required by the domain, where it
 * labels the value in the UI. A day with no attribution is dropped rather than
 * given an invented one; measured against live data this drops nothing.
 *
 * `bySource` is not selected by the overview (only the metric detail pages read
 * it), so it is empty here.
 */
function toMetricDay(day: GraphQLOverviewMetricDay): [DailyMetricSummary] | [] {
  if (day.source === null) return [];
  return [
    {
      date: day.date,
      value: day.value,
      source: day.source,
      bySource: [],
      qualityFlags: day.qualityFlags,
    },
  ];
}
