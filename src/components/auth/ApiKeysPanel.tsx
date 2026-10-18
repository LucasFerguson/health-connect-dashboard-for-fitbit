"use client";

import { useActionState, useState } from "react";
import { API_KEY_NAME_MAX, type ApiKeySummary } from "~/domain/apiKeys";
import { createApiKey, revokeApiKey } from "~/server/auth/actions";
import { authInputClass } from "./AuthForm";

interface ApiKeysPanelProps {
  /** Null when HCGateway couldn't list them. */
  keys: ApiKeySummary[] | null;
  /** Ready-to-run request using the key, for the "how to use" box. */
  example: string;
}

const buttonClass =
  "font-display cursor-pointer max-sm:min-h-11 max-sm:px-4 tracking-[.1em] transition-opacity duration-[120ms] hover:opacity-90 disabled:cursor-wait disabled:opacity-60";

/** ISO timestamps as a plain date, the same on the server and the client. */
const day = (iso: string) => iso.slice(0, 10);

/** Make, list and revoke read-only API keys. A new key is shown once, here,
 * right after it's made; HCGateway only keeps its hash. */
export function ApiKeysPanel({ keys, example }: ApiKeysPanelProps) {
  const [state, formAction, pending] = useActionState(createApiKey, {
    error: null,
    created: null,
  });
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
    } catch {
      // Clipboard needs HTTPS; over plain HTTP the text stays selectable.
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <form
        key={state.created?.key ?? "new"}
        action={formAction}
        className="flex max-w-sm flex-col gap-3"
      >
        <label className="text-ink-100 flex flex-col gap-1 text-xs tracking-[.06em]">
          KEY NAME
          <input
            name="name"
            maxLength={API_KEY_NAME_MAX}
            placeholder="laptop export"
            required
            className={authInputClass}
          />
        </label>
        {state.error ? (
          <p role="alert" className="text-alert text-sm">
            {state.error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className={`bg-brand-500 text-ink-0 py-2 ${buttonClass}`}
        >
          {pending ? "…" : "CREATE KEY"}
        </button>
      </form>

      {state.created ? (
        <div
          role="status"
          className="border-recovery flex flex-col gap-2 border-l-2 pl-3"
        >
          <p className="text-ink-0 text-sm">
            Copy your new key for “{state.created.name}” now. You won&apos;t be
            able to see it again.
          </p>
          <code className="bg-ink-850 text-ink-0 block p-2 font-mono text-xs break-all select-all">
            {state.created.key}
          </code>
          <button
            type="button"
            onClick={() => void copy(state.created?.key ?? "")}
            className={`border-ink-500 text-ink-0 self-start border px-3 py-1 text-xs ${buttonClass}`}
          >
            {copied === state.created.key ? "COPIED" : "COPY KEY"}
          </button>
        </div>
      ) : null}

      {keys === null ? (
        <p className="text-alert text-sm">
          Couldn&apos;t load your keys. Is HCGateway running?
        </p>
      ) : keys.length === 0 ? (
        <p className="text-ink-200 text-sm">
          You don&apos;t have any keys yet.
        </p>
      ) : (
        <ul className="border-ink-600 flex flex-col border-t">
          {keys.map((key) => (
            <li
              key={key.id}
              className="border-ink-600 flex flex-wrap items-center justify-between gap-3 border-b py-3"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <span className="text-ink-0 text-sm">{key.name}</span>
                <span className="text-ink-200 font-mono text-xs">
                  {key.prefix}… · made {day(key.createdAt)} ·{" "}
                  {key.lastUsedAt
                    ? `last used ${day(key.lastUsedAt)}`
                    : "never used"}
                </span>
              </div>
              <form
                action={revokeApiKey}
                onSubmit={(event) => {
                  if (
                    !window.confirm(
                      `Revoke “${key.name}”? Anything using it stops working right away.`,
                    )
                  ) {
                    event.preventDefault();
                  }
                }}
              >
                <input type="hidden" name="id" value={key.id} />
                <button
                  type="submit"
                  className={`border-alert text-alert border px-3 py-1 text-xs ${buttonClass}`}
                >
                  REVOKE
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2">
        <h3 className="text-ink-100 text-xs tracking-[.06em]">HOW TO USE IT</h3>
        <p className="text-ink-200 text-sm">
          Send GraphQL queries with the key as a bearer token. This one reads
          the last week of step records; put your key in{" "}
          <code className="font-mono text-xs">HCG_KEY</code> first.
        </p>
        <pre className="bg-ink-850 text-ink-100 overflow-x-auto p-3 font-mono text-xs">
          {example}
        </pre>
        <button
          type="button"
          onClick={() => void copy(example)}
          className={`border-ink-500 text-ink-0 self-start border px-3 py-1 text-xs ${buttonClass}`}
        >
          {copied === example ? "COPIED" : "COPY EXAMPLE"}
        </button>
      </div>
    </div>
  );
}
