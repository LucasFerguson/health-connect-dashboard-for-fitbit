/**
 * Android app releases published by HCGateway's `scripts/publish-apk.sh`,
 * which writes `latest.json` next to `hcgateway-latest.apk`. Pure parsing and
 * formatting only, so it can be unit-tested and shared by the download route
 * and the "Get the Android app" card; reading the file lives in
 * `~/server/releases`.
 */
import { z } from "zod";

/** Fixed file names inside APK_RELEASES_DIR. Never derived from a request. */
export const LATEST_APK_FILE = "hcgateway-latest.apk";
export const LATEST_JSON_FILE = "latest.json";

/** Versions as written to filenames and headers: digits, letters, `.+-`. */
const VERSION_PATTERN = /^[0-9A-Za-z][0-9A-Za-z.+-]{0,39}$/;

const releaseSchema = z.object({
  version: z.string().regex(VERSION_PATTERN),
  versionCode: z.number().int().nonnegative(),
  fileName: z.string(),
  sizeBytes: z.number().int().positive(),
  sha256: z.string().regex(/^[0-9a-f]{64}$/i),
  publishedAt: z
    .string()
    .refine((value) => Number.isFinite(Date.parse(value)), "invalid date"),
});

export type AndroidRelease = z.infer<typeof releaseSchema>;

/** Parses the text of `latest.json`, returning null when it is missing,
 * malformed, or doesn't describe a release. */
export function parseReleaseJson(
  text: string | null | undefined,
): AndroidRelease | null {
  if (!text) return null;
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  const parsed = releaseSchema.safeParse(data);
  return parsed.success ? parsed.data : null;
}

/** The filename a browser saves the download as, e.g. `hcgateway-2.3.0.apk`.
 * `version` is already restricted to header-safe characters by the schema. */
export function downloadFileName(release: AndroidRelease): string {
  return `hcgateway-${release.version}.apk`;
}

/** "42.3 MB", "812 KB", "900 B". */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
}

const plural = (n: number, unit: string) =>
  `${n} ${unit}${n === 1 ? "" : "s"} ago`;

/** Long-form age of an ISO instant against `now`: "just now",
 * "5 minutes ago", "3 hours ago", "yesterday", "10 days ago",
 * "2 months ago", "1 year ago". Future instants (clock skew) read as
 * "just now". */
export function formatPublishedAgo(iso: string, now: Date): string {
  const deltaMs = now.getTime() - Date.parse(iso);
  if (!Number.isFinite(deltaMs) || deltaMs < 60_000) return "just now";
  const minutes = Math.floor(deltaMs / 60_000);
  if (minutes < 60) return plural(minutes, "minute");
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return plural(hours, "hour");
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return plural(days, "day");
  if (days < 365) return plural(Math.floor(days / 30), "month");
  return plural(Math.floor(days / 365), "year");
}

/** Absolute timestamp for the tooltip, e.g. "17 Oct 2026, 19:36 UTC". */
export function formatPublishedDate(iso: string): string {
  return `${new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(new Date(iso))} UTC`;
}
