/**
 * The app's page map, shared by the desktop bar and the mobile menu so the
 * two can never disagree about where a page lives.
 *
 * Pages are grouped by what they're about (sleep, activity, heart, body),
 * with the composite scores and the analysis tools in their own groups.
 * On desktop, a group with one page is a plain link and a group with
 * several is a dropdown; on mobile every group is a headed section of the
 * menu sheet, all expanded, so any page is one tap away.
 */
export interface NavItem {
  href: string;
  /** Full name, used in the mobile menu, dropdowns and the mobile title. */
  label: string;
}

export interface NavGroup {
  id: string;
  /** Heading in the mobile menu and the dropdown button on desktop. */
  label: string;
  items: NavItem[];
  /** Desktop shows each item as its own top-level link instead of a menu. */
  inline?: boolean;
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "today",
    label: "Today",
    inline: true,
    items: [
      { href: "/day", label: "Day" },
      { href: "/", label: "Overview" },
      { href: "/leaderboard", label: "Leaderboard" },
    ],
  },
  {
    id: "sleep",
    label: "Sleep",
    items: [
      { href: "/sleep", label: "Sleep" },
      { href: "/sleep-debt", label: "Sleep debt" },
      { href: "/sleep-consistency", label: "Consistency" },
    ],
  },
  {
    id: "activity",
    label: "Activity",
    items: [
      { href: "/steps", label: "Steps" },
      { href: "/calories", label: "Calories" },
    ],
  },
  {
    id: "heart",
    label: "Heart",
    items: [
      { href: "/resting-heart-rate", label: "Resting heart rate" },
      { href: "/hrv", label: "Heart-rate variability" },
    ],
  },
  {
    id: "body",
    label: "Body",
    items: [
      { href: "/weight", label: "Weight" },
      { href: "/skin-temperature", label: "Skin temperature" },
    ],
  },
  {
    id: "scores",
    label: "Scores",
    items: [
      { href: "/recovery", label: "Recovery" },
      { href: "/healthspan", label: "Healthspan" },
    ],
  },
  {
    id: "analysis",
    label: "Journal & analysis",
    inline: true,
    items: [
      { href: "/habits", label: "Habits" },
      { href: "/explore", label: "Explore" },
    ],
  },
];

/** Reference and account pages: the desktop ACCOUNT menu and the end of the
 * mobile menu, kept out of the health sections. */
export const SYSTEM_ITEMS: NavItem[] = [
  { href: "/data-sources", label: "Data sources" },
  { href: "/settings", label: "Account" },
];

/** Whether `pathname` is `href` or a page beneath it ("/day/2026-10-01"
 * belongs to "/day"); "/" only matches itself. */
export function isActiveHref(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export interface ActiveNav {
  group: NavGroup | null;
  item: NavItem;
}

/** The page the user is on, and the group it belongs to (null for the
 * system pages), or null on a page the nav doesn't list. */
export function findActiveNav(pathname: string): ActiveNav | null {
  for (const group of NAV_GROUPS) {
    const item = group.items.find((entry) =>
      isActiveHref(entry.href, pathname),
    );
    if (item) return { group, item };
  }
  const system = SYSTEM_ITEMS.find((entry) =>
    isActiveHref(entry.href, pathname),
  );
  return system ? { group: null, item: system } : null;
}
