---
name: clean-code-report
description: Evaluate an existing software project for code quality, architecture, correctness, maintainability, data flow, testing, performance, and operational fitness. Use when a user asks for a clean-code report, codebase health score, engineering-quality audit, technical-debt assessment, or prioritized quality roadmap; do not trigger for a narrow review of one patch or file unless the user requests a project-level score.
---

# Clean Code Report

Produce an evidence-based assessment calibrated to the project's purpose, maturity, deployment environment, and team size. Do not reward abstraction by itself or penalize a small project for lacking enterprise machinery it does not need.

## Workflow

1. Establish scope from repository guidance, manifests, structure, history, and the user's stated constraints.
2. Inspect representative execution paths end-to-end. Trace at least one important data flow across boundaries rather than judging filenames alone.
3. Run the project's existing static checks and tests when safe and available. Clearly distinguish checks actually run from inferred quality.
4. Read [references/rubric.md](references/rubric.md) and score every category. Cite concrete files, patterns, commands, or observed behavior for both strengths and deductions.
5. Report the weighted total, confidence level, strongest qualities, highest risks, and a prioritized improvement sequence.

## Assessment rules

- Treat correctness and data safety as more important than stylistic preference.
- Distinguish current defects, scaling risks, missing safeguards, and optional refinements.
- Respect the actual threat model. Record deferred security work without letting irrelevant enterprise requirements dominate the score.
- Look for boundary direction, ownership of state, model clarity, idempotency, error behavior, observability, and testability.
- Flag duplicated sources of truth, hidden mutation, unsafe type assertions, unbounded storage, expensive request-time work, and abstractions that have no active use.
- Give credit for simple code when it is sufficient and cohesive.
- Never change code during an assessment unless the user also asks for remediation.

## Report shape

Lead with a score out of 100, a letter band, and a one-sentence verdict. Include a compact score table, then evidence-backed strengths and findings ordered by impact. End with the smallest practical sequence of improvements. State limitations and unexecuted checks.

Use these bands: A = 90–100, B = 80–89, C = 70–79, D = 60–69, F = below 60. Scores describe the codebase in its stated context, not the ability of its author.
