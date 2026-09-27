"use client";

import { useEffect } from "react";

/**
 * Root error boundary. Catches render-time throws from every page below
 * `layout.tsx` — the GraphQL-backed pages, whose `withAnalytics` reads throw
 * rather than render empty, and the REST-backed `/day` pages — so an
 * unreachable data source (e.g. the self-hosted API host going down or being
 * briefly unreachable) shows a readable in-app message instead of Next's
 * default crash page.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page render failed", error.message, error.stack);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center text-white">
      <span className="grid size-12 place-items-center rounded-xl bg-red-500/15 text-2xl">
        ⚠
      </span>
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">
          Couldn&apos;t load health data
        </h1>
        <p className="max-w-md text-sm text-white/55">
          The dashboard couldn&apos;t reach its data source. It may be
          temporarily unreachable — check that it&apos;s up and reachable from
          this server, then try again.
        </p>
      </div>
      <button
        type="button"
        onClick={reset}
        className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:bg-violet-400"
      >
        Try again
      </button>
    </div>
  );
}
