import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { downloadFileName } from "~/domain/releases";
import { getLatestRelease } from "~/server/releases";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * The latest HCGateway Android APK, published by HCGateway's
 * `scripts/publish-apk.sh`. Public, like /login: people install the app
 * before or alongside creating an account. Takes no parameters; the file
 * served is always `hcgateway-latest.apk` in APK_RELEASES_DIR.
 */
export async function GET() {
  const published = await getLatestRelease();
  if (!published) {
    return NextResponse.json(
      { error: "No Android build published yet" },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }
  const { release, apkPath, apkSize } = published;
  const stream = Readable.toWeb(
    createReadStream(apkPath),
  ) as ReadableStream<Uint8Array>;
  return new Response(stream, {
    headers: {
      "Content-Type": "application/vnd.android.package-archive",
      "Content-Disposition": `attachment; filename="${downloadFileName(release)}"`,
      "Content-Length": String(apkSize),
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
