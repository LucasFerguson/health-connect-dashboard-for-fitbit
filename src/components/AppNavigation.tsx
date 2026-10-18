"use client";

import { useEffect, useId, useRef, useState } from "react";
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
import {
  NAV_GROUPS,
  SYSTEM_ITEMS,
  findActiveNav,
  isActiveHref,
  type NavGroup,
  type NavItem,
} from "~/domain/navigation";
import { signOut } from "~/server/auth/actions";
import type { SyncStatus } from "~/domain/dayView";

type SyncDisplay = ReturnType<typeof describeSyncStatus>;

/**
 * The single app-wide nav, built from the page map in `~/domain/navigation`.
 *
 * - Desktop (`lg` and up): one row. Groups with several pages (Sleep,
 *   Activity, Heart, Body, Scores) are dropdowns that light up when you're
 *   on any page inside them; Day, Overview, Habits and Explore are plain
 *   links. Data sources, Account and Sign out live in one ACCOUNT menu so
 *   the top level is all health content.
 * - Phones and tablets: a slim bar with the current page's name, the
 *   sync/analysis status and a menu button. The menu is a sheet listing
 *   every page under its group heading, all expanded, so any page is one
 *   tap away; it closes on navigation, outside tap or Escape.
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

  if (signedOutPage) return null;

  return (
    <nav
      aria-label="Primary navigation"
      className="border-ink-600 bg-ink-950 relative z-40 flex h-11 shrink-0 items-center border-b px-4 lg:h-[38px]"
    >
      <Link
        href="/"
        className="flex shrink-0 items-center gap-2 pr-3 lg:pr-[18px]"
        aria-label="Dashboard home"
      >
        <span
          className="bg-brand-400 block size-[14px]"
          style={notchStyle(6)}
          aria-hidden
        />
        <span className="font-display text-ink-0 hidden text-lg tracking-[.14em] sm:inline lg:inline">
          DASHBOARD
        </span>
      </Link>

      <DesktopLinks pathname={pathname} />
      <MobileTitle pathname={pathname} />

      <div className="text-ink-200 ml-3 flex shrink-0 items-center gap-3.5 font-mono text-[9.5px] tracking-[.08em]">
        {sync ? (
          <span
            title={syncStatus?.note}
            className={clsx(
              "hidden xl:inline",
              sync.label === "RECEIVING" && "text-recovery",
            )}
          >
            SYNC {sync.label}
            {sync.detail ? ` · ${sync.detail}` : ""}
          </span>
        ) : null}
        {analytics ? <AnalyticsIndicator display={analytics} /> : null}
        <AccountMenu pathname={pathname} sync={sync} />
        <MobileMenu pathname={pathname} sync={sync} analytics={analytics} />
      </div>
    </nav>
  );
}

const topLinkClass = (active: boolean) =>
  clsx(
    "font-display flex h-[38px] shrink-0 items-center gap-1.5 px-2.5 text-[15px] tracking-[.08em] transition-colors duration-[120ms] ease-out xl:px-[13px]",
    active
      ? "text-ink-0 bg-ink-800 shadow-[inset_0_-2px_0_var(--color-brand-400)]"
      : "text-ink-100 hover:bg-ink-800 hover:text-ink-0",
  );

function DesktopLinks({ pathname }: { pathname: string }) {
  return (
    <div className="hidden h-[38px] min-w-0 flex-1 items-center lg:flex">
      {NAV_GROUPS.flatMap((group) =>
        group.inline
          ? group.items.map((item) => {
              const active = isActiveHref(item.href, pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={topLinkClass(active)}
                >
                  {item.label.toUpperCase()}
                  <NavLinkIndicator />
                </Link>
              );
            })
          : [<GroupMenu key={group.id} group={group} pathname={pathname} />],
      )}
    </div>
  );
}

/** A dropdown for a group of pages. Opens on click (and keyboard), closes on
 * outside click, Escape, or navigating. */
