import { NextResponse } from "next/server";
import { getSyncStatus } from "~/server/health/getDayAnalytics";

export const dynamic = "force-dynamic";

/**
 * Exposes the phone-upload sync heartbeat to the client-side nav (used
 * app-wide, not just the day view) — mirrors `/api/health`'s pattern of a
 * thin GET wrapper around a server-only fetcher, degrading to a 502 rather
 * than throwing so the nav's polling loop can just skip a beat on failure.
 */
export async function GET() {
  try {
    return NextResponse.json(await getSyncStatus());
  } catch (error) {
    console.error(
      "Unable to refresh sync status",
      error instanceof Error ? error.message : String(error),
    );
    return NextResponse.json(
      { error: "Unable to refresh sync status" },
      { status: 502 },
    );
  }
}
