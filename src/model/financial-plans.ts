import type { Pnl } from "@cyc-seattle/platform/planning";

/** A Financial Plan: the organization's plan for a year, a draft or saved. */
export interface FinancialPlanSummary {
  id: string;
  organization_id: string;
  fiscal_year: number;
  name: string;
  /** Its note, a one-line comment such as "Reviewed with the board". */
  message: string | null;
  /**
   * A draft's plans change; a saved one's never do, though its name and note can. The active one is the saved one the
   * club is running this year.
   */
  status: "draft" | "saved" | "active";
  saved_at: string | null;
  saved_by: string | null;
  /** The `@cyc-seattle/platform` version that worked out its results when it was saved, such as "1.38.1+engine.<hash>". */
  platform_version: string | null;
  /** The Financial Plan it started as a copy of. */
  parent: { id: string; name: string } | null;
  /** When it was archived, which hides it from Planning's list. Never the active one. */
  archived_at: string | null;
}

/** Whether it's saved, and so never changes: saved, or saved and active. */
export const isSaved = (set: Pick<FinancialPlanSummary, "status">) => set.status !== "draft";

/** The package version a saved plan was worked out with, without the engine's hash: "1.38.1" from "1.38.1+engine.<hash>". */
export const platformRelease = (set: Pick<FinancialPlanSummary, "status" | "platform_version">) =>
  isSaved(set) && set.platform_version ? set.platform_version.split("+engine.")[0]! : null;

/** A Financial Plan as the Planning page lists it, with its totals once platform has worked them out. */
export interface ListedPlan {
  id: string;
  name: string;
  year: number;
  status: FinancialPlanSummary["status"];
  saved_at: string | null;
  /** Who saved it, by name. Null when the person looking can't read it. */
  saved_by: string | null;
  parent: { id: string; name: string } | null;
  archived: boolean;
  /** Its note, a one-line comment such as "Reviewed with the board". */
  note: string | null;
  /** The platform package's version that worked out a saved plan's results, such as "1.38.1". Null for a draft. */
  platform: string | null;
  warnings: number;
  /** Null until platform has worked them out. Operating only, leaving out fundraising and capital. */
  revenue_cents: number | null;
  expense_cents: number | null;
  net_cents: number | null;
}

/** The organization's totals in a Financial Plan: operating, fundraising, capital, and all of them together. */
export interface Totals {
  operating_revenue_cents: number;
  operating_expense_cents: number;
  operating_net_cents: number;
  fundraising_revenue_cents: number;
  fundraising_expense_cents: number;
  fundraising_net_cents: number;
  /** Spent on capital, such as a coach boat. */
  capital_cents: number;
  /** Operating net, plus fundraising net, less capital. */
  total_cents: number;
}

/** One plan in a Financial Plan, with the copy of it the Financial Plan holds. */
export interface Member {
  id: string;
  plan_id: string;
  version_id: string;
  plan_name: string;
  kind: "program_area" | "operations";
  program_area_id: string | null;
  area_name: string | null;
}

/**
 * One cost or revenue line, with its plain name, its account, whether that account is revenue, and the member it's
 * charged in.
 */
export interface PlanLine {
  /** The engine's key for it: a share of a pool's line is `pool:<pool key>:<the line's key>`. */
  key: string;
  name: string;
  account_number: string | null;
  account_name: string;
  /** What it's charged to: an offering's key, for most lines. */
  cost_center_key: string | null;
  cost_center_type: "offering" | "product" | "program_area" | "pool" | "org";
  amount_cents: number;
  revenue: boolean;
  /** On an asset account: spent on something lasting, such as a coach boat. */
  capital: boolean;
  /** What the money is for: running programs, managing the club, or fundraising. */
  function: "program" | "management" | "fundraising" | null;
  /** How the engine worked it out, such as "Guppies: hours × Level 1 Instructor's rate". */
  explanation: string | null;
  member: string | null;
}

/** One offering's, product's, or program area's P&L, with the member it's charged in. */
export interface PnlRow {
  level: Pnl["level"];
  subject_key: string;
  name: string;
  revenue_cents: number;
  expense_cents: number;
  enrollment: number;
  days: number;
  sailor_days: number;
  /** The most sailors an offering's blocks can take. Null for a product or program area. */
  allocation_holds: number | null;
  /** The fewest sailors at which an offering pays for itself. Null when it doesn't even when full. */
  breakeven_enrollment: number | null;
  member: string | null;
}

/** One of the engine's warnings, about a plan and a date when it names them. */
export interface ResultWarning {
  code: string;
  message: string;
  /** Allocation: the blocks break a limit, or run on a closed day. Data: a row is missing or wrong. */
  category: "allocation" | "data" | null;
  member: string | null;
  date: string | null;
}

/** A Financial Plan's P&L, as platform last worked it out: for a draft, after its latest change; for a saved one, once. */
/** One planned capital purchase, in the order platform ranks them, with how far the year's money goes. */
export interface CapitalResult {
  rank: number;
  /** The capital item's key, or for capital entered as a budget line, that line's. */
  key: string;
  name: string;
  amount_cents: number;
  /** Its amount and every amount ranked above it. */
  running_cents: number;
  /** Whether the operating net plus the fundraising net covers its running total. */
  funded: boolean;
}

export interface Results {
  calculated_at: string | null;
  totals: Totals;
  pnl: PnlRow[];
  lines: PlanLine[];
  warnings: ResultWarning[];
  /** None in results worked out before capital was ranked. */
  capital: CapitalResult[];
}

/** How long a Financial Plan's numbers may be missing before the page says they couldn't be worked out. */
export const stuckAfterMs = 30_000;

/**
 * How often to read a Financial Plan again, in milliseconds, or false not to. Platform works out a draft's numbers
 * about a second after each change, wherever it's made, so a draft is read again every few seconds, and one whose
 * numbers are missing sooner, until they arrive. A saved one's numbers never change once they're in.
 */
export function refreshEvery(
  plan: { set: Pick<FinancialPlanSummary, "status">; results: Results | null } | null | undefined,
  stuck: boolean,
): number | false {
  if (!plan) {
    return false;
  }
  if (!plan.results) {
    return stuck ? 5_000 : 2_000;
  }
  return isSaved(plan.set) ? false : 5_000;
}
