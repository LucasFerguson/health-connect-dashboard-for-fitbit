# Health Dashboard

A self-hosted dashboard for health metrics collected from phones and wearables. It provides daily and long-term views of sleep, steps, calories, resting heart rate, and weight. When API credentials are absent, the app intentionally uses its bundled demo dataset.

## Architecture and data flow

**The app currently has two data paths, mid-migration.** Most pages still use the original local-pipeline flow described below. The day view (`/day/[date]`) has moved to a different, simpler path: it calls a prepared analytics API exposed by the backend (HCGateway, a sibling project) and does no local computation of its own. The plan is to migrate the rest of the app to the same prepared-API approach so the TypeScript pipeline in this repo and the backend's own analytics implementation can't drift from each other; until that happens, both paths are real and in active use.

### Legacy path (most pages today)

```text
Health Connect API -> repository/DTO validation -> domain model
    -> server snapshot -> client provider -> selectors -> UI widgets
                       <- user actions ---------|
```

- `src/domain` contains provider-independent health models and calculations.
- `src/server/health` owns external I/O. Repositories translate and validate external payloads with Zod.
- `src/features/health` owns client state, user actions, and derived selectors.
- `src/components` renders domain data and dispatches actions; it does not know the backend response format.

The server renders the initial snapshot, and the client refreshes it through `/api/health` every 60 seconds. A refreshed snapshot follows the same reducer and selector path as the initial data, so widgets update without bespoke synchronization code.

New data sources should implement `HealthRepository`. New metrics should first be added to `HealthSnapshot`, then mapped at the repository boundary, exposed through a selector, and finally rendered by a component. This keeps backend changes from spreading through the UI.

`HEALTH_HOME_TIME_ZONE`, `SLEEP_TARGET_MINUTES`, and `HEALTH_BIRTH_DATE` (below) only affect this legacy path's own analytics pipeline. They have no effect on the day view.

The non-destructive reconciliation of observations from multiple devices is documented in [Health data model](docs/health-data-model.md).

The independently runnable analytics subsystem behind this path is documented in [Health analytics pipeline](pipeline/README.md).

The proposed separation of physical, non-activity physiological, and mental strain is documented in [Strain model](docs/strain-model.md).

### New path (`/day/[date]` only, for now)

The day view calls `GET /api/v2/analytics/day` on HCGateway and renders the response directly — no local aggregation, no local timezone/target-minute config. Every field on that response carries its own availability `status` (`available`, `partial`, `missing`, `insufficient_data`, `not_implemented`, `blocked`) and, where relevant, a human-readable `note`; the frontend renders exactly what the API says is true rather than inferring or defaulting missing data to zero.

Backend configuration for this path — home time zone, sleep target, birth date, and personal heart-rate-zone thresholds — lives on the HCGateway server itself and is set via `PUT /api/v2/analytics/config` on that API, not through this repo's environment variables. See `/root/HCGateway/doc/frontend-data-model.md` on the backend host for the full contract.

Client code for this path: `src/server/health/dayAnalyticsSchema.ts` (the Zod-validated response contract), `src/server/health/getDayAnalytics.ts` (the entrypoint, real API or fixture depending on configuration), `src/domain/dayViewPresentation.ts` (pure status-to-display logic), and `src/components/day-view/`.

Roadmap:

- [x] Implement a calendar view for sleep data - 2025-05-07
- [x] Docker support for easy deployment - 2025-06-28
- [x] Allow users to click on a day in the calendar to view detailed sleep data
- [x] Represent multiple daily sleep sessions and allow switching between them
- [x] Add activity, calorie, resting-heart-rate, and weight analytics
- [x] Add daily health summaries and reusable metric detail pages
- [x] Add year heatmaps, rolling trends, and monthly views
- [x] Add configurable rolling sleep-debt analytics and persistence
- [x] Add versioned sleep-consistency analytics and persistence
- [x] Add an experimental, auditable health-age and pace-of-aging model
- [x] Add reusable year heatmaps for sleep quantity, debt, and consistency
- [x] Add a redesigned day view backed by a prepared backend analytics API (`/day/[date]`)
- [ ] Migrate the remaining pages off the local pipeline to the same prepared-API approach
- [ ] Add persistence, scheduled imports, and historical aggregation

Dashboard Screenshot:
![alt text](dash-2025-09-13.png)

## Tech Stack

The following technologies are used in this project:

- Create T3 App
  - [Next.js](https://nextjs.org)
  - [Tailwind CSS](https://tailwindcss.com)

# Deployment

## Environment Variables

Use docker compose to set environment variables with the following example:

```yaml
services:
  dashboard:
    image: lucaslad5275/hc-dashboard:1.0
    container_name: health-connect-dashboard
    ports:
      - "3000:3000"
    environment:
      - API_USERNAME=EDIT_ME
      - API_PASSWORD=EDIT_ME
      - API_URL=http://192.168.8.EDIT_ME:6644
    restart: unless-stopped
```

### OR

Create a `.env` file in the root directory of the project with the following content. If these values are omitted, demo data is used.

```
API_USERNAME=your_username
API_PASSWORD=your_password
API_URL=http://your-health-connect-api:6644
HEALTH_HOME_TIME_ZONE=America/Chicago
SLEEP_TARGET_MINUTES=480
HEALTH_BIRTH_DATE=1990-01-31
```

## Building and Running the Dashboard

_Make sure you have Docker installed on your machine._

Run the following command to build the Docker image for the dashboard:

```bash
docker build -t lucaslad5275/hc-dashboard:1.0 .
```

Run the following command to start the Docker container:

```bash
docker run -p 3000:3000 lucaslad5275/hc-dashboard:1.0
```

### OR

```bash
docker-compose up -d
```
