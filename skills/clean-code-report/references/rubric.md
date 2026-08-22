# Clean Code Report rubric

Score each category independently, then add the weighted points. Use intermediate values rather than forcing all-or-nothing judgments.

| Category | Weight | What to evaluate |
| --- | ---: | --- |
| Correctness and verification | 20 | Tests for important behavior, edge cases, deterministic results, validation performed, failure handling, and evidence that the system works end-to-end. |
| Architecture and modularity | 15 | Cohesion, dependency direction, boundary clarity, replaceability, isolation of infrastructure, and whether abstractions solve current problems. |
| Data models and state flow | 15 | Canonical models, ownership, normalization, lineage, derived versus raw data, one-way flow, mutation control, and avoidance of duplicated truth. |
| Maintainability and readability | 15 | Naming, module size, local reasoning, duplication, comments, complexity, discoverability, and consistency. |
| Types and contracts | 10 | Boundary validation, type precision, unsafe casts, invariants, schema evolution, and API compatibility. |
| Performance and scalability | 10 | Algorithmic cost, payload size, caching, database access, batching, concurrency, and bounded resource growth in the expected usage context. |
| Reliability and operability | 10 | Idempotency, retries, timeouts, observability, migrations, configuration, backups, deployment checks, and recovery behavior. |
| Security and privacy | 5 | Authentication relative to the stated threat model, secret handling, exposure, least privilege, sensitive-data storage, and dependency risk. |

## Scoring anchors

- **90–100% of category weight:** Strong evidence, well-designed failure behavior, and only minor refinements remain.
- **75–89%:** Sound foundation with limited gaps that are understood or localized.
- **50–74%:** Functional but important behavior is implicit, untested, duplicated, or likely to become costly.
- **25–49%:** Material correctness or maintainability risk; boundaries are unreliable or safeguards are mostly absent.
- **0–24%:** Unsafe, unverifiable, or fundamentally mismatched to its purpose.

## Confidence

Report high confidence only when important paths were inspected and relevant checks ran. Use medium confidence when static evidence is strong but runtime or integration behavior was not observed. Use low confidence for partial access, missing dependencies, or a narrow sample.

Do not inflate precision: category scores may be exact integers for arithmetic, but explain that the total is a structured engineering judgment rather than an objective measurement.
