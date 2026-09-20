# Code that becomes redundant once GraphQL lands

This maps what in this repo exists only because there's no prepared-analytics
API yet, following the same pattern the `/day` route already proved out
(HCGateway computes analytics; this repo just validates and renders). None of
this can be deleted today — HCGateway has no GraphQL schema or `/graphql`
route yet (see `/root/HCGateway/doc/graphql-read-api-audit.md`: audit only, no
implementation). This is a target list for when it does.

## Tier 1 — deletable outright (~2,373 lines)

The entire `pipeline/` directory. Every stage recomputes analytics that
HCGateway's Python port (`health-analytics-v8.3`) already computes
server-side. Once every page reads prepared data instead of raw records,
nothing in this repo should run reconciliation, aggregation, or scoring
locally.

Verified dependency direction (2026-09-19): `src/server/health/getHealthSnapshot.ts`
is the **only** file under `src/` that actually imports from `pipeline/`. The
new day path (`getDayAnalytics.ts`, `dayViewTime.ts`) references it in prose
comments only, so migrating the legacy pages cleanly severs `pipeline/` in one
cut — it does not need untangling from the `/day` code first.

| File                                                                               | Lines | Replaced by                           |
| ---------------------------------------------------------------------------------- | ----: | ------------------------------------- |
| `pipeline/stages/calculateHealthspan.ts`                                           |   329 | HCGateway healthspan/Recovery output  |
| `pipeline/adapters/mongoAnalyticsStore.ts`                                         |   316 | HCGateway's own Mongo persistence     |
| `pipeline/stages/calculateSleepConsistency.ts`                                     |   234 | HCGateway sleep-consistency analytics |
| `pipeline/stages/calculateSleepDebt.ts`                                            |   138 | HCGateway sleep-debt analytics        |
| `pipeline/stages/metrics/aggregateIntervalMetric.ts`                               |   158 | HCGateway metric aggregation          |
| `pipeline/processHealthData.ts`                                                    |   101 | HCGateway's pipeline orchestration    |
| `pipeline/stages/metrics/aggregatePointMetric.ts`                                  |    97 | "                                     |
| `pipeline/stages/reconcileSleepEvents.ts`                                          |    87 | HCGateway sleep reconciliation        |
| `pipeline/stages/metrics/buildMetricOverview.ts`                                   |    88 | "                                     |
| `pipeline/stages/compareDevices.ts`                                                |    77 | HCGateway device-comparison output    |
| `pipeline/runPipeline.ts` / `config.ts` / `context.ts` / `ports/analyticsStore.ts` |   105 | N/A — orchestration for the above     |
| `pipeline/stages/aggregateDailySleep.ts`                                           |    32 | HCGateway daily sleep summary         |
| plus all `pipeline/**/*.test.ts`                                                   |  ~475 | tests for deleted code                |

**Also delete**, once nothing imports it:

- `src/domain/analytics.ts` (211 lines) — the local `HealthAnalytics` type
  tree. GraphQL-generated types (via `graphql-codegen`) replace it entirely;
  don't hand-maintain both.

  **This is the highest-effort item, not a simple delete.** 35 files import
  it: 15 live under `pipeline/` (they die with it), but ~19 are _components_
  (`metric-detail/` ×5, `sleep-debt/`, `sleep-consistency/`, `healthspan/`,
  `health-signals/` ×2 each, plus `sleep-quantity/`, `sleep-stages/`,
  `data-sources/`) that type their props against these interfaces. Each one
  needs its prop types repointed at generated GraphQL types. Where the
  GraphQL field shape matches, that's a mechanical import swap; where it
  differs, the component's props change. Budget for this — it's the bulk of
  the real migration work, and it's why the sequencing note below matters.

- `src/server/health/healthRepository.ts`, `createHealthRepository.ts`,
  `healthConnectRepository.ts`, `getHealthSnapshot.ts` (~260 lines combined)
  — the raw-record-fetching + pipeline-invocation chain that
  `/api/health` and every legacy page currently call.
- `src/server/health/healthSnapshotShape.ts` (21 lines, added this session)
  — the shallow Zod guard on `/api/health`'s response. Only exists because
  that endpoint's payload was never schema-generated. A GraphQL response
  validated by generated types doesn't need a hand-written parallel guard.

## Tier 2 — collapses once every page migrates (not yet safe to touch)

