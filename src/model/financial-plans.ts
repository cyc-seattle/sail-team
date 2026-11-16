import type { Pnl } from "@cyc-seattle/platform/planning";
import { formatDay } from "./dates.ts";

/** A Financial Plan: the organization's plan for a year, a draft or frozen. */
export interface FinancialPlanSummary {
  id: string;
  organization_id: string;
  fiscal_year: number;
  name: string;
  /** Its note, a one-line comment such as "Reviewed with the board": at most 280 characters, inline markdown. */
  note: string | null;
  /** A draft's plans change; a frozen one's never do, though its name, note, and active date can. */
  status: "draft" | "frozen";
  /**
   * The day a Plan Admin made it active from, or none. The plan in force on a day is the one for its year with
   * the latest date on or before it (cyc-seattle/platform#251). A draft can be active.
   */
  effective_from: string | null;
  frozen_at: string | null;
  frozen_by: string | null;
  /** The Financial Plan it started as a copy of. */
  parent: { id: string; name: string } | null;
  /** When it was archived, which hides it from Planning's list. Never the plan in force. */
  archived_at: string | null;
}

/** Whether it's frozen, and so never changes. */
export const isFrozen = (set: Pick<FinancialPlanSummary, "status">) => set.status === "frozen";

/** When a Financial Plan is in force: now, from a later date, or over a span that's past. */
export interface InForce {
  when: "now" | "later" | "past";
  /** The day it's active from, as `YYYY-MM-DD`. */
  from: string;
  /** The last day it's in force, the day before the next plan's date, or none while no later plan is dated. */
  to: string | null;
}

/**
 * When a plan is active, in words: "Since Jul 1, 2026", "From Sep 1, 2026", "Mar 1, 2026 to Jun 30, 2026". Beside a
 * plan's name, `activeText` says "Active" first.
 */
export function inForceText({ when, from, to }: InForce): string {
  if (when === "later") {
    return `From ${formatDay(from)}`;
  }
  return when === "past" ? `${formatDay(from)} to ${formatDay(to!)}` : `Since ${formatDay(from)}`;
}

/** "Active since Jul 1, 2026", "Active from Sep 1, 2026", "Active Mar 1, 2026 to Jun 30, 2026". */
export const activeText = (inForce: InForce) => {
  const text = inForceText(inForce);
  return `Active ${inForce.when === "past" ? text : text[0]!.toLowerCase() + text.slice(1)}`;
};

