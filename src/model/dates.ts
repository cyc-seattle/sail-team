const day = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "America/Los_Angeles",
});

/** A timestamp as the club writes a date, in Seattle's time: `March 3, 2027`. Empty for none. */
export function formatDate(timestamp: string | null): string {
  return timestamp ? day.format(new Date(timestamp)) : "";
}

const moment = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/Los_Angeles",
});

/** A timestamp to the minute, in Seattle's time: `March 3 at 4:05 PM`. Empty for none. */
export function formatMoment(timestamp: string | null): string {
  return timestamp ? moment.format(new Date(timestamp)) : "";
}

const calendarDay = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

/** A day, given as `YYYY-MM-DD`: `Jun 1, 2026`. */
export const formatDay = (date: string) => calendarDay.format(new Date(`${date}T00:00:00Z`));

/** A span of days, given as `YYYY-MM-DD`: `Jun 1, 2026 to Aug 14, 2026`. Either end may be missing. */
export function formatDays(from: string | null, to: string | null): string {
  if (from && to) {
    return `${formatDay(from)} to ${formatDay(to)}`;
  }
  if (from) {
    return `From ${formatDay(from)}`;
  }
  return to ? `Until ${formatDay(to)}` : "";
}
