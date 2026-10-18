/**
 * The day's raw step records (`sourceRecords.steps`) for the day view's
 * movement lane, at whatever resolution each app wrote them: Fitbit writes
 * one record per minute, the phone's own counter sub-minute ones, and WHOOP
 * one record spanning a whole day or more. The backend's hourly
 * `timeline.steps` spreads a record's count evenly over the hours it spans,
 * so a single day-long record turns into identical hourly bars; this keeps
 * the records as they are.
 *
 * Records are grouped by source. Several apps usually count the same steps,
 * so the lane shows one source at a time; the default is the one with the
 * most records that day, i.e. the finest-grained.
 */

const MINUTES_PER_DAY = 24 * 60;

export interface StepRecordInput {
  id: string;
  source: string;
  startAt: string;
  endAt: string;
  count: number;
}

export interface StepRecordSpan {
  id: string;
  /** Minutes from the axis start; may fall outside 0-1440 for a record
   * that spans midnight (the lane clips it, the readout reports it whole). */
  startMinute: number;
  endMinute: number;
  /** The record's own count, for its whole span. */
  count: number;
}

export interface StepSource {
  source: string;
  records: StepRecordSpan[];
  /** Typical record length in minutes (median), to describe resolution. */
  typicalMinutes: number;
}

export interface StepDetail {
  /** Most records first; `sources[0]` is the default. */
  sources: StepSource[];
}

/** Records overlapping `[axisStartMs, axisStartMs + 24h)`, grouped by source.
 * Null when there are none. */
export function buildStepDetail(
  records: StepRecordInput[],
  axisStartMs: number,
): StepDetail | null {
  const axisEndMs = axisStartMs + MINUTES_PER_DAY * 60_000;
  const bySource = new Map<string, StepRecordSpan[]>();
  for (const record of records) {
    const start = Date.parse(record.startAt);
    const end = Date.parse(record.endAt);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
      continue;
    }
    if (end <= axisStartMs || start >= axisEndMs) continue;
    const list = bySource.get(record.source) ?? [];
    list.push({
      id: record.id,
      startMinute: (start - axisStartMs) / 60_000,
      endMinute: (end - axisStartMs) / 60_000,
      count: record.count,
    });
    bySource.set(record.source, list);
  }
  if (bySource.size === 0) return null;
  const sources = [...bySource.entries()].map(([source, spans]) => {
    spans.sort((a, b) => a.startMinute - b.startMinute);
    const lengths = spans
      .map((span) => span.endMinute - span.startMinute)
      .sort((a, b) => a - b);
    return {
      source,
      records: spans,
      typicalMinutes: lengths[Math.floor(lengths.length / 2)]!,
    };
  });
  sources.sort(
    (a, b) =>
      b.records.length - a.records.length || a.source.localeCompare(b.source),
  );
  return { sources };
}

/** Steps per minute over a record's span. A zero-length record (start ==
 * end) has no rate, so it counts as one second long. */
export function stepsPerMinute(span: StepRecordSpan): number {
  const minutes = Math.max(span.endMinute - span.startMinute, 1 / 60);
  return span.count / minutes;
}

/** Every record of `source` covering `minute` (several when an app wrote
 * overlapping records). */
export function stepRecordsAt(
  source: StepSource,
  minute: number,
): StepRecordSpan[] {
  return source.records.filter(
    (span) =>
      span.startMinute <= minute &&
      (minute < span.endMinute ||
        (span.endMinute === span.startMinute &&
          minute - span.startMinute < 1 / 60)),
  );
}
