/**
 * Turns any failure talking to HCGateway into a structured, human-readable
 * report that the page renders in place of its content (`BackendErrorPanel`).
 *
 * Why pages render this themselves instead of throwing to `error.tsx`: in
 * production, Next.js replaces the message of any error thrown from a Server
 * Component with a generic string plus an opaque digest before it reaches the
 * error boundary. That's the right default for public sites, but for a
 * self-hosted single-user dashboard it hides exactly what you need — which
 * endpoint, which operation, whether login worked. So data loaders throw
 * `BackendRequestError`, pages catch it with `settle()`, and the diagnosis
 * travels as plain serializable data.
 *
 * Never put a secret in here. The report names the username and whether a
 * password is set, never the password or the bearer token; upstream bodies
 * are truncated snippets of what the server sent back, which never contains
 * our own request headers.
 */
import {
  getOperationAST,
  Kind,
  type DocumentNode,
  type SelectionSetNode,
} from "graphql";
import {
  CombinedGraphQLErrors,
  ServerError,
  ServerParseError,
} from "@apollo/client/errors";
import { ZodError } from "zod";

export type FailureKind =
  | "not-configured"
  | "login-rejected"
  | "login-failed"
  | "unreachable"
  | "timeout"
  | "http-error"
  | "token-rejected"
  | "graphql-errors"
  | "unparseable-response"
  | "empty-response"
  | "contract-mismatch"
  | "frontend-mapping"
  | "unknown";

export interface RequestContext {
  transport: "graphql" | "rest";
  /** Short loader name, e.g. "sleep-debt". */
  label: string;
  /** GraphQL operation name, or REST method + path. */
  operation: string;
  /** Top-level fields the operation selects, e.g. `viewer.analytics.sleepDebt`. */
  selections: string[];
  /** Absolute URL the data request goes to, or null if it couldn't be derived. */
  endpoint: string | null;
  loginUrl: string | null;
  config: ConfigSnapshot;
  startedAt: number;
}

export interface ConfigSnapshot {
  apiUrl: string | null;
  username: string | null;
  passwordSet: boolean;
  /** Set when GRAPHQL_URL overrides the derived `:6645/graphql` endpoint. */
  graphqlUrlOverride: string | null;
}

export interface CauseLink {
  name: string;
  message: string;
  code?: string;
}

export interface BackendDiagnostics {
  kind: FailureKind;
  /** One line: what went wrong. */
  title: string;
  /** Which layer failed and what that implies. */
  explanation: string;
  /** Concrete things to check, most likely first. */
  checks: string[];
  /** Did we get as far as authenticating? */
  auth: "not-attempted" | "rejected" | "failed" | "succeeded" | "unknown";
  request: Omit<RequestContext, "startedAt" | "config">;
  config: ConfigSnapshot;
  http?: { status: number; contentType: string | null; bodySnippet: string };
  graphqlErrors?: { message: string; path?: string; code?: string }[];
  validationIssues?: { path: string; message: string }[];
  causes: CauseLink[];
  elapsedMs: number;
  occurredAt: string;
}

/** Carries a diagnosis from a data loader up to the page that renders it. */
export class BackendRequestError extends Error {
  constructor(public readonly diagnostics: BackendDiagnostics) {
    super(`${diagnostics.request.label}: ${diagnostics.title}`);
    this.name = "BackendRequestError";
  }
}

/**
 * Thrown by both login implementations (GraphQL's `graphqlAuth.ts` and the
 * REST `HealthConnectClient`), so a credential problem is never mistaken for
 * the data endpoint being down.
 */
export class LoginError extends Error {
  constructor(
    public readonly url: string,
    public readonly status: number | null,
    public readonly bodySnippet: string,
    options?: { cause?: unknown },
  ) {
    super(
      status === null
        ? `HCGateway login at ${url} failed before a response arrived`
        : `HCGateway login at ${url} returned ${status}`,
      options,
    );
    this.name = "LoginError";
  }
}

