/**
 * Renders a `BackendDiagnostics` report in place of a page's content: which
 * step of the request chain broke, why, what to check, and every detail we
 * have (endpoint, operation, selected fields, HTTP status and body, GraphQL
 * errors, the cause chain). Deliberately verbose — this dashboard is
 * self-hosted and single-user, so the person reading it is the person who can
 * fix it. See `backendDiagnostics.ts` for why this isn't `error.tsx`.
 */
import type { ReactNode } from "react";
import type {
  BackendDiagnostics,
  FailureKind,
} from "~/server/health/backendDiagnostics";
import { RetryButton } from "./RetryButton";

const STEPS = [
  "Configuration",
  "Login",
  "Data request",
  "Response",
  "Frontend mapping",
] as const;

/** Index into STEPS of the step that failed, or null if unclassified. */
function failedStep(diagnostics: BackendDiagnostics): number | null {
  const byKind: Record<FailureKind, number | null> = {
    "not-configured": 0,
    "login-rejected": 1,
    "login-failed": 1,
    unreachable: 2,
    timeout: 2,
    "token-rejected": 2,
    "http-error": 3,
    "graphql-errors": 3,
    "unparseable-response": 3,
    "empty-response": 3,
    "contract-mismatch": 3,
    "frontend-mapping": 4,
    unknown: null,
  };
  // An unreachable/timed-out *login* fails at the login step, not the data
  // request; `auth: "failed"` is how the diagnosis marks that.
  if (
    diagnostics.auth === "failed" &&
    (diagnostics.kind === "unreachable" || diagnostics.kind === "timeout")
  ) {
    return 1;
  }
  return byKind[diagnostics.kind];
}

