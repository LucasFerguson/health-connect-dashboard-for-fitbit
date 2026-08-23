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
