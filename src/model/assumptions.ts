import type {
  PlanBonusOwner,
  PlanBudgetLine,
  PlanClosedDate,
  PlanLaborLine,
  PlanOffering,
  PlanPayrollTax,
  PlanRates,
  PlanRevenueCharge,
  PlanSalariedPosition,
  PlanStaffLevel,
} from "@cyc-seattle/platform/planning";

/** A plan row as the reports list it, by its `id`. */
export interface Keyed {
  key: string;
}

/** The rates the Operations Plan sets for the year, which every plan's numbers come from. */
export interface OperationsAssumptions {
  rates: Pick<PlanRates, "lodging_per_night_cents" | "mileage_rate_cents"> | null;
  /** Each payroll tax, in the plan's order: a share of wages, or an amount for each hour worked, such as L&I. */
  payrollTaxes: (Pick<PlanPayrollTax, "name" | "wage_share" | "hourly_cents"> & Keyed)[];
  /** Each staff level's rate, by role, then grade. A volunteer's is 0. */
  staffLevels: (Pick<PlanStaffLevel, "hourly_rate_cents"> & { id: string; name: string })[];
  positions: (Pick<PlanSalariedPosition, "name" | "annual_salary_cents" | "paid_hours_per_year" | "ga_share"> &
    Keyed & {
      /** What it's paid an hour to coach an offering that pays it by the hour. */
      hourly_coaching_rate_cents: number | null;
      /** The pool that takes the salary its hours don't charge to programs. */
      remainder_pool: string | null;
      /** The bonuses that pay it, which name it in `position_id`. */
      bonuses: Bonus[];
    })[];
  charges: (Pick<PlanRevenueCharge, "name" | "rate" | "product_kinds" | "note"> &
    Keyed & {
      /** Whether it counts toward MTDC. */
      in_mtdc: boolean;
      account: Account;
    })[];
  /** Each boat class's rates for the year: fuel and upkeep an hour on the water, and a day's charter. */
  boatRates: {
    key: string;
    boat_class: string;
    /** Its boat class's id, which the engine's warnings about the class name. */
    boat_class_id?: string;
    fuel_per_hour_cents: number | null;
    maintenance_per_boat_hour_cents: number;
    charter_per_day_cents: number | null;
  }[];
  /** Every plan's bonuses. */
  bonuses: Bonus[];
  fixedCosts: FixedCost[];
  staffTime: StaffTime[];
  salariedHours: SalariedHours[];
  closedDays: (Pick<PlanClosedDate, "date" | "name"> & Keyed)[];
}

/** A bonus on the net of some products, from the Operations Plan or a program area's plan. */
export type Bonus = Pick<PlanBonusOwner, "role_name" | "bonus_rate" | "basis"> &
  Keyed & {
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
export type FixedCost = Pick<PlanBudgetLine, "name" | "amount_cents" | "note"> &
  Keyed & {
    /** Whether it counts toward MTDC. */
    in_mtdc: boolean;
    account: Account;
    charged_to: string;
    revenue: boolean;
  };

/** Hourly staff time outside the programs, such as boat repairs. */
export type StaffTime = Pick<PlanLaborLine, "name" | "hours" | "note"> &
  Keyed & {
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

/** The sailors an offering plans for, as the engine counts them: its target enrollment. */
export const plannedEnrollment = (offering: Pick<PlanOffering, "target_enrollment">): number | null =>
  offering.target_enrollment;

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
