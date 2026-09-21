# Frontend requests for the GraphQL API

Written after migrating **all ten pages** end to end against the live API on
`:6645`. Everything below was verified against real
responses, not inferred from the schema — counts and shapes are from actual
queries on the primary account.

**Caveat on the numbers:** the counts below were captured against run
`health-analytics-v8.3`. The live run is now `health-analytics-v8.4`, so
re-measure before acting on a specific figure — the _shapes_ of the problems
are unchanged, but the null rates and day counts may have moved.

Ordered by how much friction each one causes on the frontend.

## 1. GraphQL variables are ignored (blocking)

**This is a functional bug, not schema polish, and it is the top priority.**

Any operation that declares variables fails, even a trivial one:

```bash
curl -X POST .../graphql -H 'Content-Type: application/json' -d '{
  "query": "query T($d: Date!) { viewer { analytics { day(date: $d) { date } } } }",
  "variables": { "d": "2026-09-18" }
}'
# {"errors":[{"message":"Variable \"$d\" of required type \"Date!\" was not provided."}]}
```

The identical query with the argument inlined succeeds. Reproduced with both
`day(date:)` and `sleepEvents(range:)`, so it is not specific to one field or
input type — the server appears not to read the request body's `variables`
field at all.

**Impact:** the frontend has to interpolate arguments into query text. That
works (and is safe here, since the only interpolated value is a validated
`YYYY-MM-DD`), but it means those operations cannot be persisted/allowlisted
queries later, and every caller re-parses a fresh document instead of reusing
one. `src/server/health/getSleepStages.ts` carries the workaround and a comment
pointing here.

**Request:** pass the request's `variables` through to the GraphQL executor.
Worth a regression test asserting a variable-bearing query returns data.

**Second-order cost worth knowing about.** The workaround leaked into the
architecture, not just one file. Because the stages query has to be built as a
string at runtime, it is invisible to codegen, which means:

- `getSleepStages.ts` hand-writes its result type and its `SleepStageKind`
  union instead of importing generated ones (importing the generated enum
  actually broke the build once — codegen stopped emitting it when the last
  `graphql()` anchor disappeared);
- the browser fetches stages through a bespoke `/api/sleep-stages` route rather
  than the general `/api/graphql` proxy, so there are two client→server shapes
  where one would do. A reviewer reasonably flagged this as looking like an
  un-migrated REST endpoint. It isn't — it queries GraphQL server-side — but
  the inconsistency is real and it exists only because of this bug.

When variables work, delete `/api/sleep-stages` and let the client query stages
through the normal proxy with a proper `$range` variable.

## 2. Closed value sets typed as `String!` instead of enums

The biggest _schema_ friction point (the variables bug above is a functional
blocker). Four fields have small, closed value sets but arrive as `String!`:

| Field                      | Actual values observed                                               |
| -------------------------- | -------------------------------------------------------------------- |
| `HealthspanSummary.status` | `ready` (domain also knows `calibrating`, `partial`)                 |
| `HealthspanFactor.key`     | `sleep_duration`, `sleep_consistency`, `steps`, `resting_heart_rate` |
| `HealthspanFactor.unit`    | `minutes`, `percent`, `steps`, `bpm`                                 |
| `MetricSeries.unit`        | `steps`, `kcal`, `bpm`, `kg`                                         |

Every one of these drives presentation, so the frontend _must_ narrow them to
render at all: `status` gates the calibrating banner, `key` selects the label,
and `unit` selects the number formatter. As `String!` they defeat codegen, so
each adapter hand-maintains a membership table. Two concrete consequences:

- A server-side rename would **silently drop a healthspan factor card** rather
  than failing the build, because an unrecognized `key` has to be skipped (the
  alternative — rendering it under whatever label the component maps it to — is
  worse).
- `unit` mismatches are the difference between rendering `59` as bpm and as
  minutes. The metric adapter now decides the unit client-side per series and
  only _compares_ the wire value, logging an error on mismatch, because
  trusting it would let a backend switch to `lb` mislabel real kilograms.

**Request:** make them enums, using the SCREAMING_CASE convention
`DebtCategory`/`ConsistencyCategory` already follow:

```graphql
enum HealthspanStatus {
  CALIBRATING
  PARTIAL
  READY
}
enum HealthspanFactorKey {
  SLEEP_DURATION
  SLEEP_CONSISTENCY
  STEPS
  RESTING_HEART_RATE
}
enum HealthspanFactorUnit {
  MINUTES
  PERCENT
  STEPS
  BPM
}
enum MetricUnit {
  STEPS
  KCAL
  BPM
  KG
}
```

That collapses three hand-written membership tables into the same total-`Record`
lookup the already-enum'd pages use, and turns a schema change into a compile
error instead of a silently missing card.

## 3. Over-permissive nullability

Fields nullable in the schema but never null in live data. Measured on the
primary account:

