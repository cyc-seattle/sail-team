/** A club plan as the list shows it: a frozen set of the club's active versions for a year. */
export interface ClubPlanSummary {
  id: string;
  organization_id: string;
  fiscal_year: number;
  name: string;
  message: string | null;
  saved_at: string | null;
}

/**
 * The newest club plan for each organization and year: the club's plan as it was last frozen. Club plans are never
 * changed, so a later one follows an earlier one.
 */
export function newestClubPlans<T extends ClubPlanSummary>(sets: T[]): Map<number, T> {
  const newest = new Map<number, T>();
  for (const set of sets) {
    const seen = newest.get(set.fiscal_year);
    if (!seen || (set.saved_at ?? "") > (seen.saved_at ?? "")) {
      newest.set(set.fiscal_year, set);
    }
  }
  return newest;
}

/** One cost or revenue line of a club plan, with its plain name and whether its account is revenue. */
export interface ClubLine {
  name: string;
  cost_center_name: string;
  amount_cents: number;
  revenue: boolean;
}

/** A line's amount as it adds to the net: revenue as it is, a cost taken away. */
export const signedCents = (line: ClubLine) => (line.revenue ? line.amount_cents : -line.amount_cents);
