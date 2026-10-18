"use client";

import { useEffect, useState, type ReactNode } from "react";

const PHONE = "(max-width: 639px)";

/**
 * A lower overview section that folds into a disclosure on phones so the page
 * isn't one long scroll. It renders open (the desktop layout, and what the
 * server sends); on a phone it folds closed once after mounting. Nothing is
 * removed: the heading and summary line stay visible and one tap opens it.
 */
export function OverviewSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (window.matchMedia(PHONE).matches) setOpen(false);
  }, []);

  return (
    <section aria-labelledby={`${id}-heading`}>
      <details
        open={open}
        onToggle={(event) => setOpen(event.currentTarget.open)}
        className="group"
      >
        <summary className="flex min-h-11 cursor-pointer list-none items-start justify-between gap-3 rounded-xl py-1 select-none focus-visible:ring-2 focus-visible:ring-violet-300 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
          <div className="min-w-0">
            <h2 id={`${id}-heading`} className="text-xl font-bold sm:text-2xl">
              {title}
            </h2>
            <p className="mt-1 max-w-3xl text-sm text-white/75">
              {description}
            </p>
          </div>
          <span className="mt-0.5 flex shrink-0 items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-violet-100">
            <span className="group-open:hidden">Show</span>
            <span className="hidden group-open:inline">Hide</span>
            <span
              aria-hidden
              className="inline-block transition-transform group-open:rotate-180"
            >
              ▾
            </span>
          </span>
        </summary>
        <div className="mt-3">{children}</div>
      </details>
    </section>
  );
}