export function BackendErrorPanel({
  diagnostics,
}: {
  diagnostics: BackendDiagnostics;
}) {
  const failed = failedStep(diagnostics);
  const { request, config } = diagnostics;
  const transportLabel = request.transport === "graphql" ? "GraphQL" : "REST";

  return (
    <main className="min-h-screen bg-[#090d17] px-4 py-10 text-white">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <header className="flex flex-col gap-3">
          <p className="font-mono text-[11px] font-semibold tracking-[.14em] text-red-300 uppercase">
            Couldn&apos;t load health data · {diagnostics.kind}
          </p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {diagnostics.title}
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-white/70">
            {diagnostics.explanation}
          </p>
        </header>

        <ol
          className="grid grid-cols-1 gap-2 sm:grid-cols-5"
          aria-label="Request chain"
        >
          {STEPS.map((step, index) => {
            const state =
              failed === null
                ? "unknown"
                : index < failed
                  ? "passed"
                  : index === failed
                    ? "failed"
                    : "skipped";
            const styles = {
              passed:
                "border-emerald-400/30 bg-emerald-950/40 text-emerald-200",
              failed: "border-red-400/60 bg-red-950/60 text-red-100",
              skipped: "border-white/10 bg-white/[0.03] text-white/35",
              unknown: "border-white/10 bg-white/[0.03] text-white/60",
            }[state];
            const mark = {
              passed: "✓",
              failed: "✕",
              skipped: "–",
              unknown: "?",
            }[state];
            return (
              <li
                key={step}
                className={`rounded-lg border px-3 py-2 text-xs ${styles}`}
              >
                <span className="font-mono">{mark}</span> {step}
                <span className="block text-[10px] opacity-70">
                  {state === "skipped" ? "not reached" : state}
                </span>
              </li>
            );
          })}
        </ol>

        {diagnostics.checks.length > 0 ? (
          <Section title="What to check">
            <ul className="list-disc space-y-1 pl-5 text-sm text-white/80">
              {diagnostics.checks.map((check) => (
                <li key={check}>{check}</li>
              ))}
            </ul>
          </Section>
        ) : null}

        <Section title="Request">
          <Facts
            rows={[
              ["Transport", transportLabel],
              ["Loader", request.label],
              ["Operation", request.operation],
              [
                "Fields selected",
                request.selections.length > 0
                  ? request.selections.join("\n")
                  : null,
              ],
              [
                "Endpoint",
                request.endpoint ?? "(could not derive — API_URL unset)",
              ],
              ["Login endpoint", request.loginUrl],
              ["Authentication", diagnostics.auth],
              ["Elapsed", `${diagnostics.elapsedMs} ms`],
              ["Occurred at", diagnostics.occurredAt],
            ]}
          />
        </Section>

        {diagnostics.http ? (
          <Section title={`HTTP response · ${diagnostics.http.status}`}>
            <Facts
              rows={[
                ["Status", String(diagnostics.http.status)],
                ["Content-Type", diagnostics.http.contentType],
              ]}
            />
            {diagnostics.http.bodySnippet ? (
              <Code>{diagnostics.http.bodySnippet}</Code>
            ) : (
              <p className="text-xs text-white/50">(empty body)</p>
            )}
          </Section>
        ) : null}

        {diagnostics.graphqlErrors && diagnostics.graphqlErrors.length > 0 ? (
          <Section title="GraphQL errors">
            <ul className="space-y-2">
              {diagnostics.graphqlErrors.map((entry, index) => (
                <li
                  key={index}
                  className="rounded-md border border-white/10 bg-black/30 p-3 text-sm"
                >
                  <p className="text-red-100">{entry.message}</p>
                  <p className="mt-1 font-mono text-[11px] text-white/50">
                    {entry.path ? `path: ${entry.path}` : "path: (none)"}
                    {entry.code ? ` · code: ${entry.code}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        {diagnostics.validationIssues &&
        diagnostics.validationIssues.length > 0 ? (
          <Section title="Contract validation issues">
            <Facts
              rows={diagnostics.validationIssues.map(
                (issue) => [issue.path, issue.message] as const,
              )}
            />
          </Section>
        ) : null}

        {diagnostics.causes.length > 0 ? (
          <Section title="Cause chain">
            <ol className="space-y-1 font-mono text-xs text-white/75">
              {diagnostics.causes.map((cause, index) => (
                <li key={index}>
                  <span className="text-white/40">{"↳ ".repeat(index)}</span>
                  <span className="text-amber-200">{cause.name}</span>
                  {cause.code ? (
                    <span className="text-white/50"> [{cause.code}]</span>
                  ) : null}
                  : {cause.message}
                </li>
              ))}
            </ol>
          </Section>
        ) : null}

        <Section title="Configuration (as this server sees it)">
          <Facts
            rows={[
              ["API_URL", config.apiUrl ?? "unset"],
              ["API_USERNAME", config.username ?? "unset"],
              ["API_PASSWORD", config.passwordSet ? "set (hidden)" : "unset"],
              [
                "GRAPHQL_URL",
                config.graphqlUrlOverride ??
                  "unset — derived from API_URL with port 6645",
              ],
            ]}
          />
        </Section>

        <div className="flex flex-wrap items-center gap-3">
          <RetryButton />
          <span className="text-xs text-white/45">
            Server logs: <code>scripts/deploy.sh logs prod</code>
          </span>
        </div>

        <details className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
          <summary className="cursor-pointer text-xs text-white/60">
            Raw diagnosis (JSON, safe to paste into a bug report)
          </summary>
          <Code>{JSON.stringify(diagnostics, null, 2)}</Code>
        </details>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.035] p-4">
      <h2 className="font-mono text-[11px] font-semibold tracking-[.12em] text-white/60 uppercase">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Facts({
  rows,
}: {
  rows: readonly (readonly [string, string | null])[];
}) {
  return (
    <dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-[11rem_1fr]">
      {rows
        .filter(([, value]) => value !== null)
        .map(([label, value]) => (
          <div key={label} className="contents">
            <dt className="text-white/50">{label}</dt>
            <dd className="font-mono text-xs leading-5 break-all whitespace-pre-wrap text-white/85">
              {value}
            </dd>
          </div>
        ))}
    </dl>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre className="max-h-80 overflow-auto rounded-md bg-black/40 p-3 font-mono text-[11px] leading-5 whitespace-pre-wrap text-white/75">
      {children}
    </pre>
  );
}
