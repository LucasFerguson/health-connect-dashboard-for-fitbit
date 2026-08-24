import { z } from "zod";

interface HealthConnectClientOptions {
  baseUrl: string;
  username: string;
  password: string;
}

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 400;

/**
 * Tokens are cached per base URL/username rather than per client instance:
 * callers (e.g. `createHealthRepository`) construct a fresh
 * `HealthConnectClient` on every request, so an instance-level cache would
 * force a new login handshake on every page load. Sharing it here means the
 * token is reused across requests until the server rejects it.
 */
const tokenCache = new Map<string, string>();

export class HealthConnectClient {
  constructor(private readonly options: HealthConnectClientOptions) {}

  async fetchRecords<T>(
    method: string,
    parse: (payload: unknown) => T,
  ): Promise<T> {
    return withRetry(async (attempt) => {
      const token = await this.getToken(attempt > 0);
      const response = await fetch(
        `${this.options.baseUrl}/api/v2/fetch/${method}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ queries: {} }),
          cache: "no-store",
          signal: AbortSignal.timeout(15_000),
        },
      );
      if (response.status === 401) {
        tokenCache.delete(this.tokenCacheKey);
      }
      if (!response.ok) {
        throw new Error(`Health Connect ${method} returned ${response.status}`);
      }
      const payload: unknown = await response.json();
      return parse(payload);
    });
  }

  private get tokenCacheKey(): string {
    return `${this.options.baseUrl}::${this.options.username}`;
  }

  private async getToken(forceRefresh: boolean): Promise<string> {
    const cacheKey = this.tokenCacheKey;
    const cached = tokenCache.get(cacheKey);
    if (cached && !forceRefresh) return cached;

    const response = await fetch(`${this.options.baseUrl}/api/v2/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: this.options.username,
        password: this.options.password,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      throw new Error(`Health Connect login returned ${response.status}`);
    }
    const token = z
      .object({ token: z.string() })
      .parse(await response.json()).token;
    tokenCache.set(cacheKey, token);
    return token;
  }
}

async function withRetry<T>(run: (attempt: number) => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      return await run(attempt);
    } catch (error) {
      lastError = error;
      if (attempt < MAX_ATTEMPTS - 1) {
        await sleep(RETRY_DELAY_MS * 2 ** attempt);
      }
    }
  }
  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