| Field                                     | Nulls          |
| ----------------------------------------- | -------------- |
| `SleepConsistencyDay.source`              | 0 / 492        |
| `SleepConsistencyDay.bedtimeAt`           | 0 / 492        |
| `SleepConsistencyDay.wakeAt`              | 0 / 492        |
| `SleepConsistencyDay.bedtimeMinutesLocal` | 0 / 492        |
| `MetricDay.source`                        | 0 / 1,033      |
| `RollingPoint.value`                      | 0 / 400        |
| `HealthspanFactor.referenceValue`         | 0 / 1,449      |
| `HealthspanFactor.ageImpactYears`         | 0 / 1,449      |
| `HealthspanFactor.coverageDays`           | 0 / 1,449      |
| `HealthspanSummary.paceWindowDays`        | 0 (always 180) |

Each one forces a guard that drops the row, because the domain types require
them and there is no honest default — `MetricDay.source` labels the value in the
UI ("633 steps from Fitbit"), so inventing an attribution is worse than omitting
the day; a `0` in a steps or weight trend reads as a measured collapse. So the
frontend now carries several drop-guards that **cannot currently fire**, and
would silently hide real data if the backend ever did emit a null.

**Request:** make them non-null where a row cannot meaningfully exist without
them. Where a null is genuinely possible, document _when_ — then we will render
an explicit gap deliberately rather than guessing.

For contrast, these ARE legitimately null and need no change; the domain already
admits null and the UI renders "—" / "Calibrating":
`HealthspanDay.healthAgeYears` (21/508), `ageDeltaYears` (10/508),
`paceOfAging` (26/508).

## 4. `breakdown30Day` is an untyped `JSON` scalar

Both `SleepDebtSummary.breakdown30Day` and
`SleepConsistencySummary.breakdown30Day` are `JSON`. The actual payload is
perfectly regular:

```json
{ "recordedDays": 30, "none": 9, "low": 2, "moderate": 0, "high": 19 }
```

Because it is `JSON`, codegen produces `unknown` and none of it is
type-checked or field-selectable. Both frontend adapters currently ignore the
field and re-tally the counts from the typed `daily` array instead — correct,
but duplicated work the server already did.

**Request:** give these real types, e.g.

```graphql
type SleepDebtBreakdown {
  recordedDays: Int!
  none: Int!
  low: Int!
  moderate: Int!
  high: Int!
}
```

Same for the consistency variant (`scoredDays/optimal/sufficient/poor`).
`CurrentRun.counts` and `AnalyticsJobStatus.{error,result}` are also `JSON`;
lower priority since no page reads them yet, but the same argument applies.

## 5. No `id` on the date-keyed analytics types

Only 15 of 83 object types expose `id` — raw records, `SleepEvent`,
`StrainWorkout`, `ObservedDevice`. The date-keyed types (`Day`, `MetricDay`,
`SleepDebtDay`, `SleepConsistencyDay`, `HealthspanDay`, `StrainDay`,
`RecoveryDay`) have none.

Apollo's `InMemoryCache` normalizes by `__typename` + `id`. Without one:

- two queries covering overlapping date ranges store duplicate copies rather
  than merging;
- if a new `runId` is published mid-session, days from the old and new run can
  coexist in the cache with nothing distinguishing them.

`HealthspanFactor` has no `id` either, and it is a list nested inside the
already-unidentified `HealthspanDay`.

**Request:** add `id: ID!` of the form `"<runId>:<date>"` (and
`"<runId>:<date>:<key>"` for factors). Server-side is
better than a client-side `keyFields: ["date"]` because it makes `runId` part
of the identity, which is exactly the run-mixing protection the read-API audit
calls for. If you would rather not, tell us and we will configure
`keyFields` client-side — but then please confirm `runId` is stable for the
lifetime of one page's queries.

## 6. `@defer` accepted but not streaming

Confirmed independently: a query with `... @defer` returns
`Content-Type: application/json`, not `multipart/mixed` — the deferred fragment
is silently collapsed into one response.

Root cause is a dependency ceiling, not a bug: `@apollo/server@5.5.1`
peer-depends on `graphql: ^16.11.0`, and incremental delivery needs
graphql-js 17 (now released at 17.0.2). Nothing to fix today.

**Request:** no action, just two things when it becomes possible —

1. tell us which incremental protocol the server emits
   (`Defer20220824` vs `GraphQL17Alpha9`), since Apollo Client needs a matching
   `incrementalHandler` and defaults to `NotImplementedHandler`, which
   **silently drops** chunks; and
2. keep the directives in the schema meanwhile, as you have — it means
   streaming lights up without a schema redesign.

## 7. Known gaps, flagged as already understood

Listed for completeness; the honest empty responses are the right call and we
are not asking for placeholder data.

- `StrainSummary.workouts` returns `[]` — per-workout strain isn't persisted.
  Verified empty on live data.
- `HeartRateData.series(resolution:)` bucketing dropped — no aggregation to
  read.

When these land, the pages that would use them are still on the legacy
pipeline, so there is no migration blocked on them today.

## Not a request: range bounds

Confirmed `days` accepts no `range` at all and returns every day (617 on this
account; 922 KB when hourly heart rate is nested). This is intentional per the
project owner — the frontend is expected to be disciplined about what it asks
for. Noting it only so the behavior is documented, not to ask for a cap.

Our migrated pages select only the series fields they need and never touch
`Day.timeline` across a range, which keeps those responses at ~4 KB / ~20 ms.
