/**
 * Maps HCGateway's `HealthspanSummary` onto the domain `HealthspanAnalytics`.
 *
 * Shared by `getHealthspanAnalytics` and the overview page, which selects the
 * same summary and `latest` fields inside its wider query but no `trend`. The
 * parameter type below is the contract.
 *
 * The schema's closed value sets are GraphQL enums (SCREAMING_CASE); the
 * domain's are lowercase. Each is translated through a total `Record` over the
 * generated union, so a value added or renamed server-side becomes a compile
 * error after `npm run codegen` instead of a silently missing factor card.
 */
import type {
  DailyHealthspanEstimate,
  HealthspanAnalytics,
  HealthspanFactor,
  HealthspanFactorKey,
  HealthspanStatus,
} from "~/domain/analytics";
import type {
  HealthspanFactorKey as GraphQLFactorKey,
  HealthspanFactorUnit as GraphQLFactorUnit,
  HealthspanPageQuery,
  HealthspanStatus as GraphQLStatus,
} from "~/types/__generated__/graphql";

type GraphQLHealthspanPage =
  HealthspanPageQuery["viewer"]["analytics"]["healthspan"];

/**
 * The healthspan page selects `trend` (without factors) plus `latest` (with
 * them); the overview selects only `latest`, because its card shows nothing
 * else. `trend` is therefore optional here and maps to `[]` when absent.
 */
export type GraphQLHealthspan = Omit<GraphQLHealthspanPage, "trend"> & {
  trend?: GraphQLHealthspanPage["trend"];
};
type GraphQLDay = NonNullable<GraphQLHealthspanPage["latest"]>;
type GraphQLTrendDay = GraphQLHealthspanPage["trend"][number];
type GraphQLFactor = GraphQLDay["factors"][number];

const STATUS: Record<GraphQLStatus, HealthspanStatus> = {
  CALIBRATING: "calibrating",
  PARTIAL: "partial",
  READY: "ready",
};

const FACTOR_KEY: Record<GraphQLFactorKey, HealthspanFactorKey> = {
  SLEEP_DURATION: "sleep_duration",
  SLEEP_CONSISTENCY: "sleep_consistency",
  STEPS: "steps",
  RESTING_HEART_RATE: "resting_heart_rate",
};

const FACTOR_UNIT: Record<GraphQLFactorUnit, HealthspanFactor["unit"]> = {
  MINUTES: "minutes",
  PERCENT: "percent",
  STEPS: "steps",
  BPM: "bpm",
};

export function adaptHealthspan(
  healthspan: GraphQLHealthspan,
): HealthspanAnalytics {
  // Neither query selects per-day factors on `trend` (see
  // `healthspanQuery.ts`), so trend days carry `factors: []` — "not
  // requested", like the overview's `stages: []`. Factors are only ever
  // rendered for `latest`.
  const trend = (healthspan.trend ?? []).map((day) => toEstimate(day, []));
  const latest = healthspan.latest
    ? toEstimate(healthspan.latest, healthspan.latest.factors.map(toFactor))
    : null;

  return {
    modelVersion: healthspan.modelVersion,
    status: STATUS[healthspan.status],
    birthDateConfigured: healthspan.birthDateConfigured,
    methodology: healthspan.methodology,
    calibrationReasons: healthspan.calibrationReasons,
    trend,
    latest,
    paceOfAging: healthspan.paceOfAging,
    // `paceWindowDays` is still nullable in the schema but required by the
    // domain. It describes the model's regression window (180 in every run
    // observed), not a measured health value, and nothing in the UI reads it —
    // so 0 cannot be mistaken for data. When it is missing there is no pace to
    // window anyway, which `paceOfAging: null` is what actually renders.
    paceWindowDays: healthspan.paceWindowDays ?? 0,
  };
}

function toEstimate(
  day: GraphQLTrendDay,
  factors: HealthspanFactor[],
): DailyHealthspanEstimate {
  return {
    date: day.date,
    chronologicalAgeYears: day.chronologicalAgeYears,
    healthAgeYears: day.healthAgeYears,
    ageDeltaYears: day.ageDeltaYears,
    paceOfAging: day.paceOfAging,
    factors,
    qualityFlags: day.qualityFlags,
  };
}

function toFactor(factor: GraphQLFactor): HealthspanFactor {
  return {
    key: FACTOR_KEY[factor.key],
    label: factor.label,
    value: factor.value,
    unit: FACTOR_UNIT[factor.unit],
    referenceValue: factor.referenceValue,
    ageImpactYears: factor.ageImpactYears,
    coverageDays: factor.coverageDays,
  };
}
