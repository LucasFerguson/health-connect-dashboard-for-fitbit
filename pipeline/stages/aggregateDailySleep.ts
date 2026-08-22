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
