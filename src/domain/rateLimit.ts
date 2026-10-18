/**
 * Per-visitor attempt limits for the sign-in and signup forms. Pure, so the
 * server keeps the instances (`~/server/auth/throttle`) and tests can drive
 * the clock.
 *
 * Counts live in this process's memory: enough for one dashboard container,
 * and they reset on restart. HCGateway keeps its own per-username lockout
 * behind this, so a restart doesn't reopen password guessing.
 */

interface Window {
  count: number;
  resetAt: number;
}

/** Past this many tracked visitors, expired entries are swept on the next
 * new one, so a flood of addresses can't grow the map forever. */
const SWEEP_THRESHOLD = 10_000;

/** Allows `max` attempts per key in each fixed window of `windowMs`. */
export class AttemptLimiter {
  private readonly windows = new Map<string, Window>();
  private readonly max: number;
  private readonly windowMs: number;

  constructor(max: number, windowMs: number) {
    this.max = max;
    this.windowMs = windowMs;
  }

  /** Whether `key` has used up its attempts for the current window. */
  isLimited(key: string, now = Date.now()): boolean {
    const window = this.windows.get(key);
    return (
      window !== undefined && window.resetAt > now && window.count >= this.max
    );
  }

  record(key: string, now = Date.now()): void {
    const window = this.windows.get(key);
    if (window && window.resetAt > now) {
      window.count += 1;
      return;
    }
    if (this.windows.size >= SWEEP_THRESHOLD) this.sweep(now);
    this.windows.set(key, { count: 1, resetAt: now + this.windowMs });
  }

  private sweep(now: number): void {
    for (const [key, window] of this.windows) {
      if (window.resetAt <= now) this.windows.delete(key);
    }
  }
}

/**
 * The visitor's address. Through the Cloudflare tunnel that's
 * `CF-Connecting-IP`, which Cloudflare sets itself and visitors can't
 * override. On the LAN it falls back to the proxy header, then to one shared
 * bucket.
 */
export function clientAddress(headers: Headers): string {
  const candidates = [
    headers.get("cf-connecting-ip"),
    headers.get("x-forwarded-for")?.split(",")[0],
  ];
  // An empty header falls through to the next one, so not `??`.
  for (const candidate of candidates) {
    const address = candidate?.trim();
    if (address) return address;
  }
  return "unknown";
}
