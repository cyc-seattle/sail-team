import type {
  PlanBonusOwner,
  PlanOffering,
  PlanRates,
  PlanResource,
  PlanRevenueCharge,
  PlanSalariedPosition,
  PlanStaffLevel,
} from "@cyc-seattle/platform/planning";

/** What an offering's numbers come from, as its planner entered them, and its days, which the engine counts. */
export interface OfferingAssumptions extends Pick<
  PlanOffering,
  | "key"
  | "name"
  | "starts_on"
  | "ends_on"
  | "price_cents"
  | "capacity"
  | "sailors_per_coach"
  | "min_coaches"
  | "ribs_per_coach"
  | "byob_share"
> {
  /** Its program, such as J-Pod. */
  program: string;
  /** Its coaches' pay level, from the Operations Plan. */
  coach_level: string | null;
  /** The sailors it plans for: its target, or its capacity at its fill rate. */
  enrollment: number | null;
  days: number | null;
}

/** The rates the Operations Plan sets for the year, which every plan's numbers come from. */
export interface OperationsAssumptions {
  rates: Pick<PlanRates, "payroll_tax_rate" | "lodging_per_night_cents" | "mileage_rate_cents"> | null;
  staffLevels: Pick<PlanStaffLevel, "key" | "name" | "pay_type" | "hourly_rate_cents">[];
  positions: Pick<PlanSalariedPosition, "key" | "name" | "annual_salary_cents" | "paid_hours_per_year" | "ga_share">[];
  charges: Pick<PlanRevenueCharge, "key" | "name" | "rate" | "product_kinds">[];
  resources: Pick<
    PlanResource,
    | "key"
    | "name"
    | "quantity"
    | "cost_per_hour_cents"
    | "cost_per_day_cents"
    | "fuel_per_hour_cents"
    | "maintenance_per_hour_cents"
  >[];
  boatRates: { key: string; boat_class: string; maintenance_per_boat_hour_cents: number }[];
  bonuses: Pick<PlanBonusOwner, "key" | "role_name" | "bonus_rate" | "basis">[];
}

/** A plan's assumptions: each of its offerings', and, for the Operations Plan, the year's rates. */
export interface Assumptions {
  offerings: OfferingAssumptions[];
  operations: OperationsAssumptions | null;
}

/** The sailors an offering plans for, as the engine counts them: its target, or its capacity at its fill rate. */
export function plannedEnrollment(
  offering: Pick<PlanOffering, "target_enrollment" | "capacity" | "fill_rate">,
): number | null {
  if (offering.target_enrollment !== null) {
    return offering.target_enrollment;
  }
  if (offering.capacity !== null && offering.fill_rate !== null) {
    return Math.round(offering.capacity * offering.fill_rate);
  }
  return null;
}

const percent = new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 2 });

/** A share as a percentage: `0.0525` → `5.25%`. */
export function formatShare(share: number): string {
  return percent.format(share);
}

const productKinds: Record<string, string> = {
  program: "programs",
  charter: "charters",
  storage_lease: "storage",
  merchandise: "merchandise",
  event_hosting: "event hosting",
  other: "other sales",
};

/** What a charge applies to, in words: `programs and charters`, or `everything` when it names no kinds. */
export function appliesTo(kinds: string[] | null): string {
  if (!kinds?.length) {
    return "everything";
  }
  const names = kinds.map((k) => productKinds[k] ?? k);
  return names.length <= 2 ? names.join(" and ") : `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`;
}
