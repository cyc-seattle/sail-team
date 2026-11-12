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
  capital_off_org: "Capital outside the Operations Plan",
  closed_date: "On a closed day",
  closed_date_in_area_plan: "Closed day in a program area's plan",
  many_rates: "More than one set of rates",
  no_cost_account: "Cost with no account",
  no_fleet_quantity: "Boats with no count",
  no_hourly_rate: "Position with no hourly rate",
  no_mtdc: "No offering counts toward MTDC",
  no_paid_hours: "Position with no paid hours per year",
  no_program_settings: "Program with no staff level or sailors per coach",
  no_rate: "Trip rate missing",
  no_revenue_account: "Product with no revenue account",
  no_sailors_per_boat: "Boat class with no sailors per boat",
  offering_in_wrong_plan: "Offering in the wrong plan",
  over_capacity: "Too many sailors",
  over_inventory_boats: "More boats out than there are",
  over_inventory_resource: "More equipment out than there is",
  position_double_booked: "Coach in two places at once",
  position_overbooked: "Position charged more than its salary",
  program_without_area: "Program with no program area",
  revenue_account_differs: "Product's own revenue account not used",
  trip_without_staff: "Trip with no staff",
  unallocated_activity: "Activity with no staff",
  unknown_block: "Missing block",
  unknown_cost_center: "Line on something missing",
  unknown_offering: "Missing offering",
  unknown_position: "Missing salaried position",
  unknown_product: "Missing product",
  unknown_resource: "Missing resource",
  unknown_staff_level: "Missing staff level",
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
