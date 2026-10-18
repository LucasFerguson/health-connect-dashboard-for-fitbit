import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  clearedSessionCookieOptions,
  isHttpsRequest,
  isValidUsername,
  normalizeUsername,
  safeNextPath,
  sessionCookieOptions,
} from "./auth";

void describe("session cookie", () => {
  void it("is embeddable over HTTPS and plain Lax over HTTP", () => {
    assert.deepEqual(
      [sessionCookieOptions(true).sameSite, sessionCookieOptions(true).secure],
      ["none", true],
    );
    assert.equal(sessionCookieOptions(true).partitioned, true);
    assert.equal(sessionCookieOptions(false).sameSite, "lax");
    assert.equal(sessionCookieOptions(false).secure, false);
    assert.equal("partitioned" in sessionCookieOptions(false), false);
  });

  void it("clears with the same attributes it was set with", () => {
    const cleared = clearedSessionCookieOptions(true);
    assert.equal(cleared.maxAge, 0);
    assert.equal(cleared.partitioned, true);
    assert.equal(cleared.sameSite, "none");
  });

  void it("detects HTTPS directly or behind a TLS-terminating proxy", () => {
    assert.equal(isHttpsRequest(new Headers(), "https:"), true);
    assert.equal(
      isHttpsRequest(new Headers({ "x-forwarded-proto": "https" })),
      true,
    );
    assert.equal(
      isHttpsRequest(new Headers({ "x-forwarded-proto": "https,http" })),
      true,
    );
    assert.equal(
      isHttpsRequest(new Headers({ "x-forwarded-proto": "http" }), "http:"),
      false,
    );
    assert.equal(isHttpsRequest(new Headers()), false);
  });

  void it("only follows same-site next paths", () => {
    assert.equal(safeNextPath("/sleep?x=1"), "/sleep?x=1");
    assert.equal(safeNextPath("//evil.example"), "/");
    assert.equal(safeNextPath("https://evil.example"), "/");
    assert.equal(safeNextPath(undefined), "/");
  });
});

void describe("safeNextPath", () => {
  void it("keeps same-site paths with their query and hash", () => {
    assert.equal(safeNextPath("/sleep"), "/sleep");
    assert.equal(
      safeNextPath("/explore?metric=hrv#chart"),
      "/explore?metric=hrv#chart",
    );
    assert.equal(safeNextPath("/day/2026-10-17"), "/day/2026-10-17");
  });

  void it("refuses anything that leaves the site", () => {
    for (const next of [
      "//evil.example",
      "/\\evil.example",
      "/\\/evil.example",
      "/\t/evil.example",
      "/\n/evil.example",
      "https://evil.example",
      "javascript:alert(1)",
      "evil.example",
      "",
    ]) {
      assert.equal(safeNextPath(next), "/", JSON.stringify(next));
    }
  });

  void it("refuses non-strings", () => {
    assert.equal(safeNextPath(undefined), "/");
    assert.equal(safeNextPath(["/sleep"]), "/");
  });
});

void describe("usernames", () => {
  void it("lowercases and trims", () => {
    assert.equal(normalizeUsername("  Lucas "), "lucas");
  });

  void it("allows only the safe characters", () => {
    for (const ok of ["lucas", "a.b-c_d", "abc", "x".repeat(32)]) {
      assert.equal(isValidUsername(ok), true, ok);
    }
    for (const bad of [
      "ab",
      "x".repeat(33),
      "has space",
      '{"$ne":1}',
      "lucаs",
      ".dot",
      "Upper",
    ]) {
      assert.equal(isValidUsername(bad), false, bad);
    }
  });
});
