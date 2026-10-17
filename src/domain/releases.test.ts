import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  downloadFileName,
  formatFileSize,
  formatPublishedAgo,
  formatPublishedDate,
  parseReleaseJson,
} from "./releases";

const valid = {
  version: "2.3.0",
  versionCode: 3,
  fileName: "hcgateway-2.3.0.apk",
  sizeBytes: 44_356_812,
  sha256: "772ab279fbccd6796c3238c4fd352ec314de691068f1ae63a61093f901820a98",
  publishedAt: "2026-10-07T09:15:00Z",
};

void describe("parseReleaseJson", () => {
  void it("parses what publish-apk.sh writes", () => {
    assert.deepEqual(parseReleaseJson(JSON.stringify(valid)), valid);
  });

  void it("returns null for a missing or malformed file", () => {
    assert.equal(parseReleaseJson(null), null);
    assert.equal(parseReleaseJson(""), null);
    assert.equal(parseReleaseJson("{not json"), null);
    assert.equal(parseReleaseJson("[]"), null);
    assert.equal(parseReleaseJson("null"), null);
  });

  void it("rejects missing fields and bad values", () => {
    assert.equal(
      parseReleaseJson(JSON.stringify({ ...valid, sha256: undefined })),
      null,
    );
    for (const patch of [
      { sizeBytes: 0 },
      { sizeBytes: "44" },
      { publishedAt: "yesterday" },
      { sha256: "abc" },
      { version: "" },
    ]) {
      assert.equal(
        parseReleaseJson(JSON.stringify({ ...valid, ...patch })),
        null,
        JSON.stringify(patch),
      );
    }
  });

  void it("rejects versions that aren't safe in a filename or header", () => {
    for (const version of ['2.3.0"; x=1', "../../etc", "2.3.0\r\nX: y"]) {
      assert.equal(
        parseReleaseJson(JSON.stringify({ ...valid, version })),
        null,
        version,
      );
    }
  });

  void it("names the download after the version", () => {
    assert.equal(downloadFileName(valid), "hcgateway-2.3.0.apk");
  });
});

void describe("formatPublishedAgo", () => {
  const now = new Date("2026-10-17T12:00:00Z");
  const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  void it("formats each unit in long form", () => {
    assert.equal(formatPublishedAgo(ago(10 * 1000), now), "just now");
    assert.equal(formatPublishedAgo(ago(minute), now), "1 minute ago");
    assert.equal(formatPublishedAgo(ago(5 * minute), now), "5 minutes ago");
    assert.equal(formatPublishedAgo(ago(hour), now), "1 hour ago");
    assert.equal(formatPublishedAgo(ago(23 * hour), now), "23 hours ago");
    assert.equal(formatPublishedAgo(ago(day), now), "yesterday");
    assert.equal(formatPublishedAgo(ago(10 * day), now), "10 days ago");
    assert.equal(formatPublishedAgo(ago(45 * day), now), "1 month ago");
    assert.equal(formatPublishedAgo(ago(200 * day), now), "6 months ago");
    assert.equal(formatPublishedAgo(ago(800 * day), now), "2 years ago");
  });

  void it("treats future or invalid instants as just now", () => {
    assert.equal(formatPublishedAgo(ago(-hour), now), "just now");
    assert.equal(formatPublishedAgo("nope", now), "just now");
  });
});

void describe("formatting", () => {
  void it("formats file sizes", () => {
    assert.equal(formatFileSize(900), "900 B");
    assert.equal(formatFileSize(200_021), "195 KB");
    assert.equal(formatFileSize(5_500_000), "5.2 MB");
    assert.equal(formatFileSize(44_356_812), "42 MB");
  });

  void it("formats the absolute date in UTC", () => {
    assert.equal(
      formatPublishedDate("2026-10-07T09:15:00Z"),
      "7 Oct 2026, 09:15 UTC",
    );
  });
});
