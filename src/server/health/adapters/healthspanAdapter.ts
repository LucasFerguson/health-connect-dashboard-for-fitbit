/**
 * Maps HCGateway's `HealthspanSummary` onto the domain `HealthspanAnalytics`.
 *
 * Shared by `getHealthspanAnalytics` and the overview page, which selects the
 * same fields inside its wider query. Both callers must keep selecting the
 * same fields; the parameter type below is the contract.
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

export type GraphQLHealthspan =
  HealthspanPageQuery["viewer"]["analytics"]["healthspan"];
type GraphQLFactor = GraphQLHealthspan["trend"][number]["factors"][number];

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
  const trend: DailyHealthspanEstimate[] = healthspan.trend.map((day) => ({
    date: day.date,
    chronologicalAgeYears: day.chronologicalAgeYears,
    healthAgeYears: day.healthAgeYears,
    ageDeltaYears: day.ageDeltaYears,
    paceOfAging: day.paceOfAging,
    factors: day.factors.map(toFactor),
    qualityFlags: day.qualityFlags,
  }));

  return {
    modelVersion: healthspan.modelVersion,
    status: STATUS[healthspan.status],
    birthDateConfigured: healthspan.birthDateConfigured,
    methodology: healthspan.methodology,
    calibrationReasons: healthspan.calibrationReasons,
    trend,
    // The domain keeps `latest` as its own field; it is the last trend entry.
    // Derived rather than selected separately so the two cannot disagree.
    latest: trend.at(-1) ?? null,
    paceOfAging: healthspan.paceOfAging,
    // `paceWindowDays` is still nullable in the schema but required by the
    // domain. It describes the model's regression window (180 in every run
    // observed), not a measured health value, and nothing in the UI reads it —
    // so 0 cannot be mistaken for data. When it is missing there is no pace to
    // window anyway, which `paceOfAging: null` is what actually renders.
    paceWindowDays: healthspan.paceWindowDays ?? 0,
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
