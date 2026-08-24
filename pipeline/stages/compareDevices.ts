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
import type {
  DeviceSleepSummary,
  SleepEvent,
} from "../../src/domain/analytics";
import type { SleepSession } from "../../src/domain/health";
import { sleepMinutes } from "../../src/domain/sleep";

export function compareDevices(events: SleepEvent[]): DeviceSleepSummary[] {
  const observations = new Map<
    string,
    { durations: number[]; pairedDifferences: number[] }
  >();

  for (const event of events) {
    const representatives = representativesBySource(event.recordings);
    const durations = [...representatives.entries()].map(
      ([source, recording]) => ({ source, minutes: sleepMinutes(recording) }),
    );

    for (const { source, minutes } of durations) {
      const summary = observations.get(source) ?? {
        durations: [],
        pairedDifferences: [],
      };
      summary.durations.push(minutes);
      const peers = durations.filter((item) => item.source !== source);
      if (peers.length > 0) {
        summary.pairedDifferences.push(
          minutes - average(peers.map((item) => item.minutes)),
        );
      }
      observations.set(source, summary);
    }
  }

  return [...observations.entries()]
    .map(([source, values]) => ({
      source,
      recordingCount: values.durations.length,
      averageSleepMinutes: average(values.durations),
      comparisonCount: values.pairedDifferences.length,
      averageDifferenceMinutes:
        values.pairedDifferences.length > 0
          ? average(values.pairedDifferences)
          : null,
    }))
    .sort(
      (left, right) => right.averageSleepMinutes - left.averageSleepMinutes,
    );
}

function representativesBySource(recordings: SleepSession[]) {
  const representatives = new Map<string, SleepSession>();
  for (const recording of recordings) {
    const existing = representatives.get(recording.source);
    if (!existing || sleepMinutes(recording) > sleepMinutes(existing)) {
      representatives.set(recording.source, recording);
    }
  }
  return representatives;
}

function average(values: number[]): number {
  return values.reduce((total, value) => total + value, 0) / values.length;
}
