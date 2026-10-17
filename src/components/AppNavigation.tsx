"use client";

import { useEffect, useRef, useState } from "react";
import Link, { useLinkStatus } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import { notchStyle } from "~/components/ui/notch";
import { Spinner } from "~/components/ui/Spinner";
import {
  analyticsRunCompleted,
  describeAnalyticsStatus,
  syncPollInterval,
  type AnalyticsStatusDisplay,
} from "~/domain/analyticsStatus";
import { PUBLIC_PAGES } from "~/domain/auth";
import { describeSyncStatus } from "~/domain/dayViewPresentation";
import { signOut } from "~/server/auth/actions";
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
  { href: "/hrv", label: "HRV" },
  { href: "/skin-temperature", label: "SKIN TEMP" },
  { href: "/weight", label: "WEIGHT" },
  { href: "/healthspan", label: "HEALTHSPAN" },
  { href: "/recovery", label: "RECOVERY" },
  { href: "/habits", label: "HABITS" },
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
  const signedOutPage = PUBLIC_PAGES.includes(pathname);
  const syncStatus = useSyncStatus(!signedOutPage);
  const now = new Date();
  const sync = syncStatus ? describeSyncStatus(syncStatus, now) : null;
  const analytics = syncStatus?.analytics
    ? describeAnalyticsStatus(syncStatus.analytics, now)
    : null;
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

  if (signedOutPage) return null;

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
            // Hidden on phones, where it pushed the nav wider than the screen.
            className={clsx(
              "hidden md:inline",
              sync.label === "RECEIVING" && "text-recovery",
            )}
          >
            SYNC {sync.label}
            {sync.detail ? ` · ${sync.detail}` : ""}
          </span>
        ) : null}
        {analytics ? <AnalyticsIndicator display={analytics} /> : null}
        <Link
          href="/settings"
          aria-current={pathname === "/settings" ? "page" : undefined}
          className={clsx(
            "hover:text-ink-0 tracking-[.08em] transition-colors duration-[120ms] ease-out",
            pathname === "/settings" && "text-ink-0",
          )}
        >
          ACCOUNT
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="hover:text-ink-0 cursor-pointer tracking-[.08em] transition-colors duration-[120ms] ease-out"
          >
            SIGN OUT
          </button>
        </form>
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

/** The analytics job next to the SYNC label. From `md` up it's a text label
 * (with a pulsing square while running); on phones, where the nav has no
 * room for text, only the square shows, and only while running or failed. */
function AnalyticsIndicator({ display }: { display: AnalyticsStatusDisplay }) {
  const dot =
    display.animated || display.tone === "alert" ? (
      <span
        aria-hidden
        className={clsx(
          "block size-[6px] shrink-0",
          display.tone === "alert" ? "bg-alert" : "bg-brand-400",
          display.animated && "animate-pulse",
        )}
      />
    ) : null;
  return (
    <span
      role="status"
      aria-label={display.title}
      title={display.title}
      className={clsx(
        "items-center gap-1.5",
        display.showOnPhone ? "flex" : "hidden md:flex",
        display.tone === "active" && "text-brand-400",
        display.tone === "alert" && "text-alert",
        display.tone === "dim" && "text-ink-200/70",
      )}
    >
      {dot}
      <span className="hidden md:inline" aria-hidden>
        {display.label}
      </span>
    </span>
  );
}

/** Polls `/api/sync-status` client-side so the heartbeat is visible from
 * every page, not just the day view (which used to fetch it server-side,
 * scoped to that one route). Mirrors `HealthDataProvider`'s polling
 * pattern: skip a beat and keep the last good value on failure rather than
 * ever showing a stale value as fresh or throwing.
 *
 * Polls every 10s while an analytics job is queued or running, else every
 * 60s. When a run completes while the page is open it refreshes the route
 * once, so server-rendered analytics catch up without a manual reload. */
function useSyncStatus(enabled: boolean): SyncStatus | null {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let timer: number | undefined;
    // Undefined until the first good response: that one sets the baseline.
    let previous: SyncStatus | undefined;

    const schedule = () => {
      if (cancelled) return;
      timer = window.setTimeout(
        () => void refresh(),
        syncPollInterval(previous?.analytics),
      );
    };

    const refresh = async () => {
      try {
        const response = await fetch("/api/sync-status", {
          cache: "no-store",
        });
        // Signed out: either the middleware's 401 (no cookie) or a redirect
        // through /auth/expired (HCGateway rejected the session).
        if (response.status === 401 || response.redirected) {
          window.location.assign("/login");
          return;
        }
        if (response.ok && !cancelled) {
          const data = (await response.json()) as SyncStatus;
          if (!cancelled) {
            if (analyticsRunCompleted(previous?.analytics, data.analytics)) {
              router.refresh();
            }
            previous = data;
            setStatus(data);
          }
        }
      } catch (error) {
        console.error(
          "Unable to refresh sync status",
          error instanceof Error ? error.message : String(error),
        );
      }
      schedule();
    };

    void refresh();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [enabled, router]);

  return status;
}
