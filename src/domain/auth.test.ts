import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  clearedSessionCookieOptions,
  isHttpsRequest,
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
