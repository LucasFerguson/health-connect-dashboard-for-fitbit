"use client";

import {
  createContext,
  useContext,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";

interface DayNavigation {
  goTo: (date: string) => void;
  goToToday: () => void;
  isPending: boolean;
  /** The date being loaded, or null for TODAY (its date isn't known until
   * `/day` redirects) and when nothing is loading. */
  pendingDate: string | null;
}

const DayNavigationContext = createContext<DayNavigation | null>(null);

/**
 * One shared transition for every way of changing day (stepper, calendar,
 * TODAY, day strip, arrow keys). The route has no `loading.tsx`, so while
 * the next day loads Next keeps this page on screen: the header shows the
 * picked date straight away and `PendingDim` fades the content under it.
 */
export function DayNavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingDate, setPendingDate] = useState<string | null>(null);

  const goTo = (date: string) => {
    setPendingDate(date);
    startTransition(() => {
      router.push(`/day/${date}`);
    });
  };
  const goToToday = () => {
    setPendingDate(null);
    startTransition(() => {
      router.push("/day");
    });
  };

  return (
    <DayNavigationContext.Provider
      value={{
        goTo,
        goToToday,
        isPending,
        pendingDate: isPending ? pendingDate : null,
      }}
    >
      {children}
    </DayNavigationContext.Provider>
  );
}

export function useDayNavigation(): DayNavigation {
  const navigation = useContext(DayNavigationContext);
  if (!navigation) {
    throw new Error("useDayNavigation needs a DayNavigationProvider");
  }
  return navigation;
}

/** Fades the day's content while another day loads, so it's clear the
 * numbers on screen are about to change. */
export function PendingDim({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const { isPending } = useDayNavigation();
  return (
    <div
      aria-busy={isPending}
      className={clsx(
        "transition-opacity duration-150 ease-out",
        isPending && "opacity-45",
        className,
      )}
    >
      {children}
    </div>
  );
}
