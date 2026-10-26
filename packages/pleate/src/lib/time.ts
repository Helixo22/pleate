// Small time helpers for lists of events (notifications, sessions, keys): relative "5 minutes ago" text, calendar
// "today" checks and a short date, all through Intl so they follow the locale.

export type DateInput = Date | string | number;

export const toDate = (value: DateInput) => (value instanceof Date ? value : new Date(value));

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31536000],
  ["month", 2592000],
  ["week", 604800],
  ["day", 86400],
  ["hour", 3600],
  ["minute", 60],
];

/** "5 minutes ago", "yesterday", "in 3 days" (Intl.RelativeTimeFormat, numeric: "auto"). Under a minute: "now". */
export function formatTimeAgo(value: DateInput, { now = new Date(), locale }: { now?: Date; locale?: string } = {}) {
  const seconds = (toDate(value).getTime() - now.getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return rtf.format(0, "second");
}

export const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** "Mar 4, 2026" style short date. */
export function formatShortDate(value: DateInput, locale?: string) {
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(toDate(value));
}
