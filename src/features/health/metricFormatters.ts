/**
 * LEGACY — part of the old plan where this repo computed its own health
 * analytics locally. That plan has changed: a separate backend (HCGateway)
 * now owns analytics computation, and this repo is moving toward being
 * frontend-only. This file still runs for pages that haven't been migrated
 * yet (see README.md's "Architecture and data flow" section).
 *
 * Do not extend this file with new metrics, new computations, or new
 * data-processing logic. If a page needs something this doesn't already
 * provide, ask the user whether it should come from a new HCGateway API
 * endpoint instead of being built here.
 */
const integer = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });

export const kilogramsToPounds = (kilograms: number) =>
  kilograms * 2.2046226218;

export const formatSteps = (value: number) => integer.format(value);
export const formatCalories = (value: number) =>
  `${integer.format(value)} kcal`;
export const formatHeartRate = (value: number) =>
  `${integer.format(value)} bpm`;
export const formatKilograms = (value: number) => `${decimal.format(value)} kg`;
export const formatPounds = (value: number) =>
  `${decimal.format(kilogramsToPounds(value))} lb`;
export const formatWeight = (value: number) =>
  `${formatKilograms(value)} / ${formatPounds(value)}`;

export function formatDurationMinutes(value: number): string {
  const rounded = Math.round(Math.abs(value));
  const hours = Math.floor(rounded / 60);
  const minutes = rounded % 60;
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}