`src/features/health/HealthDataProvider.tsx` (150 lines): the reducer +
`setInterval` 60s polling + manual refresh-failure tracking. Once data comes
from Apollo Client, this becomes `useQuery(..., { pollInterval: 60_000 })` —
Apollo's cache, loading/error states, and polling replace essentially all of
it. Local UI-only state (`selectedDate`, `selectedSleepSessionId`) would
still need to live somewhere, but the snapshot-fetching half disappears.

**Important**: this must be a _client_-side Apollo setup
(`ApolloNextAppProvider`), not the RSC client in
`src/server/health/graphqlClient.ts`. Polling needs reactivity, and per
Apollo's Next.js guidance RSC queries don't update in the browser. The
scaffolding committed so far covers only the RSC half — the client provider is
still unbuilt.

`src/features/health/selectors.ts` (77 lines) and `dailySelectors.ts` (61
lines) split cleanly into two groups:

- **Replaced by GraphQL field arguments** — `selectSleepSessionsForDate`,
  `selectSleepEventsForDate`, `selectSleepDays`, `selectDeviceSleepSummaries`,
  `selectDailyHealth`. These filter/reshape a whole-history blob down to what
  one view needs. A `day(date:)`-style query returns that directly, the way
  `/day` already does — no client-side filtering.
- **Survives** — `selectDefaultSleepSession`. This is "which session should be
  selected in the UI right now", not data shaping. It stays wherever local UI
  state lands.

`src/features/health/metricFormatters.ts` / `metricPresentation.ts` (~107
lines): display formatting is likely to survive largely as-is — GraphQL
changes where data comes from, not how it's formatted for display. Only
worth revisiting if HCGateway starts returning pre-formatted display strings.

## Tier 3 — REST plumbing retired once its consumers migrate

- `src/app/api/health/route.ts` — this repo's own REST proxy endpoint that
  `HealthDataProvider` polls. Gone once the client talks to GraphQL directly.
- `src/server/health/healthConnectClient.ts`'s login/token-cache logic — not
  deleted, but duplicated (not shared) by `src/server/health/graphqlClient.ts`
  added this session. Once the REST day-analytics path
  (`getDayAnalytics.ts`) also moves to GraphQL, the REST client and its
  separate token cache can go, leaving one auth path instead of two.
  `graphqlClient.ts` already exports `invalidateGraphQLToken()` for the
  401-refresh case the REST client handles internally, so that behavior
  doesn't need re-deriving at migration time.

## Pages that will change their fetch, not their JSX

`src/app/(overview)/page.tsx`, `src/app/sleep/page.tsx`,
`src/app/sleep-debt/page.tsx`, `src/app/sleep-consistency/page.tsx`,
`src/app/healthspan/page.tsx`, `src/app/data-sources/page.tsx` — all six
originally called `getHealthSnapshot()` directly.

**Migration status (2026-09-20): all ten routes now read GraphQL.** `/`
(overview), `/sleep`, `/sleep-debt`, `/sleep-consistency`, `/healthspan`,
`/data-sources`, and the four metric detail routes (`/steps`, `/calories`,
`/resting-heart-rate`, `/weight`). Each page states which path served it at the
top — derived at request time, not hardcoded, so a GraphQL outage shows as a
fallback rather than lying.

Every page still keeps its `getHealthSnapshot()` fallback, so `pipeline/`
remains reachable and cannot be deleted yet. Removing it is now a deliberate
decision rather than a blocked one: delete the fallbacks first (accepting that
a GraphQL outage becomes a hard error instead of a degraded page), then Tier 1
follows. Worth keeping the fallbacks until the backend's `variables` bug and the
`String!`-instead-of-enum items in GRAPHQL_BACKEND_REQUESTS.md are resolved. (`src/app/error.tsx` mentions
it only in a comment; it is not a consumer.) Their component trees
(`Dashboard.tsx` and friends) mostly consume already-shaped data through
hooks/props, so the migration is swapping what feeds
`HealthDataProvider`/`useHealthData()`, not rewriting the dashboard UI. This is the same shape of change the `/day` route
already made against the REST prepared-analytics endpoint — GraphQL is one
more transport swap on top of a pattern already proven in this codebase.

## Not on this list

`src/domain/health.ts` (raw `SleepSession`/`RawHealthData` types) and
`src/server/health/fixtureRepository.ts` are marked SHARED, not LEGACY — the
raw Health Connect model and fixture data stay relevant regardless of
transport, since HCGateway's raw ingestion still uses the same shapes.

## Sequencing note

Don't delete anything in Tier 1–2 until every page in the last section reads
from GraphQL. Deleting `pipeline/` or `domain/analytics.ts` early breaks every
page that hasn't migrated yet — this list is a target, not an order of
operations.