function GroupMenu({ group, pathname }: { group: NavGroup; pathname: string }) {
  const active = group.items.some((item) => isActiveHref(item.href, pathname));
  return (
    <Dropdown
      label={group.label.toUpperCase()}
      buttonClassName={topLinkClass(active)}
      pathname={pathname}
    >
      {(close) =>
        group.items.map((item) => (
          <MenuLink
            key={item.href}
            item={item}
            pathname={pathname}
            onNavigate={close}
          />
        ))
      }
    </Dropdown>
  );
}

function AccountMenu({
  pathname,
  sync,
}: {
  pathname: string;
  sync: SyncDisplay | null;
}) {
  const active = SYSTEM_ITEMS.some((item) => isActiveHref(item.href, pathname));
  return (
    <div className="hidden lg:block">
      <Dropdown
        label="ACCOUNT"
        align="right"
        pathname={pathname}
        buttonClassName={clsx(
          "flex h-[38px] cursor-pointer items-center gap-1 tracking-[.08em] transition-colors duration-[120ms] ease-out hover:text-ink-0",
          active && "text-ink-0",
        )}
      >
        {(close) => (
          <>
            {sync ? (
              <p className="text-ink-200 border-ink-600 border-b px-3 pt-1 pb-2 font-mono text-[10px] tracking-[.08em] xl:hidden">
                SYNC {sync.label}
                {sync.detail ? ` · ${sync.detail}` : ""}
              </p>
            ) : null}
            {SYSTEM_ITEMS.map((item) => (
              <MenuLink
                key={item.href}
                item={item}
                pathname={pathname}
                onNavigate={close}
              />
            ))}
            <SignOutButton className="text-ink-100 hover:bg-ink-800 hover:text-ink-0 border-ink-600 mt-1 flex w-full border-t px-3 py-2 text-left font-mono text-[11px]" />
          </>
        )}
      </Dropdown>
    </div>
  );
}

