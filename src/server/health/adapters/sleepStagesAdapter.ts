/**
 * Maps `SLEEP_STAGES_QUERY`'s result onto stage timelines keyed by recording
 * id, and builds the query's `$range` for one date.
 *
 * The only caller is `useSleepStages`, a client hook, so like
 * `overviewAdapter` **this module must stay free of server-only imports** (no
 * `graphqlClient`, no `~/env`): it ships to the browser.
 */
import type { DateKey, SleepStage, SleepStageKind } from "~/domain/health";
import type {
  SleepStageKind as GraphQLSleepStageKind,
  SleepStagesQuery,
  TimeRange,
} from "~/types/__generated__/graphql";

/**
 * The schema's enum is SCREAMING_CASE; the domain's is lowercase. A total
 * Record means a new stage kind in the schema becomes a compile error here
 * (after `npm run codegen`) rather than an unmapped value reaching the chart's
 * y-axis lookup.
 */
const stageKindByEnum: Record<GraphQLSleepStageKind, SleepStageKind> = {
  AWAKE: "awake",
  LIGHT: "light",
  DEEP: "deep",
  REM: "rem",
  ASLEEP: "asleep",
  UNKNOWN: "unknown",
};

/**
 * The API's range is a half-open instant interval, so one local date is
 * [date, date+1). Sleep events are already assigned to a local wake date
 * server-side, so this needs no timezone arithmetic here.
 */
export function sleepStagesRange(date: DateKey): TimeRange {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return {
    start: `${date}T00:00:00Z`,
    endExclusive: next.toISOString(),
  };
}

/**
 * Flattens events into one map, since the graph matches timelines to the
 * snapshot's sessions by recording id and never needs the event grouping.
 *
 * An empty map means the day genuinely has no stages; a failed request never
 * reaches this function (the hook reports it as unavailable instead).
 */
export function adaptSleepStages(
  data: SleepStagesQuery,
): Record<string, SleepStage[]> {
  const stagesByRecordingId: Record<string, SleepStage[]> = {};
  for (const event of data.viewer.analytics.sleepEvents) {
    for (const recording of event.recordings) {
      stagesByRecordingId[recording.id] = recording.stages.flatMap((stage) => {
        // Codegen's union only covers the kinds in the checked-in schema. A
        // kind the backend adds before the schema is refreshed arrives as a
        // value this Record doesn't know; drop that stage rather than handing
        // the chart an `undefined` kind.
        const kind: SleepStageKind | undefined = stageKindByEnum[stage.kind];
        return kind
          ? [{ startAt: stage.startAt, endAt: stage.endAt, kind }]
          : [];
      });
    }
  }
  return stagesByRecordingId;
}
