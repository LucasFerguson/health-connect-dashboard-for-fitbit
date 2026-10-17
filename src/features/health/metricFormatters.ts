/**
 * Display formatting for metric values, shared by the dashboard cards, the
 * metric detail pages and the day view. Formatting only — unit conversion
 * here (kg → lb) is for labels, never fed back into analytics.
 */
const integer = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });

const kilogramsToPounds = (kilograms: number) => kilograms * 2.2046226218;

export const formatSteps = (value: number) => integer.format(value);
export const formatCalories = (value: number) =>
  `${integer.format(value)} kcal`;
export const formatHeartRate = (value: number) =>
  `${integer.format(value)} bpm`;
export const formatHrv = (value: number) => `${integer.format(value)} ms`;

const tenths = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/**
 * A skin-temperature *deviation* from the wearer's baseline, always signed:
 * "+0.3 °C", "−0.2 °C". A value that rounds to zero reads "0.0 °C" with no
 * sign. Never use this for an absolute temperature.
 */
export function formatTemperatureDeviation(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "";
  return `${sign}${tenths.format(Math.abs(rounded))} °C`;
}

const hundredths = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2,
});

/** Axis-tick form of `formatTemperatureDeviation`: up to two decimals, so
 * ticks 0.05 apart stay distinct ("+0.05 °C", "+0.1 °C"). */
export function formatTemperatureDeviationTick(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "";
  return `${sign}${hundredths.format(Math.abs(rounded))} °C`;
}

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
