"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/day", label: "Day" },
  { href: "/", label: "Overview" },
  { href: "/sleep", label: "Sleep" },
  { href: "/sleep-debt", label: "Sleep debt" },
  { href: "/sleep-consistency", label: "Consistency" },
  { href: "/steps", label: "Steps" },
  { href: "/calories", label: "Calories" },
  { href: "/resting-heart-rate", label: "Heart" },
  { href: "/weight", label: "Weight" },
  { href: "/healthspan", label: "Healthspan" },
  { href: "/data-sources", label: "Data sources" },
];

export function AppNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary navigation"
      className="sticky top-0 z-50 border-b border-white/10 bg-[#111226]/90 text-white shadow-2xl shadow-black/20 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-5 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-bold">
          <span className="grid size-8 place-items-center rounded-xl bg-violet-500 text-sm shadow-lg shadow-violet-500/25">
            H
          </span>
          <span className="hidden sm:inline">Healthboard</span>
        </Link>
        <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                className={`shrink-0 rounded-lg px-3 py-2 text-sm transition ${
                  active
                    ? "bg-white/12 font-semibold text-white"
                    : "text-white/55 hover:bg-white/7 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
