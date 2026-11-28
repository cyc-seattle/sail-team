/**
 * A planning period in a Financial Plan's Operations Plan, such as Summer 2027 (cyc-seattle/platform#251). An offering
 * is in one of them, by its id, or in none.
 */
export interface Term {
  key: string;
  name: string;
  starts_on: string;
  ends_on: string;
}

/** Terms by start date, then name. */
export const byStart = (terms: Term[]) =>
  [...terms].sort((a, b) => a.starts_on.localeCompare(b.starts_on) || a.name.localeCompare(b.name));
