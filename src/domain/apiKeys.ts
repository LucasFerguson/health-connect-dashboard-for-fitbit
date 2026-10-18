/**
 * Read-only API keys: made in Settings, used by scripts against
 * `/api/graphql` with `Authorization: Bearer hcg_...` (HCGateway's
 * `api/api_keys.py` has the full story). Shared by the middleware (edge),
 * the proxy route and Settings, so nothing here may import server-only
 * modules.
 */

/** `hcg_` plus Python's `secrets.token_urlsafe(32)`. */
const API_KEY = /^hcg_[A-Za-z0-9_-]{43}$/;

export const API_KEY_NAME_MAX = 48;

export interface ApiKeySummary {
  id: string;
  name: string;
  /** The first characters of the key, to tell keys apart. */
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
}

/**
 * The API key in an `Authorization: Bearer hcg_...` header, or null. Only an
 * exactly well-formed key counts, so the proxy never forwards arbitrary
 * header text upstream as a credential.
 */
export function apiKeyFromAuthorization(header: string | null): string | null {
  const key = /^Bearer\s+(\S+)$/i.exec(header?.trim() ?? "")?.[1];
  return key && API_KEY.test(key) ? key : null;
}

/** A copy-paste request that reads a week of step records. */
export function curlExample(
  endpoint: string,
  start: string,
  endExclusive: string,
): string {
  const query = `{ viewer { sourceRecords { steps(range: {start: "${start}", endExclusive: "${endExclusive}"}) { startAt endAt count source } } } }`;
  return [
    `curl -s ${endpoint} \\`,
    `  -H "Authorization: Bearer $HCG_KEY" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '${JSON.stringify({ query })}'`,
  ].join("\n");
}
