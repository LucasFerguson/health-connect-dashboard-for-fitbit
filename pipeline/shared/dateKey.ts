const formatters = new Map<string, Intl.DateTimeFormat>();
const timeFormatters = new Map<string, Intl.DateTimeFormat>();

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

export function localMinuteOfDay(instant: string, timeZone: string): number {
  const formatter =
    timeFormatters.get(timeZone) ??
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
  timeFormatters.set(timeZone, formatter);
  const parts = formatter.formatToParts(new Date(instant));
  const value = (type: "hour" | "minute") =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  return value("hour") * 60 + value("minute");
}