/** The day before `date`, both as `YYYY-MM-DD`. */
function dayBefore(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Today in Seattle, as `YYYY-MM-DD`. */
export const today = (now = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(now);

type Dated = { id: string; organization_id: string; fiscal_year: number; effective_from: string | null };

/**
 * When each of these Financial Plans is in force, by id, on `day`. Within an organization's year, a plan with a date is
 * in force from it until the next plan's date. Platform works the same out in its `planInForce`.
 */
export function inForce(sets: Dated[], day: string): Map<string, InForce> {
  const result = new Map<string, InForce>();
  const years = new Map<string, Dated[]>();
  for (const set of sets) {
    if (set.effective_from == null) {
      continue;
    }
    const year = `${set.organization_id}|${set.fiscal_year}`;
    years.set(year, [...(years.get(year) ?? []), set]);
  }
  for (const dated of years.values()) {
    const ordered = [...dated].sort((a, b) => a.effective_from!.localeCompare(b.effective_from!));
    ordered.forEach((set, i) => {
      const from = set.effective_from!;
      const next = ordered[i + 1]?.effective_from ?? null;
      const when = from > day ? "later" : next !== null && next <= day ? "past" : "now";
      result.set(set.id, { when, from, to: next === null ? null : dayBefore(next) });
    });
  }
  return result;
}

/** The release a plan's results were worked out with, without the engine's hash: "3.0.0" from "3.0.0+engine.<hash>". */
export const platformRelease = (version: string | null) => (version ? version.split("+engine.")[0]! : null);

/** The hash of the engine's code in a version, which changes only when the engine does, whatever the release. */
const engineHash = (version: string | null) => version?.split("+engine.")[1] ?? null;

/** A Financial Plan as the Planning page lists it, with its totals once platform has worked them out. */
export interface ListedPlan {
  id: string;
  name: string;
  year: number;
  status: FinancialPlanSummary["status"];
  /** When it's in force, or null when it's never been made active. */
  in_force: InForce | null;
  frozen_at: string | null;
  /** Who froze it, by name. Null when the person looking can't read it. */
  frozen_by: string | null;
  parent: { id: string; name: string } | null;
  archived: boolean;
  /** Its note, a one-line comment such as "Reviewed with the board", in inline Markdown, so it can link. */
  note: string | null;
  /** The release that worked out its results, draft or frozen, such as "3.0.0". Null until it has some that record one. */
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

/** One plan in a Financial Plan: its Operations Plan, or a program area's Program Plan. */
export interface Plan {
  id: string;
  kind: "program_area" | "operations";
  program_area_id: string | null;
  area_name: string | null;
  /** Short notes for the planning agent, each in inline markdown. */
  notes: string[] | null;
}

/**
 * One cost or revenue line, with its plain name, its account, whether that account is revenue, and the plan it's
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
  /** How the engine worked it out, such as "Guppies: hours × Instructor's rate". */
  explanation: string | null;
  plan: string | null;
}

/** The term a row is for, as it was when platform worked the row out. All null for offerings in no term. */
export interface ResultTerm {
  /** The Operations Plan's key for it. */
  term_key: string | null;
  /** Such as Summer 2027. */
  term_name: string | null;
  term_starts_on: string | null;
}

/**
 * One offering's, product's, or program area's P&L, with the plan it's charged in. A `program_area_term` row is an
 * area's offerings in one term, or in none.
 */
export interface PnlRow extends ResultTerm {
  level: Pnl["level"] | "program_area_term";
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
  plan: string | null;
}

/** One of the engine's warnings, about a plan and a date when it names them. */
export interface ResultWarning {
  code: string;
  message: string;
  /** Allocation: the blocks break a limit, or run on a closed day. Data: a row is missing or wrong. */
  category: "allocation" | "data" | null;
  /** Error: the plan can't run as allocated for the sailors expected. None in results from before platform set it. */
  severity: "warning" | "error" | null;
  /** The key of the row it's about, such as a product's id or a boat class's name. None in older results. */
  subject_key: string | null;
  plan: string | null;
  date: string | null;
}

/** A Financial Plan's P&L, as platform last worked it out: for a draft, after its latest change; for a frozen one, once. */
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
  /** The engine that worked them out. None in results from before platform recorded it. */
  platform_version: string | null;
  totals: Totals;
  pnl: PnlRow[];
  lines: PlanLine[];
  warnings: ResultWarning[];
  /** None in results worked out before capital was ranked. */
  capital: CapitalResult[];
}

/**
 * Whether a draft's numbers came from another engine than the one platform runs now, such as before a new one
 * deployed. A new release with the same engine doesn't count. Platform never works them out again on its own, and a
 * frozen plan's never change. False while `engine` is unknown.
 */
export const fromOlderEngine = (
  plan: { set: Pick<FinancialPlanSummary, "status">; results: Pick<Results, "platform_version"> | null },
  engine: string | null | undefined,
) =>
  plan.set.status === "draft" &&
  !!plan.results &&
  !!engine &&
  (plan.results.platform_version === null || engineHash(plan.results.platform_version) !== engineHash(engine));

/** How long a Financial Plan's numbers may be missing before the page says they couldn't be calculated. */
export const stuckAfterMs = 30_000;

/**
 * How often to read a Financial Plan again, in milliseconds, or false not to. Platform works out a draft's numbers
 * about a second after each change, wherever it's made, so a draft is read again every few seconds, and one whose
 * numbers are missing sooner, until they arrive. A frozen one's numbers never change once they're in.
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
  return isFrozen(plan.set) ? false : 5_000;
}
