/**
 * `InMemoryCache` type policies shared by both Apollo clients: the RSC one in
 * `graphqlClient.ts` and the browser one in `app/ApolloWrapper.tsx`. **Keep
 * this module free of server-only imports** (no `graphqlClient`, no `~/env`):
 * the browser bundle imports it.
 *
 * Three kinds of object type, three rules:
 *
 * 1. **Entities** — every type with `id: ID!` (Analytics, Day, SleepDebtDay,
 *    MetricDay, HealthspanDay, HealthspanFactor, SleepEvent, SleepSession, …).
 *    These need no policy: Apollo's default `__typename:id` key is exactly
 *    right, because HCGateway's ids are account- and run-scoped
 *    (`<account>:<algorithm>:<hash>:<hash>:<date>[:…]`). A new analytics run
 *    therefore produces new entities instead of overwriting the old run's in
 *    place, which is the run-mixing protection GRAPHQL_BACKEND_REQUESTS.md #5
 *    asked for. `SleepDebtDay` and `Day` for the same date share an id string,
 *    which is harmless since the typename is part of the cache key.
 *
 * 2. **Value objects** — id-less types that hang off a parent as a single
 *    object (`SleepDebtSummary`, `MetricSeries`, `MetricValue`, `Viewer`, …).
 *    They only exist as part of their parent, so `keyFields: false` keeps them
 *    embedded, and `merge: true` lets two selections of the same parent field
 *    (say, one query's `sleepDebt { daily }` and another's
 *    `sleepDebt { latest }`) combine instead of the later one silently
 *    replacing the earlier — which is what Apollo's "Cache data may be lost"
 *    warning is about. `Viewer` is a per-token singleton, so merging is right
 *    for it too.
 *
 * 3. **Lists on entities** (`Analytics.days`, `MetricDay.bySource`, …). The
 *    server's list is authoritative; a refresh that returns fewer items than
 *    before (a day dropped by a rebuild) should replace, not be merged by
 *    index. That is Apollo's default behaviour, but without a merge function it
 *    also logs a data-loss warning, so the replacement is declared explicitly.
 *    Arguments (`days(range: …)`) are part of the store field name, so a
 *    bounded and an unbounded selection never overwrite each other.
 *
 * `typePolicies.test.ts` checks these lists against `graphql-introspection.json`,
 * so a schema change (a value type gaining an `id`, a new id-less type) fails
 * a test after `npm run codegen:schema` instead of producing cache warnings.
 */
import type { FieldPolicy, TypePolicies } from "@apollo/client";

/**
 * Every id-less object type the schema uses as a single (non-list) field
 * value. List-only id-less types (`SleepStage`, `SourceContribution`, …) need
 * no entry: they are covered by their list field's policy below.
 */
export const VALUE_OBJECT_TYPES = [
  "AnalyticsConfig",
  "AnalyticsJobStatus",
  "Availability",
  "CurrentRun",
  "DayTimeline",
  "DeviceAssociation",
  "DeviceCatalog",
  "DeviceIdentity",
  "HeadlineScores",
  "HealthspanSummary",
  "HeartRateData",
  "HeartRateTimeline",
  "IngestionStatus",
  "MetricOverview",
  "MetricSeries",
  "MetricValue",
  "NowMarker",
  "PhoneSyncStatus",
  "PrimarySelection",
  "RecoveryAvailability",
  "RecoveryComponent",
  "RecoveryComponents",
  "RecoveryDayQuality",
  "RecoveryMetric",
  "RecoveryQuality",
  "RecoverySummary",
  "RecoveryWeights",
  "SignalInventory",
  "SleepConsistencyBreakdown",
  "SleepConsistencySummary",
  "SleepDebtBreakdown",
  "SleepDebtSummary",
  "SleepDurationMetric",
  "SourceCatalog",
  "SourceRecords",
  "StageMinutes",
  "StrainCalibration",
  "StrainMetric",
  "StrainQuality",
  "StrainSummary",
  "SupportingMetrics",
  "TimeWindow",
  "Viewer",
  "ZoneMinutes",
  "ZoneOffsets",
] as const;

/** List fields on entity types whose items the server replaces wholesale. */
export const REPLACED_LIST_FIELDS = {
  Analytics: ["days", "sleepEvents", "deviceSleepComparisons"],
  SleepEvent: ["recordings"],
  SleepSession: ["stages"],
  HealthspanDay: ["factors"],
  MetricDay: ["bySource"],
} as const;

const replaceList: FieldPolicy<unknown[]> = {
  merge: (_existing, incoming) => incoming,
};

export const typePolicies: TypePolicies = {
  ...Object.fromEntries(
    VALUE_OBJECT_TYPES.map((typename) => [
      typename,
      { keyFields: false, merge: true },
    ]),
  ),
  ...Object.fromEntries(
    Object.entries(REPLACED_LIST_FIELDS).map(([typename, fields]) => [
      typename,
      {
        fields: Object.fromEntries(fields.map((field) => [field, replaceList])),
      },
    ]),
  ),
};
