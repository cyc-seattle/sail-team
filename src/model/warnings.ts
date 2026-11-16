// The engine's warnings grouped by kind, for the warnings section.
import type { PlanWarning } from "./reports.ts";

// Platform names each kind only by its code (`plan_result_warnings.code`), so the app names them, in a few words.
const kinds: Record<string, string> = {
  area_on_non_program: "Not a program, but in an area",
  block_date_mismatch: "Block on another day",
  bonus_outside_area: "Bonus outside its area",
  bonus_without_offerings: "Bonus with no offerings",
  bonus_without_revenue: "Bonus with no revenue",
  booking_cost_center: "Booking with no product or area",
  breakeven_above_target: "Breaks even above target",
  capital_not_asset: "Capital not on an asset account",
  capital_off_org: "Capital charged to an area",
  capital_unranked: "Capital not ranked",
  closed_date: "On a closed day",
  closed_date_in_area_plan: "Closed day in an area's plan",
  cost_off_programs: "Cost moved off programs",
  many_rates: "More than one set of rates",
  never_breaks_even: "Never breaks even",
  no_charter_rate: "No charter rate",
  no_cost_account: "No account for a cost",
  // Saved before platform counted boats from its asset list (cyc-seattle/platform#126).
  no_fleet_quantity: "No boat count",
  no_hourly_rate: "No hourly rate",
  no_indirect_cost_rate: "No indirect cost rate",
  no_max_capacity: "No max capacity",
  no_mtdc: "Nothing counts toward MTDC",
  no_paid_hours: "No paid hours",
  no_paid_hours_for_tax: "No paid hours for a tax",
  no_program_settings: "No program settings",
  no_rate: "Rate missing",
  no_revenue_account: "No revenue account",
  no_shared_costs: "No shared costs",
  // Saved before platform renamed it no_max_capacity.
  no_sailors_per_boat: "No sailors per boat",
  offering_in_wrong_plan: "Offering in the wrong plan",
  over_capacity: "Too many sailors",
  over_inventory_boats: "More boats than there are",
  // Saved before platform counted coach boats by boat class.
  over_inventory_resource: "More equipment than there is",
  payroll_tax_basis: "Payroll tax unclear",
  pool_without_offerings: "Shared cost with no offerings",
  position_double_booked: "Coach double-booked",
  position_overbooked: "Salary overbooked",
  product_without_offerings: "Product with no offerings",
  program_area_without_offerings: "Area with no offerings",
  program_without_area: "Program with no area",
  revenue_account_differs: "Revenue account ignored",
  short_of_boats: "Too few boats",
  trip_without_staff: "Trip with no staff",
  unallocated_activity: "Activity with no staff",
  unknown_block: "Missing block",
  unknown_cost_center: "Charged to something missing",
  unknown_offering: "Missing offering",
  unknown_position: "Missing position",
  unknown_product: "Missing product",
  unknown_resource: "Missing resource",
  unknown_staff_level: "Staff level with no rate",
};

/** What a kind of warning is called, or its code in words for a kind the app doesn't know yet. */
export function kindName(code: string): string {
  const words = code.replaceAll("_", " ");
  return kinds[code] ?? words.charAt(0).toUpperCase() + words.slice(1);
}

/** Where a warning also shows in place: on a calendar day, its program, its offering, or only in the warnings table. */
export type WarningPlace = "day" | "program" | "offering" | "list";

// About a program's settings or its product, named by the product's id.
const programCodes = new Set([
  "no_indirect_cost_rate",
  "program_without_area",
  "revenue_account_differs",
  "no_revenue_account",
  "product_without_offerings",
]);
// About an offering's break even, named by the offering's key.
const offeringCodes = new Set(["breakeven_above_target", "never_breaks_even"]);
// About a block, a trip, or an activity, on its date, though they're data.
const dayCodes = new Set(["no_charter_rate", "trip_without_staff", "no_program_settings"]);

export function placeOf(w: PlanWarning): WarningPlace {
  if (w.date && w.area !== "non-program" && (w.category === "allocation" || dayCodes.has(w.code))) {
    return "day";
  }
  if (w.subject && programCodes.has(w.code)) {
    return "program";
  }
  if (w.subject && offeringCodes.has(w.code)) {
    return "offering";
  }
  return "list";
}

/** Each problem once: the engine repeats one about boats in every plan whose blocks it counts. */
export function distinct(warnings: PlanWarning[]): PlanWarning[] {
  const seen = new Set<string>();
  return warnings.filter((w) => {
    const id = [w.code, w.date, w.subject, w.message].join("|");
    if (seen.has(id)) {
      return false;
    }
    seen.add(id);
    return true;
  });
}

/** Errors first, then by date, a warning about no one date first. */
export const bySeverity = (a: PlanWarning, b: PlanWarning) =>
  (a.severity === b.severity ? 0 : a.severity === "error" ? -1 : 1) || (a.date ?? "").localeCompare(b.date ?? "");

/** The worst severity among them, or null when there are none. */
export const worstOf = (warnings: PlanWarning[]) =>
  warnings.length === 0 ? null : warnings.some((w) => w.severity === "error") ? "error" : "warning";

/** How many errors and warnings, in words: "1 error, 5 warnings". */
export function warningCount(warnings: PlanWarning[]): string {
  const errors = warnings.filter((w) => w.severity === "error").length;
  const rest = warnings.length - errors;
  return [
    errors > 0 && `${errors} ${errors === 1 ? "error" : "errors"}`,
    rest > 0 && `${rest} ${rest === 1 ? "warning" : "warnings"}`,
  ]
    .filter(Boolean)
    .join(", ");
}
