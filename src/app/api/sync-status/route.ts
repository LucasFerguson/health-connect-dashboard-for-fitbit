import { NextResponse } from "next/server";
import { BackendRequestError } from "~/server/health/backendDiagnostics";
import { getSyncStatus } from "~/server/health/getSyncStatus";

export const dynamic = "force-dynamic";

/**
 * Exposes the phone-upload sync heartbeat to the client-side nav (used
 * app-wide, not just the day view) — a thin GET wrapper around a server-only
 * fetcher, degrading to a 502 rather than throwing so the nav's polling loop
 * can just skip a beat on failure. The 502 body carries the full diagnosis
 * (no secrets) so a failing heartbeat is debuggable from the network tab.
 */
export async function GET() {
  try {
    return NextResponse.json(await getSyncStatus());
  } catch (error) {
    if (error instanceof BackendRequestError) {
      // Already logged by the loader.
      return NextResponse.json(
        { error: error.diagnostics.title, diagnostics: error.diagnostics },
        { status: 502 },
      );
    }
    throw error;
  }
}
