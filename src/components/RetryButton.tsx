"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

/** Re-runs the current route's server components, i.e. retries the fetch. */
export function RetryButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
      className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:bg-violet-400 disabled:opacity-60"
    >
      {pending ? "Retrying…" : "Try again"}
    </button>
  );
}
