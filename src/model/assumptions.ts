import type {
  PlanBonusOwner,
  PlanOffering,
  PlanRates,
  PlanResource,
  PlanRevenueCharge,
  PlanSalariedPosition,
  PlanStaffLevel,
} from "@cyc-seattle/platform/planning";

/** The rates the Operations Plan sets for the year, which every plan's numbers come from. */
export interface OperationsAssumptions {
  rates: Pick<PlanRates, "payroll_tax_rate" | "lodging_per_night_cents" | "mileage_rate_cents"> | null;
  staffLevels: Pick<PlanStaffLevel, "key" | "name" | "pay_type" | "hourly_rate_cents">[];
  positions: (Pick<
    PlanSalariedPosition,
    "key" | "name" | "annual_salary_cents" | "paid_hours_per_year" | "ga_share"
  > & {
    /** The bonuses that pay it, which name it in `position_key`. */
    bonuses: Bonus[];
  })[];
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
  /** Each boat class's upkeep, and how many the club has and sailors each takes, which the engine checks blocks against. */
  boatRates: {
    key: string;
    boat_class: string;
    maintenance_per_boat_hour_cents: number;
    quantity: number | null;
    sailors_per_boat: number | null;
  }[];
  /** Bonuses that pay no salaried position. */
  bonuses: Bonus[];
}

/** A bonus on the net of some products, from the Operations Plan or a program area's plan. */
export type Bonus = Pick<PlanBonusOwner, "key" | "role_name" | "bonus_rate" | "basis">;

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
