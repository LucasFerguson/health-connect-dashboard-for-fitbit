import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AttemptLimiter, clientAddress } from "./rateLimit";

void describe("AttemptLimiter", () => {
  void it("limits a key once it reaches the maximum", () => {
    const limiter = new AttemptLimiter(3, 1_000);
    for (let i = 0; i < 2; i++) limiter.record("a", 0);
    assert.equal(limiter.isLimited("a", 0), false);
    limiter.record("a", 0);
    assert.equal(limiter.isLimited("a", 0), true);
  });

  void it("keeps keys apart", () => {
    const limiter = new AttemptLimiter(1, 1_000);
    limiter.record("a", 0);
    assert.equal(limiter.isLimited("a", 0), true);
    assert.equal(limiter.isLimited("b", 0), false);
  });

  void it("starts over when the window ends", () => {
    const limiter = new AttemptLimiter(1, 1_000);
    limiter.record("a", 0);
    assert.equal(limiter.isLimited("a", 999), true);
    assert.equal(limiter.isLimited("a", 1_000), false);
    limiter.record("a", 1_000);
    assert.equal(limiter.isLimited("a", 1_000), true);
  });
});

void describe("clientAddress", () => {
  void it("prefers Cloudflare's header", () => {
    const headers = new Headers({
      "cf-connecting-ip": "203.0.113.7",
      "x-forwarded-for": "198.51.100.1, 10.0.0.1",
    });
    assert.equal(clientAddress(headers), "203.0.113.7");
  });

  void it("falls back to the first forwarded address", () => {
    const headers = new Headers({
      "x-forwarded-for": "198.51.100.1, 10.0.0.1",
    });
    assert.equal(clientAddress(headers), "198.51.100.1");
  });

  void it("shares one bucket when nothing says who it is", () => {
    assert.equal(clientAddress(new Headers()), "unknown");
  });
});
