import type { CSSProperties } from "react";

/**
 * The clipped-corner motif: a 45° notch on the bottom-right corner, used on
 * nearly every card and control in the design system.
 *
 * Sizes observed in the spec: 6px (chips, logo mark), 7px (context-bar
 * dropdown buttons), 8px (range selector), 15px (pillar/panel cards), 16px
 * (timeline card).
 */
export function notchClipPath(sizePx: number): string {
  return `polygon(0 0, 100% 0, 100% calc(100% - ${sizePx}px), calc(100% - ${sizePx}px) 100%, 0 100%)`;
}

/**
 * Returns a style object applying the notch clip-path, ready to spread onto
 * an element's `style` prop (or merge with other inline styles).
 */
export function notchStyle(sizePx: number): CSSProperties {
  return { clipPath: notchClipPath(sizePx) };
}
