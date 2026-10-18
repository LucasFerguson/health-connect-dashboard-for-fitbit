/**
 * Phone-only (below `sm`) text bumps for the day view. The desktop design
 * uses 7.5–9px mono labels that read fine on a large screen but are too
 * small on a ~390px phone, so these lift them to at least 11px there and
 * leave desktop untouched. The shared `ui/` pieces (SectionHeader,
 * StatValue, SectionFooter) only take a wrapper `className`, hence the
 * child selectors.
 */

/** SectionHeader (size "md"): the right-hand qualifier ("RECORDED", "NOT
 * AVAILABLE"). */
export const PILLAR_HEADER_CLASS = "max-sm:[&>span:last-child]:text-[11px]";

/** SectionHeader (size "sm", panel row): the right-hand qualifier. */
export const PANEL_HEADER_CLASS = "max-sm:[&>span:last-child]:text-[11px]";

/** StatValue: the right-aligned context (sleep window, absence reason). */
export const PILLAR_STAT_CLASS =
  "my-[7px] max-sm:flex-wrap max-sm:[&>span.ml-auto]:text-[11px]";

/** SectionFooter with label/value items (DEEP/REM, HRV/RHR, STEPS/KCAL):
 * readable size, and allowed to wrap instead of squeezing. */
export const PILLAR_FOOTER_CLASS =
  "max-sm:flex-wrap max-sm:gap-x-3 max-sm:gap-y-1 max-sm:text-[11px]";

/** Bordered panel-row SectionFooter. */
export const PANEL_FOOTER_CLASS = "max-sm:text-[11px]";
