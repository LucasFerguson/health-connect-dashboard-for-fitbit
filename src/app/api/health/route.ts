import { NextResponse } from "next/server";
import { env } from "~/env";

export const dynamic = "force-dynamic";

/**
 * Container healthcheck. Needs no session, unlike every other route: healthy
 * means this server is up and can reach HCGateway's REST API.
 */
export async function GET() {
  if (!env.API_URL) {
    return NextResponse.json(
      { ok: false, error: "API_URL is not configured" },
      { status: 503 },
    );
  }
  try {
    const response = await fetch(`${env.API_URL}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(4_000),
    });
    return NextResponse.json(
      { ok: response.ok },
      { status: response.ok ? 200 : 503 },
    );
  } catch {
    return NextResponse.json(
      { ok: false, error: "HCGateway unreachable" },
      { status: 503 },
    );
  }
}
