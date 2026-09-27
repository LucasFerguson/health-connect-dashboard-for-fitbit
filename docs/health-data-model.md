# Health data model

> The grouping described here used to run in this repo's own pipeline. It is
> now computed by HCGateway, which serves the resulting sleep events (with
> every source recording attached) over GraphQL; this dashboard only renders
> them. The rules below still describe what the UI shows.

The database is an immutable collection of observations from independent health devices. Fitbit, WHOOP, Google Fit, and future sources can all describe the same real-world sleep. Those records are not duplicates and must not be deleted merely because their time ranges overlap.

The presentation layer groups recordings into a `SleepEvent` when at least 80% of the shorter recording overlaps another recording. Each event retains every source record and chooses the longest recording as its default presentation. Users can switch between device recordings in the sleep-stage view.

A day can still contain multiple real sleep events, such as overnight sleep and a nap. The calendar totals one representative recording per event rather than adding overlapping device observations together. Its session count refers to real-world sleep events, while its device label indicates that additional source observations are available.

This grouping is derived at read time. It never modifies the source records or writes to the health database. As the application grows, source preferences and confidence scoring can be added without sacrificing the raw observations.

Every sleep detail identifies its recording source, even when only one device recorded the event. The device comparison summarizes each source's average tracked sleep and also calculates a paired difference using only events observed by multiple sources. Paired comparisons reduce bias from devices being worn on different nights, while the displayed sample counts make the strength of each comparison visible.

When an event has multiple device observations, the sleep-stage graph provides a combined mode. It overlays one labeled line per source on the same time and stage axes so agreements and disagreements remain visible without merging or altering the underlying observations.
