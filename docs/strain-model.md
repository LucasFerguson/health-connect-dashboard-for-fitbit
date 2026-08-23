# Physical and mental strain model

This document proposes a versioned, explainable strain pipeline. It deliberately separates what a wearable can observe from what the application can infer.

## Important distinction

A wearable can estimate **physiological activation**, but it cannot reliably determine whether the cause is a difficult work project, illness, caffeine, dehydration, excitement, or emotional stress from physiology alone. WHOOP likewise describes its Stress Monitor as physiological stress based on heart rate, heart-rate variability, a personal baseline, and motion. It uses motion to reduce confusion with exercise and recommends journaling for psychological context.

Therefore the application should expose three related—but different—statistics:

1. **Physical strain**: cardiovascular and mechanical load attributable to detected activity.
2. **Non-activity physiological strain**: autonomic activation outside sleep and detected exercise.
3. **Mental strain**: non-activity physiological strain combined with explicit work/context labels and a short subjective workload check-in. Without those contextual inputs, the UI must use the non-activity label rather than claiming the load was mental.

## Required source observations

### Physical strain

- Continuous or frequent heart-rate samples
- Resting and estimated maximum heart rate
- Exercise-session start, end, and activity type
- Time in personalized heart-rate zones
- Session duration
- Steps, distance, elevation, and active calories when available
- Optional post-session rating of perceived exertion (RPE, 0–10)

### Non-activity physiological strain

- Frequent heart-rate and RMSSD HRV samples
- Rolling personal HR and HRV baselines
- Motion or accelerometer data to exclude physical exertion
- Sleep intervals to exclude sleep
- Helpful optional signals: electrodermal activity, skin temperature, respiratory rate, and blood oxygen

### Mental strain

- Everything used for non-activity physiological strain
- Calendar/work-session context or manual activity labels
- Short self-report at the end of a work block
- Suggested NASA-TLX-derived fields: mental demand, temporal demand, effort, performance, and frustration
- Optional free-text note describing the task

NASA-TLX includes physical demand as a separate field. Keeping that question allows a user to label mixed tasks instead of forcing every event into a purely mental or physical bucket.

## Proposed calculations

### Physical strain v1

Calculate load per exercise session using an Edwards-style summated heart-rate-zone score:

```text
session load = Σ(minutes in HR zone × zone weight)
zone weights = 1, 2, 3, 4, 5 for zones 1–5
```

Normalize the result against the person’s rolling 42-day distribution and map it to a 0–100 daily score. Preserve the raw zone minutes and load units. If RPE is available, also calculate session-RPE load:

```text
session RPE load = session duration in minutes × RPE
```

Do not silently merge these two algorithms. Store them as separate estimates so their agreement can be evaluated.

### Physiological activation v1

Calculate five-minute epochs outside sleep:

```text
HR activation  = robust z-score(HR relative to time-of-day baseline)
HRV activation = robust z-score(personal RMSSD baseline relative to current RMSSD)
activation     = sigmoid(0.45 × HR activation + 0.55 × HRV activation)
```

Motion and exercise-session overlap classify each epoch:

- Activity present: contributes to physical strain.
- No activity: contributes to non-activity physiological strain.
- Ambiguous motion or missing HRV: retains an `uncertain` classification and lower confidence.

Daily views should report minutes in low, medium, and high activation zones rather than only a single score.

### Mental strain v1

Mental strain should be calculated only for epochs attached to a work/context block:

```text
objective component = average non-activity physiological activation
subjective component = normalized NASA-TLX-derived check-in
mental strain = 40% objective + 60% subjective
```

The initial weighting is a hypothesis, not an industry standard. Store both components, the final score, and confidence. After enough labeled blocks exist, fit personalized weights and compare them with the versioned v1 result.

## Suggested domain and database records

```text
heart_rate_samples
hrv_rmssd_samples
exercise_sessions
heart_rate_zone_intervals
strain_context_blocks
workload_check_ins
strain_epochs
daily_strain_summaries
strain_model_runs
```

Each derived record should include `algorithmVersion`, source observation IDs, start/end times, score components, confidence, and quality flags. Raw Health Connect records remain immutable.

## Current blocker

The dashboard currently imports daily steps, calories, resting heart rate, weight, and sleep. That is enough for long-term health trends but not enough to distinguish afternoon exercise from a mentally difficult work block. The next backend milestone is importing `HeartRateRecord`, `HeartRateVariabilityRmssdRecord`, and `ExerciseSessionRecord`, then adding lightweight context/check-in entry.

## References

- [WHOOP Stress Monitor documentation](https://support.whoop.com/s/article/Get-to-Know-the-Stress-Monitor?language=en_US)
- [WHOOP explanation of physiological stress and motion](https://www.whoop.com/us/en/thelocker/introducing-stress-monitor-a-new-way-to-monitor-manage-stress/)
- [NASA Task Load Index](https://www.nasa.gov/human-systems-integration-division/nasa-task-load-index-tlx/)
- [Primary study of wearable mental workload signals](https://pmc.ncbi.nlm.nih.gov/articles/PMC8036989/)
- [Primary study validating wrist HRV and electrodermal sensing under stress](https://pmc.ncbi.nlm.nih.gov/articles/PMC10611310/)
- [Primary study using TRIMP from session heart-rate data](https://pmc.ncbi.nlm.nih.gov/articles/PMC6561225/)
- [Health Connect record types](https://developer.android.com/reference/androidx/health/connect/client/records/Record)
- [Health Connect exercise-session guidance](https://developer.android.com/health-and-fitness/health-connect/experiences/workouts)
