# Frontend requests for the GraphQL API

Written after migrating `/sleep-debt` and `/sleep-consistency` end to end
against the live API on `:6645`. Everything below was verified against real
responses, not inferred from the schema — counts and shapes are from actual
queries on the primary account (run `health-analytics-v8.3`).

Ordered by how much friction each one causes on the frontend.

## 1. Over-permissive nullability on `SleepConsistencyDay`

`source`, `bedtimeAt`, `wakeAt`, `bedtimeMinutesLocal` and `wakeMinutesLocal`
are all nullable in the schema. Measured over 492 real days:

| Field                 |    Nulls |
| --------------------- | -------: |
| `source`              | 0 (0.0%) |
| `bedtimeAt`           | 0 (0.0%) |
| `wakeAt`              | 0 (0.0%) |
| `bedtimeMinutesLocal` | 0 (0.0%) |

They are never null in practice. Because the schema says they might be, the
frontend has to write a guard that drops such days — code that can never run,
and which would silently hide data if the backend ever did emit a null.

**Request:** make them non-null (`String!` / `DateTime!` / `Float!`) if a
consistency day cannot exist without them. If a day genuinely can lack a
bedtime window, say so explicitly and we will render it as a gap — but then
the day should probably not appear in `daily` at all.

## 2. `breakdown30Day` is an untyped `JSON` scalar

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

## 3. No `id` on the date-keyed analytics types

Only 15 of 83 object types expose `id` — raw records, `SleepEvent`,
`StrainWorkout`, `ObservedDevice`. The date-keyed types (`Day`, `MetricDay`,
`SleepDebtDay`, `SleepConsistencyDay`, `HealthspanDay`, `StrainDay`,
`RecoveryDay`) have none.

Apollo's `InMemoryCache` normalizes by `__typename` + `id`. Without one:

- two queries covering overlapping date ranges store duplicate copies rather
  than merging;
- if a new `runId` is published mid-session, days from the old and new run can
  coexist in the cache with nothing distinguishing them.

**Request:** add `id: ID!` of the form `"<runId>:<date>"`. Server-side is
better than a client-side `keyFields: ["date"]` because it makes `runId` part
of the identity, which is exactly the run-mixing protection the read-API audit
calls for. If you would rather not, tell us and we will configure
`keyFields` client-side — but then please confirm `runId` is stable for the
lifetime of one page's queries.

## 4. `@defer` accepted but not streaming

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

## 5. Known gaps, flagged as already understood

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
