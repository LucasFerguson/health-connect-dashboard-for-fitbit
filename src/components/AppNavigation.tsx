"use client";

import { useEffect, useRef, useState } from "react";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { notchStyle } from "~/components/ui/notch";
import { Spinner } from "~/components/ui/Spinner";
import { describeSyncStatus } from "~/domain/dayViewPresentation";
import type { SyncStatus } from "~/domain/dayView";

const links = [
  { href: "/day", label: "DAY" },
  { href: "/", label: "OVERVIEW" },
  { href: "/sleep", label: "SLEEP" },
  { href: "/sleep-debt", label: "SLEEP DEBT" },
  { href: "/sleep-consistency", label: "CONSISTENCY" },
  { href: "/steps", label: "STEPS" },
  { href: "/calories", label: "CALORIES" },
  { href: "/resting-heart-rate", label: "HEART" },
  { href: "/weight", label: "WEIGHT" },
  { href: "/healthspan", label: "HEALTHSPAN" },
  { href: "/explore", label: "EXPLORE" },
  { href: "/data-sources", label: "DATA SOURCES" },
];

/**
 * The single app-wide nav — replaces the two nav bars this app used to
 * carry (the old purple/`bg-white/10` `AppNavigation` here, plus a second
 * `MenuBar` duplicated inside the day view with mostly the same links in a
 * different taxonomy). Consolidated onto one flat list, in the Meridian
 * ink-token system, so every page gets one nav instead of stacking two
 * cramped rows on narrow viewports.
 */
export function AppNavigation() {
  const pathname = usePathname();
  const syncStatus = useSyncStatus();
  const sync = syncStatus ? describeSyncStatus(syncStatus, new Date()) : null;
  const linksRef = useRef<HTMLDivElement>(null);

  // On a narrow screen the link row scrolls horizontally, and the active
  // page (e.g. EXPLORE, near the end) would otherwise sit off-screen.
  // Scroll only the row, never the page. Re-run when the row resizes: the
  // sync label arrives after mount and narrows it.
  useEffect(() => {
    const row = linksRef.current;
    if (!row) return;
    const reveal = () => {
      const active = row.querySelector<HTMLElement>('[aria-current="page"]');
      if (!active) return;
      const rowBox = row.getBoundingClientRect();
      const box = active.getBoundingClientRect();
      if (box.left < rowBox.left || box.right > rowBox.right) {
        row.scrollLeft +=
          box.left - rowBox.left - (rowBox.width - box.width) / 2;
      }
    };
    reveal();
    const observer = new ResizeObserver(reveal);
    observer.observe(row);
    return () => observer.disconnect();
  }, [pathname]);

  return (
    <nav
      aria-label="Primary navigation"
      className="border-ink-600 bg-ink-950 flex h-[38px] shrink-0 items-center border-b px-4"
    >
      <Link href="/" className="flex shrink-0 items-center gap-2 pr-[18px]">
        <span
          className="bg-brand-400 block size-[14px]"
          style={notchStyle(6)}
          aria-hidden
        />
        <span className="font-display text-ink-0 text-lg tracking-[.14em]">
          DASHBOARD
        </span>
      </Link>
      <div
        ref={linksRef}
        className="flex h-[38px] min-w-0 flex-1 items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {links.map((link) => {
          const active =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={clsx(
                "font-display flex h-[38px] shrink-0 items-center gap-1.5 px-[13px] text-[15px] tracking-[.08em] transition-colors duration-[120ms] ease-out",
                active
                  ? "text-ink-0 bg-ink-800 shadow-[inset_0_-2px_0_var(--color-brand-400)]"
                  : "text-ink-100 hover:bg-ink-800 hover:text-ink-0",
              )}
            >
              {link.label}
              <NavLinkIndicator />
            </Link>
          );
        })}
      </div>
      <div className="text-ink-200 ml-3 flex shrink-0 items-center gap-3.5 font-mono text-[9.5px] tracking-[.08em]">
        {sync ? (
          <span
            title={syncStatus?.note}
            className={clsx(sync.label === "RECEIVING" && "text-recovery")}
          >
            SYNC {sync.label}
            {sync.detail ? ` · ${sync.detail}` : ""}
          </span>
        ) : null}
      </div>
    </nav>
  );
}

/** Swaps a nav item's caret for a spinner while its own navigation is
 * pending, via Next's per-link `useLinkStatus` — must be a child of the
 * `Link` it reports on, not the nav itself, so each item's indicator
 * reflects only that item's navigation. */
function NavLinkIndicator() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return <Spinner size={9} color="currentColor" />;
}

const SYNC_POLL_MS = 60_000;

/** Polls `/api/sync-status` client-side so the heartbeat is visible from
 * every page, not just the day view (which used to fetch it server-side,
 * scoped to that one route). Mirrors `HealthDataProvider`'s polling
 * pattern: skip a beat and keep the last good value on failure rather than
 * ever showing a stale value as fresh or throwing. */
function useSyncStatus(): SyncStatus | null {
  const [status, setStatus] = useState<SyncStatus | null>(null);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      try {
        const response = await fetch("/api/sync-status", {
          cache: "no-store",
        });
        if (!response.ok || cancelled) return;
        const data = (await response.json()) as SyncStatus;
        if (!cancelled) setStatus(data);
      } catch (error) {
        console.error(
          "Unable to refresh sync status",
          error instanceof Error ? error.message : String(error),
        );
      }
    };

    void refresh();
    const interval = window.setInterval(() => void refresh(), SYNC_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return status;
}
