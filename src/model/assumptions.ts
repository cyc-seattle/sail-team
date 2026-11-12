import type {
  PlanBonusOwner,
  PlanBudgetLine,
  PlanClosedDate,
  PlanLaborLine,
  PlanOffering,
  PlanRates,
  PlanResource,
  PlanRevenueCharge,
  PlanSalariedPosition,
  PlanStaffLevel,
} from "@cyc-seattle/platform/planning";

/** The rates the Operations Plan sets for the year, which every plan's numbers come from. */
export interface OperationsAssumptions {
  rates:
    | (Pick<PlanRates, "payroll_tax_rate" | "lodging_per_night_cents" | "mileage_rate_cents"> & {
        /** The kind of equipment whose rates price coach boat (RIB) hours. */
        rib_kind: string | null;
      })
    | null;
  staffLevels: Pick<PlanStaffLevel, "key" | "name" | "pay_type" | "hourly_rate_cents">[];
  positions: (Pick<
    PlanSalariedPosition,
    "key" | "name" | "annual_salary_cents" | "paid_hours_per_year" | "ga_share"
  > & {
    /** What it's paid an hour to coach an offering that pays it by the hour. */
    hourly_coaching_rate_cents: number | null;
    /** The pool that takes the salary its hours don't charge to programs. */
    remainder_pool: string | null;
    /** The bonuses that pay it, which name it in `position_key`. */
    bonuses: Bonus[];
  })[];
  charges: (Pick<PlanRevenueCharge, "key" | "name" | "rate" | "product_kinds" | "excluded_from_mtdc" | "note"> & {
    account: Account;
  })[];
  resources: Pick<
    PlanResource,
    | "key"
    | "name"
    | "quantity"
    | "cost_per_hour_cents"
    | "cost_per_day_cents"
    | "fuel_per_hour_cents"
    | "maintenance_per_hour_cents"
    | "excluded_from_mtdc"
  >[];
  /** Each boat class's upkeep, and how many the club has and sailors each takes, which the engine checks blocks against. */
  boatRates: {
    key: string;
    boat_class: string;
    maintenance_per_boat_hour_cents: number;
    quantity: number | null;
    sailors_per_boat: number | null;
  }[];
  /** Every plan's bonuses. */
  bonuses: Bonus[];
  fixedCosts: FixedCost[];
  staffTime: StaffTime[];
  salariedHours: SalariedHours[];
  closedDays: Pick<PlanClosedDate, "key" | "date" | "name">[];
}

/** A bonus on the net of some products, from the Operations Plan or a program area's plan. */
export type Bonus = Pick<PlanBonusOwner, "key" | "role_name" | "bonus_rate" | "basis"> & {
  /** The products whose net it's a share of. */
  products: string[];
  account: Account;
  /** The salaried position it pays, if any. */
  position: string | null;
};

/**
 * A budget line, with what it's charged to: a pool, an offering, a product, a program area, or CSC. Most are fixed
 * costs or G&A; one on a revenue account, such as a gala's gifts, is revenue.
 */
export type FixedCost = Pick<PlanBudgetLine, "key" | "name" | "amount_cents" | "excluded_from_mtdc" | "note"> & {
  account: Account;
  charged_to: string;
  revenue: boolean;
};

/** Hourly staff time outside the programs, such as boat repairs. */
export type StaffTime = Pick<PlanLaborLine, "key" | "name" | "hours" | "note"> & {
  staff_level: string | null;
  account: Account;
  charged_to: string;
};

/** Hours of a salaried position booked to a program or a program area. */
export interface SalariedHours {
  key: string;
  position: string;
  /** The program or program area. */
  booked_to: string;
  hours: number;
}

/** An account in the chart of accounts. */
export interface Account {
  number: string | null;
  name: string;
}

/** An account as people know it: its number and name. */
export const accountName = (a: Account) => (a.number ? `${a.number} ${a.name}` : a.name);

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
