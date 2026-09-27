# Health Dashboard

A self-hosted dashboard for health metrics collected from phones and wearables:
daily and long-term views of sleep, sleep debt and consistency, steps,
calories, resting heart rate, weight, and an experimental healthspan model.

The dashboard computes nothing itself. All analytics are prepared by
HCGateway, a sibling self-hosted project that stores Health Connect data and
serves analytics over REST and GraphQL, and this app renders them. It needs a reachable HCGateway and valid
credentials to show anything; there is no demo or offline mode. If the backend
is missing or down, pages render the root error boundary ("Couldn't load
health data").

## Project documents

Read these before making changes. They carry decisions and open issues that
aren't visible in the code:

- **[JOURNAL.md](JOURNAL.md)**: why the project exists and how it got here,
  including the reasoning (and the mistakes) behind the GraphQL migration.
  Start here if you are new to the repo.
- **[GRAPHQL_BACKEND_REQUESTS.md](GRAPHQL_BACKEND_REQUESTS.md)**: open asks of
  the HCGateway backend, each verified against live responses. The ignored
  `variables` bug at the top is why `/api/sleep-stages` doesn't use the
  normal GraphQL path.
- **[docs/health-data-model.md](docs/health-data-model.md)**: how overlapping
  recordings from several devices are grouped into sleep events without
  deleting any of them.
- **[docs/strain-model.md](docs/strain-model.md)**: the proposed separation of
  physical, non-activity physiological, and mental strain. The day view's
  strain card is a placeholder until the backend implements it.
- **[Health Dashboard Desktop Mockups/](Health%20Dashboard%20Desktop%20Mockups/design_handoff_day_view/README.md)**:
  the design handoff the day view was built from.

## Architecture

```text
HCGateway GraphQL (:6645)
  -> withAnalytics(query)            server-side Apollo query, bearer token attached
  -> adapter / select function       GraphQL result -> domain types, drops rows it can't trust
  -> React Server Component page     renders the initial data
  -> client components               poll through /api/graphql for updates
```

- **Pages are Server Components.** Each route calls a `get*` function in
  `src/server/health/`, which runs its query through `withAnalytics`
  (`src/server/health/graphql/fetchAnalytics.ts`) and maps the result onto the
  domain types in `src/domain/`. The larger mappings live in
  `src/server/health/adapters/`. Adapters never invent a value: a row missing a
  required field is dropped rather than rendered as `0`.
- **The browser never holds a credential.** Client components that refresh
  (the overview polls every 60 seconds with Apollo `useQuery`'s
  `pollInterval`, see `src/features/health/HealthDataProvider.tsx`) talk to the
  same-origin `/api/graphql` route. That route runs server-side, exchanges
  `API_USERNAME`/`API_PASSWORD` for a bearer token at
  `POST $API_URL/api/v2/login`, and forwards only `query`, `variables` and
  `operationName` upstream.
- **`src/components`** renders domain data and does not know the wire format.
  `src/features/health` holds client state, selectors and formatters.

### The day view and the sync heartbeat

- **`/day/[date]`** runs the `DayPage` query (`day(date:)` plus
  `days(range:)` for the ±7-day strip, both as GraphQL variables) through
  `withAnalytics`, and `src/server/health/adapters/dayAdapter.ts` maps it onto
  the view model in `src/domain/dayView.ts`. Every metric carries its own
  availability `status` (`available`, `partial`, `missing`,
  `insufficient_data`, `not_implemented`, `blocked`, plus GraphQL's
  `unavailable` and `sample_time_only`) and the UI renders exactly that. The
  status-to-display logic is in `src/domain/dayViewPresentation.ts`. The
  adapter also fills gaps GraphQL leaves: it rebuilds `availabilityNotes`,
  adds strip cells for dates `days(range:)` omits, and shows heart-rate zones
  as unavailable because GraphQL doesn't expose the thresholds. `/day`
  redirects to today in the account's home time zone.
- **`/api/sync-status`** feeds the nav's sync indicator and the Docker
  `HEALTHCHECK`. It reads `viewer.ingestion.phoneSync` through `withViewer`
  (the non-analytics sibling of `withAnalytics`), keeps the JSON shape the old
  REST endpoint had, and answers 502 with the diagnosis when GraphQL fails.

### Exceptions to the GraphQL path

The remaining exception exists because HCGateway's GraphQL server used to
ignore `variables` (see [GRAPHQL_BACKEND_REQUESTS.md](GRAPHQL_BACKEND_REQUESTS.md)
#1), so a query that needed an argument had to be assembled as a string.

- **`/api/sleep-stages?date=YYYY-MM-DD`** serves
  the overview's sleep-stage graph. Stage timelines are left out of the bulk
  overview query (selecting them for every sleep event made that payload
  5.5 MB instead of 321 KB), so the graph fetches one day at a time. The route
  does query GraphQL, server-side, with the date interpolated into the query
  text; because that query is a runtime string, codegen can't see it and
  `getSleepStages.ts` hand-writes its result type. Once `variables` work, this
  route can be replaced by a normal `useQuery` through `/api/graphql`.

### Configuration that lives in HCGateway

Home time zone, sleep target, birth date, and heart-rate-zone thresholds are
not set in this repo. They are part of HCGateway's analytics config
(`PUT /api/v2/analytics/config` on the REST API) and apply to every page.

## GraphQL types (codegen)

Queries are written inline with the generated `graphql()` function and typed by
[GraphQL Code Generator](https://the-guild.dev/graphql/codegen). The schema is
read from the checked-in `graphql-introspection.json`, and the output in
`src/types/__generated__/` is committed, so builds need no network access or
running backend.

When the backend schema changes:

```bash
npm run codegen:schema   # refresh graphql-introspection.json (reads API_* from .env.local)
npm run codegen          # regenerate src/types/__generated__
```

Check the diff of `src/types/__generated__/` before committing. Codegen only
emits types that some `graphql()` document references, so removing the last
use of a type can silently delete something the build still depends on.

## Development

```bash
npm ci
cp .env.example .env.local   # fill in the HCGateway values
npm run dev                  # http://localhost:3000
npm run test                 # unit tests
npm run check                # lint + typecheck
```

## Environment variables

| Variable              | Required | Purpose                                                                             |
| --------------------- | -------- | ----------------------------------------------------------------------------------- |
| `API_URL`             | yes      | HCGateway REST origin, e.g. `http://192.168.8.239:6644`                             |
| `API_USERNAME`        | yes      | HCGateway account, exchanged for a bearer token at login                            |
| `API_PASSWORD`        | yes      |                                                                                     |
| `GRAPHQL_URL`         | no       | GraphQL endpoint. Defaults to `API_URL` with the port swapped to `6645`             |
| `DEV_ALLOWED_ORIGINS` | no       | Extra origins allowed to reach the dev server over the LAN                          |
| `PROD_PORT`           | no       | Host port for the prod container (default `3000`); also read by `scripts/deploy.sh` |
| `DEV_PORT`            | no       | Host port for the dev container (default `3001`); also read by `scripts/deploy.sh`  |

`.env.example` lists them all. Copy it to `.env` for Docker Compose and/or
`.env.local` for `npm run dev` on the host. Both are gitignored.

## Deployment

`docker-compose.yml` defines two services, each behind a Compose profile so a
bare `docker compose up` starts nothing:

- **`prod`** (`dashboard`, port 3000): the multi-stage `Dockerfile` builds a
  Next.js standalone server, tagged `health-connect-dashboard:local`. It
  refuses to start unless `API_URL`, `API_USERNAME` and `API_PASSWORD` are set.
- **`dev`** (`dashboard-dev`, port 3001): `next dev` with Turbopack and hot
  reload in a `node:20-alpine` container, with the repo bind-mounted.
  `node_modules` and `.next` live in named volumes so a host-side
  `npm run build` can't break it.

Use `scripts/deploy.sh` rather than calling Compose directly:

```bash
scripts/deploy.sh up [prod|dev|all]   # rebuild + (re)start, wait until healthy
scripts/deploy.sh status              # containers, health, and an HTTP check
scripts/deploy.sh logs [prod|dev] [N] # follow logs
scripts/deploy.sh versions            # prod images available for rollback
scripts/deploy.sh rollback <tag>      # redeploy an earlier prod build
scripts/deploy.sh down [prod|dev|all] # stop and remove containers
```

Every prod build is also tagged with the git SHA (plus `-dirty` for an
uncommitted tree), which is what `rollback` uses. `up` exits non-zero if the
container never becomes healthy.

## Roadmap

- [x] Calendar view for sleep data (2025-05-07)
- [x] Docker support (2025-06-28)
- [x] Daily sleep detail, multiple sleep sessions per day, and per-device
      recordings
- [x] Activity, calorie, resting-heart-rate, and weight pages
- [x] Year heatmaps, rolling trends, and monthly views
- [x] Sleep-debt and sleep-consistency analytics
- [x] Experimental health-age and pace-of-aging model
- [x] Redesigned day view backed by a prepared analytics API (`/day/[date]`)
- [x] All pages read prepared analytics from HCGateway; the in-repo analytics
      pipeline is deleted (2026-09)
- [ ] Tests for the GraphQL adapters
- [ ] Move `/day` and `/api/sleep-stages` onto GraphQL once the backend honours
      `variables`
- [ ] Recovery and strain, once HCGateway computes them

Dashboard screenshot (September 2025, before the redesign; out of date):

![Dashboard screenshot from September 2025](dash-2025-09-13.png)

## Tech stack

Next.js (App Router, created with Create T3 App), React 19, Tailwind CSS,
Apollo Client, ECharts, Zod.
