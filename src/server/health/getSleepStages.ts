/**
 * Fetches sleep stage timelines for a single date.
 *
 * Kept separate from the overview's bulk query on purpose: stages are by far
 * the heaviest part of the sleep data (32,224 stages across all history, 5.5 MB
 * versus 321 KB without), and only the stage graph reads them, only for the
 * selected day. See `graphql/overviewQuery.ts`.
 */
import type { SleepStage, SleepStageKind } from "~/domain/health";
import { isGraphQLConfigured, query } from "./graphqlClient";
import { overviewSleepStagesQuery } from "./graphql/overviewQuery";
import type { SleepStageKind as GraphQLSleepStageKind } from "~/types/__generated__/graphql";
import { gql } from "@apollo/client";

/**
 * Shape of the inlined stages query's result. Hand-written because the query
 * text is built at runtime (see `overviewSleepStagesQuery`), so codegen can't
 * type it; `kind` is kept as the generated enum so the mapping below stays
 * exhaustive.
 */
interface StagesResult {
  viewer: {
    analytics: {
      runId: string;
      sleepEvents: {
        id: string;
        date: string;
        primary: { id: string; stages: GraphQLStage[] };
        recordings: { id: string; stages: GraphQLStage[] }[];
      }[];
    };
  };
}

interface GraphQLStage {
  startAt: string;
  endAt: string;
  kind: GraphQLSleepStageKind;
}

/** Stage timelines for one sleep event, keyed by the recording they belong to. */
export interface SleepStagesForEvent {
  eventId: string;
  /** Stage timeline per recording id, so the graph can match its sessions. */
  recordings: { id: string; stages: SleepStage[] }[];
}

/**
 * The schema's enum is SCREAMING_CASE; the domain's is lowercase. A total
 * Record means a new stage kind in the schema becomes a compile error here
 * rather than an unmapped value reaching the chart's y-axis lookup.
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
 * Returns `null` — rather than throwing or returning `[]` — when GraphQL can't
 * serve the request, so the caller can distinguish "unavailable" from "this day
 * genuinely has no stages". Returning `[]` for a transport failure would render
 * as an empty chart, which reads as real absence.
 */
export async function getSleepStagesForDate(
  date: string,
): Promise<SleepStagesForEvent[] | null> {
  if (!isGraphQLConfigured()) return null;

  try {
    // The API's range is a half-open instant interval, so one local date is
    // [date, date+1). Sleep events are already assigned to a local wake date
    // server-side, so this needs no timezone arithmetic here.
    //
    // The range is inlined rather than passed as a GraphQL variable because the
    // server ignores the request's `variables` field — see
    // `overviewSleepStagesQuery`. That also means the result isn't typed by
    // codegen, so the shape is asserted once here and validated below.
    const { data } = await query<StagesResult>({
      query: gql(
        overviewSleepStagesQuery(
          `${date}T00:00:00Z`,
          `${nextDay(date)}T00:00:00Z`,
        ),
      ),
    });
    if (!data) return null;

    return data.viewer.analytics.sleepEvents.map((event) => ({
      eventId: event.id,
      recordings: event.recordings.map((recording) => ({
        id: recording.id,
        stages: recording.stages.map((stage) => ({
          startAt: stage.startAt,
          endAt: stage.endAt,
          kind: stageKindByEnum[stage.kind],
        })),
      })),
    }));
  } catch (error) {
    console.error(
      "GraphQL sleep-stages query failed",
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
}

function nextDay(date: string): string {
  const next = new Date(`${date}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return next.toISOString().slice(0, 10);
}
