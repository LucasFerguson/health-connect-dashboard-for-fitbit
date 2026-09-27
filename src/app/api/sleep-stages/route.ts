/**
 * Stage timelines for one date, fetched on demand by the overview's sleep
 * stage graph.
 *
 * The overview's bulk query omits `stages` because selecting them across all
 * 590 sleep events costs 5.5 MB versus 321 KB without (see
 * `graphql/overviewQuery.ts`). Only this graph renders them, and only for the
 * selected day, so it asks for them here instead.
 */
import { NextResponse } from "next/server";
import { isDateKey } from "~/domain/health";
import { getSleepStagesForDate } from "~/server/health/getSleepStages";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const date = new URL(request.url).searchParams.get("date");
  if (!isDateKey(date)) {
    return NextResponse.json(
      { error: "A `date` query parameter of the form YYYY-MM-DD is required" },
      { status: 400 },
    );
  }

  try {
    const events = await getSleepStagesForDate(date);
    if (events === null) {
      // GraphQL isn't configured or is unreachable. The graph keeps whatever it
      // already has rather than clearing the chart, so say so explicitly
      // instead of returning an empty list that looks like "no sleep stages".
      return NextResponse.json(
        { error: "Sleep stage detail is unavailable" },
        { status: 503 },
      );
    }
    return NextResponse.json({ events });
  } catch (error) {
    console.error(
      "Unable to load sleep stages",
      error instanceof Error ? error.message : String(error),
    );
    return NextResponse.json(
      { error: "Unable to load sleep stages" },
      { status: 502 },
    );
  }
}
