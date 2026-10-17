/**
 * Server-only access to the Android releases directory (APK_RELEASES_DIR),
 * HCGateway's `releases/` mounted read-only into this container. File names
 * are fixed constants, never taken from a request, so there is no path to
 * traverse.
 */
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { env } from "~/env";
import {
  LATEST_APK_FILE,
  LATEST_JSON_FILE,
  parseReleaseJson,
  type AndroidRelease,
} from "~/domain/releases";

export interface PublishedRelease {
  release: AndroidRelease;
  /** Absolute path of `hcgateway-latest.apk`. */
  apkPath: string;
  /** Actual size on disk, which wins over latest.json's sizeBytes. */
  apkSize: number;
}

/** The latest published release, or null when the directory isn't
 * configured or mounted, latest.json is missing or malformed, or the APK it
 * describes isn't there. */
export async function getLatestRelease(): Promise<PublishedRelease | null> {
  const dir = env.APK_RELEASES_DIR;
  if (!dir) return null;
  try {
    const release = parseReleaseJson(
      await readFile(path.join(dir, LATEST_JSON_FILE), "utf8"),
    );
    if (!release) return null;
    const apkPath = path.join(dir, LATEST_APK_FILE);
    const info = await stat(apkPath);
    if (!info.isFile() || info.size === 0) return null;
    return { release, apkPath, apkSize: info.size };
  } catch {
    return null;
  }
}
