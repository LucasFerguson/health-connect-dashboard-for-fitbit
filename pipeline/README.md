# Health analytics pipeline

This subsystem is independent from React and turns immutable source observations into versioned frontend-ready analytics for sleep, steps, calories, resting heart rate, and weight.

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

Run without persistence:

```bash
npm run pipeline:run
```

To persist results, configure `ANALYTICS_MONGO_URI` and optionally `ANALYTICS_DATABASE`. The default database name is `health_analytics`. Daily sleep debt is stored with the other prepared daily metrics, while its target, methodology, rolling overview, and 30-day breakdown are stored in `sleep_debt_summaries`.
