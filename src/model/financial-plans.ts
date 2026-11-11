import type { Pnl } from "@cyc-seattle/platform/planning";

/** A Financial Plan: the organization's plan for a year, a draft or saved. */
export interface FinancialPlanSummary {
  id: string;
  organization_id: string;
  fiscal_year: number;
  name: string;
  /** Its note, such as "Reviewed with the board", or the planning agent's report on what it did. */
  message: string | null;
  /**
   * A draft's plans change; a saved one's never do, though its name and note can. The active one is the saved one the
   * club is running this year.
   */
  status: "draft" | "saved" | "active";
  saved_at: string | null;
  saved_by: string | null;
  /** The Financial Plan it started as a copy of. */
  parent: { id: string; name: string } | null;
}

/** Whether it's saved, and so never changes: saved, or saved and active. */
export const isSaved = (set: Pick<FinancialPlanSummary, "status">) => set.status !== "draft";

/** A Financial Plan as the Planning page lists it, with its operating totals once platform has worked them out. */
export interface ListedPlan {
  id: string;
  name: string;
  year: number;
  status: FinancialPlanSummary["status"];
  saved_at: string | null;
  /** Who saved it, by name. Null when the person looking can't read it. */
  saved_by: string | null;
  parent: { id: string; name: string } | null;
  /** Its note. For a draft from the planning agent, the agent's report on what it did and what's left. */
  note: string | null;
  warnings: number;
  /** Null until platform has worked them out. */
  revenue_cents: number | null;
  expense_cents: number | null;
  net_cents: number | null;
}

/** The organization's operating totals in a Financial Plan, leaving out fundraising and capital. */
export interface Totals {
  operating_revenue_cents: number;
  operating_expense_cents: number;
  operating_net_cents: number;
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
  amount_cents: number;
  revenue: boolean;
  /** On an asset account: spent on something lasting, such as a coach boat. */
  capital: boolean;
  /** What the money is for: running programs, managing the club, or fundraising. */
  function: "program" | "management" | "fundraising" | null;
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
  member: string | null;
}

/** One of the engine's warnings, about a plan and a date when it names them. */
export interface ResultWarning {
  code: string;
  message: string;
  category: "allocation" | "data";
  member: string | null;
  date: string | null;
}

/** A Financial Plan's P&L, as platform last worked it out: for a draft, after its latest change; for a saved one, once. */
export interface Results {
  calculated_at: string | null;
  totals: Totals;
  pnl: PnlRow[];
  lines: PlanLine[];
  warnings: ResultWarning[];
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
