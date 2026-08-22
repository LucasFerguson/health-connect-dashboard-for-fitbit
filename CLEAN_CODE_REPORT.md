# Clean Code Report

**Assessment date:** August 22, 2026  
**Score:** 73/100 — **C (promising, but not production-mature)**  
**Confidence:** High for structure and static quality; medium for long-running persistence behavior.

The project has grown from a prototype into a genuinely modular application with strong domain boundaries and one-way frontend flow. Its largest gap is no longer code organization: it is proving and operationalizing the new analytics architecture without duplicating large amounts of health data or recalculating the pipeline during every dashboard request.

## Scorecard

| Category | Score | Weight |
| --- | ---: | ---: |
| Correctness and verification | 13 | 20 |
| Architecture and modularity | 13 | 15 |
| Data models and state flow | 13 | 15 |
| Maintainability and readability | 11 | 15 |
| Types and contracts | 8 | 10 |
| Performance and scalability | 6 | 10 |
| Reliability and operability | 6 | 10 |
| Security and privacy | 3 | 5 |
| **Total** | **73** | **100** |

## What is strong

- The raw `SleepSession` model is provider-independent, and Health Connect payloads are validated and translated at one boundary.
- React now consumes prepared analytics rather than owning reconciliation logic. The dependency direction from infrastructure to domain to presentation is mostly clear.
- The root-level `pipeline/` subsystem has pure stages, a persistence port, a Mongo adapter, a composition function, and an independent CLI.
- Raw device observations remain immutable. Fitbit, WHOOP, and Google Fit records are retained with lineage inside derived sleep events.
- Pipeline runs have an explicit algorithm version and deterministic source fingerprint.
- Client state uses typed actions and selectors rather than components synchronizing one another directly.
- The production build, TypeScript, ESLint, and three focused pipeline tests pass. The standalone pipeline also processed the live dataset successfully.

## Highest-priority findings

### 1. Persistence currently duplicates too much data

`analytics_snapshots` embeds the complete analytics history, including sleep events and their raw recordings. The same event data is also written into `sleep_events`, and every changed fingerprint creates another immutable run. This will grow without bounds and an embedded snapshot can eventually approach MongoDB's document-size limit.

Persist normalized derived records once, keep raw-record IDs as lineage, and store a small current-run manifest instead of embedding the entire history in one document.

### 2. The frontend request still runs the pipeline

`getHealthSnapshot()` fetches every source sleep record and processes the full history during page and refresh requests. Optional Mongo persistence is therefore a side effect of reading the dashboard. This is a useful compatibility bridge, but it is not yet the intended architecture.

Move processing to the standalone command or a scheduled worker. The dashboard should read the latest completed analytics run through a read-only analytics repository.

### 3. Algorithmic policy needs broader tests

The 80% overlap rule is explicit and tested for a common multi-device event and a separate nap. It is not yet tested for chained/transitive overlaps, sessions crossing local midnight, malformed intervals, identical-duration ties, empty stages, multiple observations from the same provider, or changes between algorithm versions.

### 4. Timezone semantics are unresolved

Sleep events are assigned to the UTC date of their start timestamp. A local calendar can therefore display a session on a different day from the user's mental model. The domain needs an explicit home timezone and a documented rule for whether overnight sleep belongs to its start day or wake day.

### 5. Persistence needs operational hardening

The Mongo adapter creates a connection for each pipeline invocation, issues potentially hundreds of writes through one `Promise.all`, and does not establish indexes or record partial-run failure state. Use a shared client in long-running processes, `bulkWrite`, required indexes, and a run lifecycle such as `started`, `completed`, or `failed`.

## Secondary findings

- The browser refresh path casts JSON to `HealthSnapshot` without validating it.
- Polling has no timeout, backoff, cancellation, visible stale state, or last-success indicator.
- `SleepStagesGraph` now owns event controls, source controls, chart construction, and formatting; it is ready to split into smaller focused modules.
- Raw observations and derived events are both sent to the client, duplicating payload data.
- The ECharts dependency makes the first-load bundle relatively large; lazy loading the graph would improve initial delivery.
- The pipeline stores derived health data in plaintext. This is reasonable for the stated trusted home-lab threat model, but Mongo access and backups should remain private.
- Dependency auditing currently reports known vulnerabilities and should be reviewed without applying forced upgrades blindly.

## Recommended sequence

1. Define the persisted analytics schema and make the dashboard read the latest completed run.
2. Normalize persistence and add indexes, batching, and run-state tracking.
3. Expand reconciliation and aggregation tests before changing the algorithm.
4. Make timezone policy a domain concept.
5. Validate client refresh payloads and expose freshness/failure state.
6. Split the graph controls from ECharts option construction and lazy-load the chart.

This score is a structured engineering judgment calibrated for a single-user home-lab application. Lack of public authentication is not treated as a major defect under the stated deployment model.
