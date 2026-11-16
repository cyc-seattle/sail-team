// The engine's warnings grouped by kind, for the warnings section.
import type { PlanWarning } from "./reports.ts";

// Platform names each kind only by its code (`plan_result_warnings.code`), so the app names them.
const kinds: Record<string, string> = {
  area_on_non_program: "Non-program product with a program area",
  block_date_mismatch: "Activity in a block on another day",
  bonus_outside_area: "Bonus on another program area's product",
  bonus_without_offerings: "Bonus with no offerings",
  bonus_without_revenue: "Bonus on offerings with no revenue",
  booking_cost_center: "Booking without one product or program area",
  capital_not_asset: "Capital not on an asset account",
  capital_off_org: "Capital outside the Operations Plan",
  capital_unranked: "Capital not on the ranked list",
  closed_date: "On a closed day",
  closed_date_in_area_plan: "Closed day in a program area's plan",
  cost_off_programs: "Cost moved off the area's programs",
  many_rates: "More than one set of rates",
  no_charter_rate: "Chartered boats with no charter rate",
  no_cost_account: "Cost with no account",
  // Saved before platform counted boats from its asset list (cyc-seattle/platform#126).
  no_fleet_quantity: "Boats with no count",
  no_hourly_rate: "Position with no hourly rate",
  no_indirect_cost_rate: "Program with no indirect cost rate",
  no_mtdc: "No offering counts toward MTDC",
  no_paid_hours: "Position with no paid hours per year",
  no_paid_hours_for_tax: "Payroll tax by the hour on a position with no paid hours",
  no_program_settings: "Program with no staff level or sailors per coach",
  no_rate: "Trip rate missing",
  no_revenue_account: "Product with no revenue account",
  no_shared_costs: "No shared costs",
  no_max_capacity: "Boat class with no max capacity",
  // Saved before platform renamed it no_max_capacity.
  no_sailors_per_boat: "Boat class with no sailors per boat",
  offering_in_wrong_plan: "Offering in the wrong plan",
  over_capacity: "Too many sailors",
  over_inventory_boats: "More boats out than there are",
  // Saved before platform counted coach boats by boat class.
  over_inventory_resource: "More equipment out than there is",
  payroll_tax_basis: "Payroll tax with no clear basis",
  position_double_booked: "Coach in two places at once",
  position_overbooked: "Position charged more than its salary",
  pool_without_offerings: "Shared cost with no offerings",
  product_without_offerings: "Product with no offerings",
  program_area_without_offerings: "Program area with no offerings",
  program_without_area: "Program with no program area",
  revenue_account_differs: "Product's own revenue account not used",
  short_of_boats: "Too few boats",
  trip_without_staff: "Trip with no staff",
  unallocated_activity: "Activity with no staff",
  unknown_block: "Missing block",
  unknown_cost_center: "Line on something missing",
  unknown_offering: "Missing offering",
  unknown_position: "Missing salaried position",
  unknown_product: "Missing product",
  unknown_resource: "Missing resource",
  unknown_staff_level: "Staff level with no rate",
};

/** What a kind of warning is called, or its code in words for a kind the app doesn't know yet. */
export function kindName(code: string): string {
  const words = code.replaceAll("_", " ");
  return kinds[code] ?? words.charAt(0).toUpperCase() + words.slice(1);
}

export interface WarningKind {
  code: string;
  name: string;
  warnings: PlanWarning[];
}

export interface WarningCategory {
  name: string;
  kinds: WarningKind[];
}

/**
 * Warnings by category, Schedule before Data, then by kind, the most common first, each kind's warnings by date. A
 * warning about no one date, such as a missing rate, comes first.
 */
export function warningsByKind(warnings: PlanWarning[]): WarningCategory[] {
  const sorted = [...warnings].sort(
    (a, b) => (a.date ?? "").localeCompare(b.date ?? "") || a.area.localeCompare(b.area),
  );
  const categories = [
    { name: "Schedule", own: sorted.filter((w) => w.category === "allocation") },
    { name: "Data", own: sorted.filter((w) => w.category !== "allocation") },
  ];
  return categories
    .filter((c) => c.own.length > 0)
    .map(({ name, own }) => ({
      name,
      kinds: [...new Set(own.map((w) => w.code))]
        .map((code) => ({ code, name: kindName(code), warnings: own.filter((w) => w.code === code) }))
        .sort((a, b) => b.warnings.length - a.warnings.length || a.name.localeCompare(b.name)),
    }));
}

/** Where a warning shows in place: on a calendar day, on its program, or only in the plan's list of every warning. */
export type WarningPlace = "day" | "program" | "list";

// About a program's settings or its product, named by the product's id.
const programCodes = new Set([
  "no_indirect_cost_rate",
  "program_without_area",
  "revenue_account_differs",
  "no_revenue_account",
  "product_without_offerings",
]);
// About a block, a trip, or an activity, on its date, though they're data.
const dayCodes = new Set(["no_charter_rate", "trip_without_staff", "no_program_settings"]);

export function placeOf(w: PlanWarning): WarningPlace {
  if (w.date && w.area !== "non-program" && (w.category === "allocation" || dayCodes.has(w.code))) {
    return "day";
  }
  if (w.subject && programCodes.has(w.code)) {
    return "program";
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