/** Thrown when a request is attempted without credentials configured. */
export class NotConfiguredError extends Error {
  constructor(public readonly missing: string[]) {
    super(`Missing configuration: ${missing.join(", ")}`);
    this.name = "NotConfiguredError";
  }
}

/** Thrown when a query resolves without `data` (errors-only, or empty). */
export class EmptyResponseError extends Error {
  constructor() {
    super("The response carried no data");
    this.name = "EmptyResponseError";
  }
}

/** Wraps an exception thrown by our own adapter/select code. */
export class FrontendMappingError extends Error {
  constructor(cause: unknown) {
    super(
      `Mapping the response failed: ${cause instanceof Error ? cause.message : String(cause)}`,
      { cause },
    );
    this.name = "FrontendMappingError";
  }
}

/** Thrown by the REST client for a non-2xx data response. */
export class HttpStatusError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly url: string | null = null,
    public readonly contentType: string | null = null,
    public readonly bodySnippet = "",
  ) {
    super(message);
    this.name = "HttpStatusError";
  }
}

const BODY_SNIPPET_LIMIT = 600;

/** Reads at most a snippet of a response body, never throwing. */
export async function readBodySnippet(response: Response): Promise<string> {
  try {
    return snippet(await response.text());
  } catch {
    return "";
  }
}

export function snippet(text: string): string {
  const compact = text.replace(/\s+/g, " ").trim();
  return compact.length > BODY_SNIPPET_LIMIT
    ? `${compact.slice(0, BODY_SNIPPET_LIMIT)}… (${compact.length} chars total)`
    : compact;
}

export function configSnapshot(env: {
  API_URL?: string;
  API_USERNAME?: string;
  API_PASSWORD?: string;
}): ConfigSnapshot {
  return {
    apiUrl: env.API_URL ?? null,
    username: env.API_USERNAME ?? null,
    passwordSet: Boolean(env.API_PASSWORD),
    graphqlUrlOverride: process.env.GRAPHQL_URL ?? null,
  };
}

export function missingConfig(config: ConfigSnapshot): string[] {
  return [
    config.apiUrl ? null : "API_URL",
    config.username ? null : "API_USERNAME",
    config.passwordSet ? null : "API_PASSWORD",
  ].filter((key): key is string => key !== null);
}

/** Operation name and `viewer.analytics.*`-style paths a document selects. */
export function describeDocument(document: DocumentNode): {
  operation: string;
  selections: string[];
} {
  const operation = getOperationAST(document);
  return {
    operation: operation?.name?.value ?? "(anonymous operation)",
    selections: operation ? leafPaths(operation.selectionSet, [], 3) : [],
  };
}

/** Walks `depth` levels of fields, so `viewer { analytics { sleepDebt {…} } }`
 * reports `viewer.analytics.sleepDebt` rather than every leaf. */
function leafPaths(
  set: SelectionSetNode,
  prefix: string[],
  depth: number,
): string[] {
  return set.selections.flatMap((selection) => {
    if (selection.kind !== Kind.FIELD) return [];
    const path = [...prefix, selection.name.value];
    if (depth <= 1 || !selection.selectionSet) return [path.join(".")];
    const children = leafPaths(selection.selectionSet, path, depth - 1);
    return children.length > 0 ? children : [path.join(".")];
  });
}

function causeChain(error: unknown): CauseLink[] {
  const links: CauseLink[] = [];
  let current: unknown = error;
  while (current && links.length < 5) {
    if (current instanceof Error) {
      const code = (current as { code?: unknown }).code;
      links.push({
        name: current.name,
        message: current.message,
        ...(typeof code === "string" ? { code } : {}),
      });
      current = current.cause;
    } else {
      links.push({
        name: typeof current,
        message:
          typeof current === "string" ? current : JSON.stringify(current),
      });
      break;
    }
  }
  return links;
}

const UNREACHABLE_CODES = new Set([
  "ECONNREFUSED",
  "ECONNRESET",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "ENOTFOUND",
  "EAI_AGAIN",
  "UND_ERR_SOCKET",
  "UND_ERR_CONNECT_TIMEOUT",
]);

