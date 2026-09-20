/**
 * GraphQL-backed healthspan read. Same pattern as `getSleepDebtAnalytics` —
 * see GRAPHQL_MIGRATION_REDUNDANCY.md.
 *
 * This page has the widest gap between the schema and the domain types: three
 * fields the domain narrows to string unions arrive as plain `String!`, and
 * several required numbers arrive nullable. Each is mapped explicitly below
 * rather than cast, because a cast here would put an unrecognized value into
 * a component that switches on it and render a wrong label as if it were real.
 */
import type {
  DailyHealthspanEstimate,
  HealthspanAnalytics,
  HealthspanFactor,
  HealthspanFactorKey,
  HealthspanStatus,
} from "~/domain/analytics";
import { withAnalytics } from "./graphql/fetchAnalytics";
import { HEALTHSPAN_QUERY } from "./graphql/healthspanQuery";

type FactorUnit = HealthspanFactor["unit"];

/**
 * `HealthspanSummary.status` is `String!` in the schema, so codegen cannot
 * constrain it. Typed as a total Record over the domain union so dropping a
 * status from the domain type becomes a compile error here.
 */
const STATUSES: Record<HealthspanStatus, true> = {
  calibrating: true,
  partial: true,
  ready: true,
};

/** `HealthspanFactor.key` is `String!` in the schema; same reasoning. */
const FACTOR_KEYS: Record<HealthspanFactorKey, true> = {
  sleep_duration: true,
  sleep_consistency: true,
  steps: true,
  resting_heart_rate: true,
};

/** `HealthspanFactor.unit` is `String!` in the schema; same reasoning. */
const FACTOR_UNITS: Record<FactorUnit, true> = {
  minutes: true,
  percent: true,
  steps: true,
  bpm: true,
};

/**
 * An unknown status means this build doesn't understand what the server is
 * reporting, so it degrades to the most conservative value: "calibrating"
 * makes the UI present the estimate as provisional rather than asserting a
 * health age it can't vouch for. Claiming "ready" on an unrecognized status
 * would be the one unsafe direction.
 */
function toStatus(status: string): HealthspanStatus {
  return status in STATUSES ? (status as HealthspanStatus) : "calibrating";
}

function isFactorKey(key: string): key is HealthspanFactorKey {
  return key in FACTOR_KEYS;
}

function isFactorUnit(unit: string): unit is FactorUnit {
  return unit in FACTOR_UNITS;
}

/** Returns `null` when GraphQL can't serve this page; see `withAnalytics`. */
export function getHealthspanAnalytics() {
  return withAnalytics("healthspan", HEALTHSPAN_QUERY, ({ healthspan }) => {
    const trend: DailyHealthspanEstimate[] = healthspan.trend.map((day) => ({
      date: day.date,
      chronologicalAgeYears: day.chronologicalAgeYears,
      healthAgeYears: day.healthAgeYears,
      ageDeltaYears: day.ageDeltaYears,
      paceOfAging: day.paceOfAging,
      factors: day.factors.flatMap(toFactor),
      qualityFlags: day.qualityFlags,
    }));

    const analytics: HealthspanAnalytics = {
      modelVersion: healthspan.modelVersion,
      status: toStatus(healthspan.status),
      birthDateConfigured: healthspan.birthDateConfigured,
      methodology: healthspan.methodology,
      calibrationReasons: healthspan.calibrationReasons,
      trend,
      // The domain keeps `latest` as its own field; it is the last trend entry.
      // Derived rather than selected separately so the two cannot disagree.
      latest: trend.at(-1) ?? null,
      paceOfAging: healthspan.paceOfAging,
      // `paceWindowDays` is `Int` in the schema but required by the domain. It
      // describes the model's regression window (180 in every run observed),
      // not a measured health value, and nothing in the UI reads it today — so
      // 0 cannot be mistaken for data. When it is missing there is no pace to
      // window anyway, which `paceOfAging: null` is what actually renders.
      paceWindowDays: healthspan.paceWindowDays ?? 0,
    };
    return analytics;
  });
}

/**
 * Drops a factor rather than coercing it. `key` and `unit` are `String!` in the
 * schema, and both drive presentation: an unrecognized key would be rendered
 * under whichever label the component happens to map it to, and an
 * unrecognized unit would format e.g. bpm as minutes. Showing a mislabeled
 * health number is worse than showing one fewer factor.
 *
 * `referenceValue`, `ageImpactYears` and `coverageDays` are nullable in the
 * schema but required by the domain, and all three are rendered verbatim next
 * to the value ("N recorded days · reference X"). No neutral default exists —
 * 0 recorded days or a 0 reference would both read as real data — so a factor
 * missing any of them is dropped too. Measured over 1,449 real factors none
 * were null, so this path is currently unreachable; see the backend follow-up
 * list about making them non-null.
 */
function toFactor(factor: {
  key: string;
  label: string;
  value: number;
  unit: string;
  referenceValue: number | null;
  ageImpactYears: number | null;
  coverageDays: number | null;
}): HealthspanFactor[] {
  if (!isFactorKey(factor.key) || !isFactorUnit(factor.unit)) return [];
  if (
    factor.referenceValue === null ||
    factor.ageImpactYears === null ||
    factor.coverageDays === null
  ) {
    return [];
  }
  return [
    {
      key: factor.key,
      label: factor.label,
      value: factor.value,
      unit: factor.unit,
      referenceValue: factor.referenceValue,
      ageImpactYears: factor.ageImpactYears,
      coverageDays: factor.coverageDays,
    },
  ];
}
