# Health analytics pipeline

This subsystem is independent from React and turns immutable source observations into versioned frontend-ready analytics for sleep, steps, calories, resting heart rate, and weight.

The day view (`/day/[date]`) does not use this pipeline — it consumes a prepared analytics API from the backend instead. See the main [README](../README.md#architecture-and-data-flow) for how the two paths currently coexist. This pipeline still runs for every other page.

```text
source repository -> reconciliation -> aggregation -> comparisons -> analytics store
```

- `stages/` contains pure transformations.
- `ports/` defines persistence contracts.
- `adapters/` contains infrastructure such as MongoDB.
- `processHealthData.ts` composes the pure stages.
- `runPipeline.ts` optionally persists a completed snapshot.
- `cli/run.ts` runs the pipeline independently from Next.js.

The pipeline never modifies HCGateway source observations. Mongo output uses a separate database and immutable, fingerprinted runs. Reprocessing unchanged input is a no-op.

Canonical units are steps, kilocalories, beats per minute, and kilograms. Interval metrics are split across calendar days in `HEALTH_HOME_TIME_ZONE`, aggregated per source, and reconciled by source coverage instead of being summed across devices. Resting heart rate uses a daily median; weight uses the latest daily observation. Every selected value retains its source and all per-source alternatives.

Each metric also produces calendar-aware seven-day trends and monthly averages. Missing days are excluded from averages rather than silently becoming zero. These prepared series are shared by the dashboard and metric detail pages.

Sleep debt is calculated from the reconciled daily sleep record as `max(target - recorded sleep, 0)`. Surplus sleep is retained separately and never erases source data. The target defaults to 480 minutes and can be set with `SLEEP_TARGET_MINUTES`. Rolling windows exclude days without a sleep record so an importer outage does not become eight hours of artificial debt.

Sleep consistency uses the longest reconciled sleep event as each day’s main sleep. After three baseline nights are available, local bedtime and wake time are compared with a circular baseline from the preceding 14 calendar days. Circular time math allows 11:50 PM and 12:10 AM to remain close together. The score begins at 100 and loses one point for every three minutes of average bedtime/wake deviation. Scores are classified as optimal (80–100), sufficient (70–79), or poor (below 70). Intermediate baseline and deviation fields are retained so this deliberately versioned heuristic can be audited and refined.

Healthspan v1 is explicitly experimental and is not a medical measurement. It combines 30-day sleep duration, sleep consistency, steps, and resting heart rate into separate, capped age adjustments. Health age is chronological age plus those auditable adjustments; `HEALTH_BIRTH_DATE` must be configured before the engine publishes an age. Pace of aging is the annualized regression slope of the health-age estimates from the latest 180 days. The precise factor values, references, coverage, contributions, and quality flags are retained so future models can be compared rather than silently replacing this heuristic.

Run without persistence:

```bash
npm run pipeline:run
```

To persist results, configure `ANALYTICS_MONGO_URI` and optionally `ANALYTICS_DATABASE`. The default database name is `health_analytics`. Daily sleep debt, sleep consistency, and healthspan estimates are stored with the other prepared daily metrics. Versioned summaries are stored in `sleep_debt_summaries`, `sleep_consistency_summaries`, and `healthspan_summaries`.
