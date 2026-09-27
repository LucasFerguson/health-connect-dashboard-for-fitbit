/**
 * REST client for HCGateway's Flask API (port 6644). Only the day view uses it
 * now — every other page reads GraphQL. It goes away when `/day` moves to the
 * GraphQL `day(date:)` field, which is blocked on the backend ignoring
 * variables (GRAPHQL_BACKEND_REQUESTS.md item 1).
 */
import { z } from "zod";
import {
  healthDayResponseSchema,
  syncStatusResponseSchema,
  type HealthDayResponse,
  type SyncStatusResponse,
} from "./dayAnalyticsSchema";
import {
  HttpStatusError,
  LoginError,
  readBodySnippet,
} from "./backendDiagnostics";

interface HealthConnectClientOptions {
  baseUrl: string;
  username: string;
  password: string;
}

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 400;

/**
 * Tokens are cached per base URL/username rather than per client instance:
 * callers (`getDayAnalytics`) construct a fresh
 * `HealthConnectClient` on every request, so an instance-level cache would
 * force a new login handshake on every page load. Sharing it here means the
 * token is reused across requests until the server rejects it.
 */
const tokenCache = new Map<string, string>();

/** Thrown when a response body doesn't match its expected Zod schema. Never
 * retried — a validation failure means the contract drifted or the response
 * is malformed, not that the request should be retried. */
export class ResponseValidationError extends Error {
  constructor(
    endpoint: string,
    public readonly cause: unknown,
  ) {
    super(
      `Health Connect ${endpoint} response failed schema validation: ${
        cause instanceof Error ? cause.message : String(cause)
      }`,
    );
    this.name = "ResponseValidationError";
  }
}

export class HealthConnectClient {
  constructor(private readonly options: HealthConnectClientOptions) {}

  /**
   * `GET /api/v2/analytics/day?date=&radius=` — the day dashboard contract
   * (`health-day-v1`). Validated end-to-end with Zod; throws
   * `ResponseValidationError` rather than passing unvalidated data through.
   */
  async getDayAnalytics(
    date: string,
    radius: number,
  ): Promise<HealthDayResponse> {
    const payload = await this.getJson(
      `/api/v2/analytics/day?${new URLSearchParams({ date, radius: String(radius) }).toString()}`,
    );
    const result = healthDayResponseSchema.safeParse(payload);
    if (!result.success) {
      throw new ResponseValidationError("analytics/day", result.error);
    }
    return result.data;
  }

  /** `GET /api/v2/sync/status` — phone upload activity heartbeat. */
  async getSyncStatus(): Promise<SyncStatusResponse> {
    const payload = await this.getJson("/api/v2/sync/status");
    const result = syncStatusResponseSchema.safeParse(payload);
    if (!result.success) {
      throw new ResponseValidationError("sync/status", result.error);
    }
    return result.data;
  }

  /** Shared GET-with-bearer-token plumbing for the analytics endpoints:
   * token caching, 401-triggered refresh, and retry-on-transient-failure,
   * mirroring `fetchRecords` above. */
  private async getJson(path: string): Promise<unknown> {
    return withRetry(async (attempt) => {
      const token = await this.getToken(attempt > 0);
      const response = await fetch(`${this.options.baseUrl}${path}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      });
      await this.handleUnauthorized(response);
      if (!response.ok) {
        // `HttpStatusError` carries the status so `withRetry` can tell a
        // transient 5xx apart from a definitive 4xx, plus the URL and a body
        // snippet for the error screen.
        throw new HttpStatusError(
          response.status,
          `Health Connect ${path} returned ${response.status}`,
          `${this.options.baseUrl}${path}`,
          response.headers.get("content-type"),
          await readBodySnippet(response),
        );
      }
      return (await response.json()) as unknown;
    });
  }

  /** Invalidate the cached token on a 401 so the next retry attempt logs in
   * again. Never triggered preemptively — only in reaction to the server
   * actually rejecting the current token. */
  private async handleUnauthorized(response: Response): Promise<void> {
    if (response.status === 401) {
      tokenCache.delete(this.tokenCacheKey);
    }
  }

  private get tokenCacheKey(): string {
    return `${this.options.baseUrl}::${this.options.username}`;
  }

  private async getToken(forceRefresh: boolean): Promise<string> {
    const cacheKey = this.tokenCacheKey;
    const cached = tokenCache.get(cacheKey);
    if (cached && !forceRefresh) return cached;

    const loginUrl = `${this.options.baseUrl}/api/v2/login`;
    let response: Response;
    try {
      response = await fetch(loginUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: this.options.username,
          password: this.options.password,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      });
    } catch (cause) {
      throw new LoginError(loginUrl, null, "", { cause });
    }
    if (!response.ok) {
      throw new LoginError(
        loginUrl,
        response.status,
        await readBodySnippet(response),
      );
    }
    const token = z
      .object({ token: z.string() })
      .parse(await response.json()).token;
    tokenCache.set(cacheKey, token);
    return token;
  }
}

/**
 * Retries transient failures (network errors, timeouts, and 5xx responses)
 * with exponential backoff. Does NOT retry:
 * - 4xx `HttpStatusError`s other than 401 — these mean the request itself is
 *   invalid (bad date, bad radius, etc.), so retrying just wastes time.
 * - 401 IS retried once (via the normal attempt loop): `handleUnauthorized`
 *   evicts the cached token so the next attempt's `getToken(attempt > 0)`
 *   logs in again, then the retried request carries a fresh token.
 * - `ResponseValidationError` — a schema mismatch is not transient.
 */
async function withRetry<T>(run: (attempt: number) => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      return await run(attempt);
    } catch (error) {
      lastError = error;
      if (!isRetryable(error) || attempt >= MAX_ATTEMPTS - 1) {
        throw error;
      }
      await sleep(RETRY_DELAY_MS * 2 ** attempt);
    }
  }
  throw lastError;
}

function isRetryable(error: unknown): boolean {
  if (error instanceof ResponseValidationError) return false;
  // Wrong credentials don't become right on retry; only a login that never
  // got an answer, or a 5xx from it, is worth another attempt.
  if (error instanceof LoginError) {
    return error.status === null || error.status >= 500;
  }
  if (error instanceof HttpStatusError) {
    // 401 is retried (token refresh); other 4xx are permanent client errors.
    return error.status === 401 || error.status >= 500;
  }
  // Network failures, DNS errors, and AbortSignal timeouts all surface as
  // plain (non-HttpStatusError) exceptions from `fetch` — treat those as
  // transient.
  return true;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