function networkCode(causes: CauseLink[]): string | null {
  return (
    causes.find((cause) => cause.code && UNREACHABLE_CODES.has(cause.code))
      ?.code ?? null
  );
}

function isTimeout(causes: CauseLink[]): boolean {
  return causes.some(
    (cause) =>
      cause.name === "TimeoutError" ||
      cause.name === "AbortError" ||
      cause.code === "UND_ERR_CONNECT_TIMEOUT",
  );
}

function hostOf(url: string | null): string {
  if (!url) return "(unknown host)";
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

/** Classifies `error` thrown while serving `context` into a full report. */
export function diagnose(
  error: unknown,
  context: RequestContext,
): BackendDiagnostics {
  const causes = causeChain(error);
  const { startedAt, config, ...request } = context;
  const base = {
    request,
    config,
    causes,
    elapsedMs: Date.now() - startedAt,
    occurredAt: new Date().toISOString(),
  };
  const endpointHost = hostOf(context.endpoint);
  const graphqlServiceHint =
    context.transport === "graphql"
      ? "Is the `hcgateway_graphql_api` container running and healthy? (`docker ps`)"
      : "Is the `hcgateway_api` container running and healthy? (`docker ps`)";

  if (error instanceof NotConfiguredError) {
    return {
      ...base,
      kind: "not-configured",
      auth: "not-attempted",
      title: `Not configured: ${error.missing.join(", ")} missing`,
      explanation:
        "The dashboard has no demo mode — it needs HCGateway credentials to show anything. No request was sent.",
      checks: [
        `Set ${error.missing.join(", ")} in .env (Docker) or .env.local (npm run dev).`,
        "Redeploy so the container picks them up: scripts/deploy.sh up prod",
      ],
    };
  }

  if (error instanceof LoginError) {
    const code = networkCode(causes);
    if (error.status === 401 || error.status === 403) {
      return {
        ...base,
        kind: "login-rejected",
        auth: "rejected",
        title: `Login rejected (${error.status}) for user "${config.username ?? "?"}"`,
        explanation: `HCGateway's login endpoint answered but refused the credentials, so no data request was attempted. The ${context.transport === "graphql" ? "GraphQL" : "REST"} endpoint itself was never reached.`,
        checks: [
          "Check API_USERNAME and API_PASSWORD in .env — the password is the HCGateway account password.",
          "Confirm the account works: POST {API_URL}/api/v2/login with the same JSON body.",
        ],
        http: {
          status: error.status,
          contentType: null,
          bodySnippet: error.bodySnippet,
        },
      };
    }
    if (error.status !== null) {
      return {
        ...base,
        kind: "login-failed",
        auth: "failed",
        title: `Login endpoint returned ${error.status}`,
        explanation:
          error.status === 404
            ? "Nothing answers /api/v2/login at API_URL — it probably doesn't point at HCGateway's REST API."
            : "The login endpoint errored before it could check the credentials.",
        checks: [
          `API_URL is ${config.apiUrl ?? "unset"}; it should be the REST API origin (usually port 6644), not the GraphQL one.`,
          "Check the `hcgateway_api` container logs for the failing login.",
        ],
        http: {
          status: error.status,
          contentType: null,
          bodySnippet: error.bodySnippet,
        },
      };
    }
    return {
      ...base,
      kind: isTimeout(causes) ? "timeout" : "unreachable",
      auth: "failed",
      title: `Couldn't reach the login endpoint at ${hostOf(error.url)}${code ? ` (${code})` : ""}`,
      explanation:
        "Authentication happens against the REST API before any data request, and that connection failed — so this is a network/host problem, not a credentials problem.",
      checks: [
        `Is anything listening at ${hostOf(error.url)}? Is the \`hcgateway_api\` container up?`,
        "If the dashboard runs in Docker, API_URL must be reachable from inside the container (a LAN IP, not localhost).",
      ],
    };
  }

  if (error instanceof EmptyResponseError) {
    return {
      ...base,
      kind: "empty-response",
      auth: "succeeded",
      title: "The query returned no data",
      explanation:
        "Login worked and the endpoint answered, but the response had neither data nor errors Apollo could surface.",
      checks: [
        "Run the operation by hand against the endpoint to see the raw response.",
      ],
    };
  }

  if (error instanceof FrontendMappingError) {
    return {
      ...base,
      kind: "frontend-mapping",
      auth: "succeeded",
      title:
        "The backend answered, but this dashboard failed to map the response",
      explanation:
        "The request succeeded end to end; the bug is in this repo's adapter code (src/server/health/adapters or the loader's select function). The cause chain below has the exception.",
      checks: [
        "Look for a schema change the adapter doesn't handle (npm run codegen:schema && npm run codegen, then npm run typecheck).",
      ],
    };
  }

  if (CombinedGraphQLErrors.is(error)) {
    const graphqlErrors = error.errors.map((entry) => {
      const code = entry.extensions?.code;
      return {
        message: entry.message,
        ...(entry.path ? { path: entry.path.join(".") } : {}),
        ...(typeof code === "string" ? { code } : {}),
      };
    });
    const unauthenticated = graphqlErrors.some(
      (entry) => entry.code === "UNAUTHENTICATED" || entry.code === "FORBIDDEN",
    );
    const validation = graphqlErrors.some(
      (entry) =>
        entry.code === "GRAPHQL_VALIDATION_FAILED" ||
        entry.code === "BAD_USER_INPUT",
    );
    return {
      ...base,
      kind: unauthenticated ? "token-rejected" : "graphql-errors",
      auth: unauthenticated ? "rejected" : "succeeded",
      title: `GraphQL returned ${graphqlErrors.length} error${graphqlErrors.length === 1 ? "" : "s"}${unauthenticated ? " (not authenticated)" : ""}`,
      explanation: unauthenticated
        ? "Login succeeded, but the GraphQL server didn't accept the bearer token."
        : validation
          ? "The server rejected the query itself — the frontend's query no longer matches the backend schema."
          : "The request reached the GraphQL server and authenticated; the server failed while resolving fields.",
      checks: validation
        ? [
            "Refresh the schema and types: npm run codegen:schema && npm run codegen, then npm run typecheck.",
          ]
        : unauthenticated
          ? [
              "The cached token was dropped; reload to log in again. If it persists, check that REST and GraphQL share the same token secret.",
            ]
          : [
              "Check the `hcgateway_graphql_api` container logs for the resolver error at the path shown.",
            ],
      graphqlErrors,
    };
  }

  if (ServerError.is(error) || error instanceof HttpStatusError) {
    const status = ServerError.is(error) ? error.statusCode : error.status;
    const contentType = ServerError.is(error)
      ? error.response.headers.get("content-type")
      : error.contentType;
    const bodySnippet = ServerError.is(error)
      ? snippet(error.bodyText)
      : error.bodySnippet;
    const http = { status, contentType, bodySnippet };
    if (status === 401 || status === 403) {
      return {
        ...base,
        kind: "token-rejected",
        auth: "rejected",
        title: `${context.endpoint ?? "Endpoint"} rejected the bearer token (${status})`,
        explanation:
          "Login succeeded and returned a token, but the data endpoint refused it. The cached token has been dropped, so the next request logs in again.",
        checks: [
          "Reload once. If it persists, the REST and GraphQL services may disagree about token validity (different secrets or clocks).",
        ],
        http,
      };
    }
    const html =
      (contentType ?? "").includes("text/html") || bodySnippet.startsWith("<");
    return {
      ...base,
      kind: "http-error",
      auth: "succeeded",
      title: `${endpointHost} returned HTTP ${status}`,
      explanation:
        status === 404
          ? html
            ? "The URL answered with an HTML 404 page — this usually means the request went to the wrong service (e.g. POSTing GraphQL to the REST API's :6644/graphql, which returns gunicorn's 404)."
            : "The endpoint path doesn't exist on this server."
          : status >= 500
            ? "The backend crashed or errored while handling the request."
            : "The backend refused the request.",
      checks:
        status === 404
          ? [
              `Endpoint used: ${context.endpoint ?? "?"}. GraphQL should be on port 6645 at /graphql; set GRAPHQL_URL to override.`,
            ]
          : [
              `Check the ${context.transport === "graphql" ? "hcgateway_graphql_api" : "hcgateway_api"} container logs.`,
            ],
      http,
    };
  }

  if (ServerParseError.is(error)) {
    return {
      ...base,
      kind: "unparseable-response",
      auth: "succeeded",
      title: `${endpointHost} returned a body that isn't JSON (HTTP ${error.statusCode})`,
      explanation:
        "Something answered at the endpoint, but not a GraphQL server — often a proxy error page or the wrong service on that port.",
      checks: [
        `Endpoint used: ${context.endpoint ?? "?"}.`,
        graphqlServiceHint,
      ],
      http: {
        status: error.statusCode,
        contentType: error.response.headers.get("content-type"),
        bodySnippet: snippet(error.bodyText),
      },
    };
  }

  const zodError = causes.length > 0 ? findZodError(error) : null;
  if (zodError) {
    return {
      ...base,
      kind: "contract-mismatch",
      auth: "succeeded",
      title: `${context.operation} response doesn't match the expected contract`,
      explanation:
        "The backend answered successfully, but the payload failed this dashboard's Zod validation — the contract drifted on one side.",
      checks: [
        "Compare the issues below with src/server/health/dayAnalyticsSchema.ts and a live response.",
      ],
      validationIssues: zodError.issues.slice(0, 20).map((issue) => ({
        path: issue.path.join(".") || "(root)",
        message: issue.message,
      })),
    };
  }

  const code = networkCode(causes);
  if (code || isTimeout(causes)) {
    const timedOut = isTimeout(causes) && !code?.startsWith("E");
    return {
      ...base,
      kind: timedOut ? "timeout" : "unreachable",
      auth: "unknown",
      title: timedOut
        ? `${endpointHost} didn't answer in time`
        : `Couldn't connect to ${endpointHost} (${code})`,
      explanation: timedOut
        ? "The connection opened or was attempted, but no response arrived before the timeout."
        : code === "ENOTFOUND" || code === "EAI_AGAIN"
          ? "The hostname didn't resolve."
          : "Nothing accepted the connection at that address and port.",
      checks: [
        graphqlServiceHint,
        `Endpoint used: ${context.endpoint ?? "?"}${config.graphqlUrlOverride ? " (from GRAPHQL_URL)" : context.transport === "graphql" ? " (derived from API_URL by swapping the port to 6645)" : ""}.`,
      ],
    };
  }

  return {
    ...base,
    kind: "unknown",
    auth: "unknown",
    title: causes[0]?.message ?? "Unknown failure",
    explanation:
      "This failure didn't match any known category; the cause chain below is the raw error.",
    checks: ["Check the dashboard logs: scripts/deploy.sh logs prod"],
  };
}

function findZodError(error: unknown): ZodError | null {
  let current: unknown = error;
  for (let depth = 0; current && depth < 5; depth++) {
    if (current instanceof ZodError) return current;
    current = current instanceof Error ? current.cause : null;
  }
  return null;
}

export type Settled<T> =
  | { ok: true; data: T }
  | { ok: false; diagnostics: BackendDiagnostics };

/**
 * Awaits a loader and converts a `BackendRequestError` into data a page can
 * render. Anything else is a real bug and is rethrown to `error.tsx`.
 */
export async function settle<T>(promise: Promise<T>): Promise<Settled<T>> {
  try {
    return { ok: true, data: await promise };
  } catch (error) {
    if (error instanceof BackendRequestError) {
      return { ok: false, diagnostics: error.diagnostics };
    }
    throw error;
  }
}
