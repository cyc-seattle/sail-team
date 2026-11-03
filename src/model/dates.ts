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
