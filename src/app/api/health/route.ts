import { NextResponse } from "next/server";
import { getHealthSnapshot } from "~/server/health/getHealthSnapshot";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json(await getHealthSnapshot());
  } catch (error) {
    console.error(
      "Unable to refresh health data",
      error instanceof Error ? error.message : String(error),
    );
    return NextResponse.json(
      { error: "Unable to refresh health data" },
      { status: 502 },
    );
  }
}
