"use client";

import type { ReactNode } from "react";
import { Menu as BaseMenu } from "@base-ui/react/menu";
import { clsx } from "clsx";
import { DropdownTrigger } from "~/components/ui/DropdownTrigger";
import { notchStyle } from "~/components/ui/notch";

export interface MenuOption {
  /** The option's display label, e.g. "00:00". */
  label: string;
  /** Called when the option is selected. Optional — an option with no
   * `onSelect` still renders and closes the menu when clicked, useful for
   * a placeholder list that isn't wired to real behavior yet. */
  onSelect?: () => void;
}

export interface MenuProps {
  /** The trigger's visible content, e.g. "DAY START 00:00". A trailing
   * caret is appended automatically — don't include one yourself. */
  trigger: ReactNode;
  /** Native `title` tooltip forwarded to the trigger button, matching how
   * `DropdownTrigger` is used elsewhere for "not wired up yet" hints. */
  triggerTitle?: string;
  options: MenuOption[];
  /** Notch size in px forwarded to the trigger chrome. See
   * `DropdownTrigger`'s own default. */
  notchSize?: number;
}

/**
 * A styled wrapper around Base UI's `Menu` (root/trigger/portal/positioner/
 * popup/item), using `DropdownTrigger` as the trigger chrome via Base UI's
 * `render` composition prop so the open/closed button looks identical to
 * the other context-bar dropdowns. Popup styling targets Base UI's
 * `data-open`/`data-closed`/`data-starting-style`/`data-ending-style`
 * attributes directly (see `popupStateMapping` in `@base-ui/react`) rather
 * than the `data-[state=open]` convention some other headless libraries use.
 */
export function Menu({ trigger, triggerTitle, options, notchSize = 7 }: MenuProps) {
  return (
    <BaseMenu.Root>
      <BaseMenu.Trigger
        title={triggerTitle}
        render={
          // `render`'s element is only used as a template for merging props
          // (className/style/etc.) — Base UI overwrites `children` with the
          // `<BaseMenu.Trigger>` children below, so this placeholder is
          // never actually shown; it exists to satisfy DropdownTriggerProps.
          <DropdownTrigger notchSize={notchSize}>{trigger}</DropdownTrigger>
        }
      >
        {trigger} <span className="text-ink-200">▾</span>
      </BaseMenu.Trigger>
      <BaseMenu.Portal>
        <BaseMenu.Positioner sideOffset={4} align="start">
          <BaseMenu.Popup
            className={clsx(
              "border-ink-500 bg-ink-800 flex min-w-[120px] flex-col border py-1",
              "data-[starting-style]:opacity-0 data-[ending-style]:opacity-0",
              "transition-opacity duration-[120ms] ease-out",
            )}
            style={notchStyle(7)}
          >
            {options.map((option) => (
              <BaseMenu.Item
                key={option.label}
                onClick={option.onSelect}
                className={clsx(
                  "text-ink-100 data-[highlighted]:bg-ink-700 data-[highlighted]:text-ink-0",
                  "cursor-pointer px-[10px] py-[6px] font-mono text-[9.5px] tracking-[.06em] outline-none",
                  "transition-colors duration-[120ms] ease-out",
                )}
              >
                {option.label}
              </BaseMenu.Item>
            ))}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}
