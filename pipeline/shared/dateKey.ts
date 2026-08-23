const formatters = new Map<string, Intl.DateTimeFormat>();

export function dateKeyInTimeZone(instant: string | number, timeZone: string) {
  const formatter =
    formatters.get(timeZone) ??
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  formatters.set(timeZone, formatter);
  const parts = formatter.formatToParts(
    typeof instant === "number" ? new Date(instant) : new Date(instant),
  );
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