function Dropdown({
  label,
  buttonClassName,
  align = "left",
  pathname,
  children,
}: {
  label: string;
  buttonClassName: string;
  align?: "left" | "right";
  pathname: string;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  // Navigating anywhere closes it.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className={clsx(buttonClassName, "cursor-pointer")}
      >
        {label}
        <Caret open={open} />
      </button>
      {open ? (
        <div
          id={menuId}
          className={clsx(
            "border-ink-600 bg-ink-950 absolute top-full z-50 min-w-[200px] border py-1 font-sans text-[13px] tracking-normal normal-case shadow-[0_8px_24px_rgba(0,0,0,.45)]",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          {children(() => setOpen(false))}
        </div>
      ) : null}
    </div>
  );
}

function MenuLink({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate: () => void;
}) {
  const active = isActiveHref(item.href, pathname);
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={clsx(
        "flex items-center gap-2 px-3 py-2 text-sm whitespace-nowrap transition-colors duration-[120ms]",
        active
          ? "text-ink-0 bg-ink-800 shadow-[inset_2px_0_0_var(--color-brand-400)]"
          : "text-ink-100 hover:bg-ink-800 hover:text-ink-0",
      )}
    >
      {item.label}
      <NavLinkIndicator />
    </Link>
  );
}

function Caret({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 10 6"
      className={clsx(
        "size-[9px] transition-transform duration-[120ms]",
        open && "rotate-180",
      )}
      aria-hidden
    >
      <path
        d="M1 1l4 4 4-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

/** On phones the bar says where you are, since the links live in the menu. */
function MobileTitle({ pathname }: { pathname: string }) {
  const active = findActiveNav(pathname);
  return (
    <p className="font-display text-ink-0 min-w-0 flex-1 truncate text-[15px] tracking-[.08em] lg:hidden">
      {active ? (
        <>
          {active.group &&
          !active.group.inline &&
          active.group.label !== active.item.label ? (
            <span className="text-ink-200">
              {active.group.label.toUpperCase()} ·{" "}
            </span>
          ) : null}
          {active.item.label.toUpperCase()}
        </>
      ) : null}
    </p>
  );
}

function MobileMenu({
  pathname,
  sync,
  analytics,
}: {
  pathname: string;
  sync: SyncDisplay | null;
  analytics: AnalyticsStatusDisplay | null;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const sheetId = useId();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    // Keep the page behind the sheet from scrolling while it's open.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={sheetId}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((value) => !value)}
        className="text-ink-0 hover:bg-ink-800 -mr-2 flex size-11 cursor-pointer items-center justify-center"
      >
        <MenuIcon open={open} />
      </button>
      {open ? (
        <>
          <div
            aria-hidden
            onClick={close}
            className="fixed inset-x-0 top-11 bottom-0 z-40 bg-black/50"
          />
          <div
            id={sheetId}
            className="border-ink-600 bg-ink-950 fixed inset-x-0 top-11 z-50 max-h-[calc(100dvh-2.75rem)] overflow-y-auto overscroll-contain border-b pb-[max(1rem,env(safe-area-inset-bottom))] font-sans tracking-normal"
          >
            <div className="mx-auto grid max-w-3xl gap-x-6 px-4 pt-2 sm:grid-cols-2">
              {NAV_GROUPS.map((group) => (
                <MobileSection
                  key={group.id}
                  title={group.label}
                  items={group.items}
                  pathname={pathname}
                  onNavigate={close}
                />
              ))}
              <MobileSection
                title="System"
                items={SYSTEM_ITEMS}
                pathname={pathname}
                onNavigate={close}
              />
            </div>
            <div className="border-ink-600 text-ink-200 mx-auto mt-2 flex max-w-3xl flex-wrap items-center justify-between gap-3 border-t px-4 pt-3 font-mono text-[10px] tracking-[.08em]">
              <span className="flex flex-col gap-1">
                {sync ? (
                  <span
                    className={clsx(
                      sync.label === "RECEIVING" && "text-recovery",
                    )}
                  >
                    SYNC {sync.label}
                    {sync.detail ? ` · ${sync.detail}` : ""}
                  </span>
                ) : null}
                {analytics?.label ? (
                  <span
                    className={clsx(
                      analytics.tone === "active" && "text-brand-400",
                      analytics.tone === "alert" && "text-alert",
                    )}
                  >
                    {analytics.label}
                  </span>
                ) : null}
              </span>
              <SignOutButton className="border-ink-500 text-ink-0 hover:bg-ink-800 min-h-11 border px-4 font-mono text-[11px]" />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function MobileSection({
  title,
  items,
  pathname,
  onNavigate,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <section className="py-2">
      <h2 className="text-ink-200 px-2 pb-1 font-mono text-[10px] tracking-[.12em] uppercase">
        {title}
      </h2>
      <ul>
        {items.map((item) => {
          const active = isActiveHref(item.href, pathname);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "flex min-h-11 items-center gap-2 px-2 text-[15px]",
                  active
                    ? "text-ink-0 bg-ink-800 shadow-[inset_2px_0_0_var(--color-brand-400)]"
                    : "text-ink-50 active:bg-ink-800",
                )}
              >
                {item.label}
                <NavLinkIndicator />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="size-5" aria-hidden>
      {open ? (
        <path
          d="M4 4l12 12M16 4L4 16"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      ) : (
        <path
          d="M3 6h14M3 10h14M3 14h14"
          stroke="currentColor"
          strokeWidth="1.6"
        />
      )}
    </svg>
  );
}

function SignOutButton({ className }: { className: string }) {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className={clsx(
          "cursor-pointer tracking-[.08em] transition-colors duration-[120ms] ease-out",
          className,
        )}
      >
        SIGN OUT
      </button>
    </form>
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
        display.showOnPhone ? "flex" : "hidden md:flex lg:hidden xl:flex",
        display.tone === "active" && "text-brand-400",
        display.tone === "alert" && "text-alert",
        display.tone === "dim" && "text-ink-200/70",
      )}
    >
      {dot}
      <span className="hidden md:inline lg:hidden xl:inline" aria-hidden>
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
