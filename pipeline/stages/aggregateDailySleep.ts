/**
 * LEGACY — part of the old plan where this repo computed its own health
 * analytics locally. That plan has changed: a separate backend (HCGateway)
 * now owns analytics computation, and this repo is moving toward being
 * frontend-only. This file still runs for pages that haven't been migrated
 * yet (see README.md's "Architecture and data flow" section).
 *
 * Do not extend this file with new metrics, new computations, or new
 * data-processing logic. If a page needs something this doesn't already
 * provide, ask the user whether it should come from a new HCGateway API
 * endpoint instead of being built here.
 */
import type { DailySleepSummary, SleepEvent } from "../../src/domain/analytics";
import { sleepMinutes } from "../../src/domain/sleep";
import { groupBy } from "../shared/groupBy";

export function aggregateDailySleep(events: SleepEvent[]): DailySleepSummary[] {
  return [...groupBy(events, (event) => event.date).entries()]
    .map(([date, dailyEvents]) => ({
      date,
      sleepMinutes: dailyEvents.reduce(
        (total, event) => total + sleepMinutes(event.primary),
        0,
      ),
      eventCount: dailyEvents.length,
      recordingCount: dailyEvents.reduce(
        (total, event) => total + event.recordings.length,
        0,
      ),
    }))
    .sort((left, right) => left.date.localeCompare(right.date));
}
