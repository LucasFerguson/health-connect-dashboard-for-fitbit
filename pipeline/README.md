# Health analytics pipeline

This subsystem is independent from React and turns immutable source observations into versioned frontend-ready analytics.

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

Run without persistence:

```bash
npm run pipeline:run
```

To persist results, configure `ANALYTICS_MONGO_URI` and optionally `ANALYTICS_DATABASE`. The default database name is `health_analytics`.
