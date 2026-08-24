# Data audit request — Meridian day dashboard

I'm designing the front end for a personal health dashboard. The main screen is a **day view**: three headline scores at the top, one fixed 24-hour timeline in the middle (midnight to midnight), and a set of supporting panels. You can step backward and forward one day at a time, so past days read as recorded and future days read as planned.

Before anything gets built, I want to understand what actually exists on your side. **Please don't start implementing** — I'm asking for an inventory and your read on the gaps.

## What the screen needs

Grouped roughly by where it appears.

### Three headline scores

- **Sleep duration** — total time asleep for the night that ended on this date, plus time in each stage (deep, light, REM, awake) and the sleep window (bed time → wake time).
- **Sleep need** — how much sleep the night *should* have contained, given recent debt and strain. The headline is a percentage of need met, so this is a modelled target, not a constant.
- **Recovery** — a 0–100 score in the Whoop sense: how ready the body is today, derived mainly from overnight HRV, resting heart rate, respiratory rate, and sleep quality, each compared against the person's own recent baseline rather than population norms.
- **Strain** — a 0–21 cardiovascular load score, also Whoop-style: accumulated across the whole day from time spent in each heart-rate zone, weighted so higher zones count disproportionately. It builds through the day rather than being a single end-of-day number.
- **Strain target** — the strain the day is *supposed* to reach, usually a function of today's recovery.
- Supporting numbers next to each: HRV (ms), resting heart rate, respiratory rate, skin temperature deviation from baseline, steps, calories, time in zone 3 and above.

### The 24-hour timeline

- **Heart rate, aggregated per hour** — for each hour I need min, max, and the middle 50% (roughly 25th/75th percentile), plus the hourly mean. I'm drawing candlesticks, so a single average per hour isn't enough.
- **Sleep stages as a time series** — stage segments with start and end timestamps, not just nightly totals, including brief awakenings and any daytime naps.
- **Steps per hour** — a simple hourly count, plus which hour contained a workout so it can be coloured differently.
- **Workouts** — start, end, type, and the strain contribution of each.
- **The day's schedule as time blocks** — sleep, wake, commute, work, workout, dinner, wind-down. This is the one I expect you don't have: it's partly calendar data, partly inferred from location and movement, partly a user-declared routine. I'd like to know which of those three you can realistically supply.
- **Alarm / target wake time** and **target bed time** — currently 07:00 and 00:00. Are these stored preferences, read from a phone alarm, or would they need to be entered in the app?
- **Now** — the boundary between recorded and projected data. Everything to the right of it is drawn empty, so I need to know how stale the most recent data actually is (how often the wearable syncs, and how far behind real time the aggregates run).

### Supporting panels

- **Time in each heart-rate zone, today so far** — cumulative minutes per zone.
- **Zone boundaries** — I'm labelling them as coming from a lactate-threshold test rather than an age formula. Are personal zone thresholds stored anywhere, with a test date?
- **The ±7-day strip** — for each nearby day, the three headline scores at low resolution, and a flag for whether the day is recorded or still in the future.
- **Baselines and trends** — several panels compare today to a 14-day or 90-day norm ("resting HR at a 90-day low", "sleep midpoint 26 minutes later than target", "fourth night drifting"). These are all rolling comparisons against the person's own history.

## What I'd like to know

1. **What of the above is already in the database?** Which tables, at what granularity, and how far back does the history go?
2. **Where does each field come from** — raw off the wearable, computed by a pipeline, or user-entered?
3. **Which pipelines already run automatically?** Specifically: what recalculates on a schedule, what triggers on new device data, and what's still a manual script someone runs.
4. **For the modelled scores — recovery, strain, sleep need — does anything compute them today,** or are those still to be written? If they exist, what inputs and weighting do they use, and do they already normalise against a personal baseline?
5. **What's missing entirely**, and of those, which do you think are cheap and which are genuinely hard? The day-schedule blocks and the modelled scores are my two suspects.
6. **How fresh is the data in practice** — sync cadence, aggregation lag, and whether hourly aggregates are computed as data arrives or in a nightly batch.
7. **Anything you already have that I haven't asked for.** If there's a signal in there I'm not showing, I'd rather know now.

An honest map of what exists and what doesn't is more useful to me than anything built early.
