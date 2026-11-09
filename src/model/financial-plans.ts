import type { EngineWarning } from "@cyc-seattle/platform/planning";
import type { Measures } from "./pnl-view.ts";
import type { SavedPnlRow } from "./saved-results.ts";

/** A Financial Plan as the list shows it: the organization's plan for a year, a draft or saved. */
export interface FinancialPlanSummary {
  id: string;
  organization_id: string;
  fiscal_year: number;
  name: string;
  /** Its note, such as "Reviewed with the board". */
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

/** A Financial Plan in the list, with its top-line numbers. Null until platform has worked them out. */
export type ListedPlan = FinancialPlanSummary & { topLine: TopLine | null };

/** The organization's totals in a Financial Plan. */
export interface Totals {
  operating_net_cents: number;
  fundraising_net_cents: number;
  capital_cents: number;
  total_cents: number;
}

/**
 * Financial Plans by year, newest year first. In each year, the drafts come first, by name, then the saved ones,
 * newest first.
 */
export function plansByYear<T extends FinancialPlanSummary>(sets: T[]): { year: number; sets: T[] }[] {
  const years = [...new Set(sets.map((s) => s.fiscal_year))].sort((a, b) => b - a);
  return years.map((year) => ({
    year,
    sets: sets
      .filter((s) => s.fiscal_year === year)
      .sort((a, b) => {
        if (isSaved(a) !== isSaved(b)) {
          return isSaved(a) ? 1 : -1;
        }
        return !isSaved(a) ? a.name.localeCompare(b.name) : (b.saved_at ?? "").localeCompare(a.saved_at ?? "");
      }),
  }));
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

/** What a member is called on the page: its program area's name, or "Non-program" for the Operations Plan. */
export function memberName(member: Member): string {
  return member.kind === "operations" ? "Non-program" : (member.area_name ?? member.plan_name);
}

/** The Operations Plan first, then each Program Plan by name. */
export function membersInOrder(members: Member[]): Member[] {
  return [...members].sort(
    (a, b) =>
      Number(b.kind === "operations") - Number(a.kind === "operations") || memberName(a).localeCompare(memberName(b)),
  );
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
  cost_center_name: string;
  amount_cents: number;
  revenue: boolean;
  /** On an asset account: spent on something lasting, such as a coach boat. */
  capital: boolean;
  /** What the money is for: running programs, managing the club, or fundraising. */
  function: "program" | "management" | "fundraising" | null;
  member: string | null;
}

/** A line's amount as it adds to the net: revenue as it is, a cost taken away. */
export const signedCents = (line: Pick<PlanLine, "amount_cents" | "revenue">) =>
  line.revenue ? line.amount_cents : -line.amount_cents;

/** One P&L row, with the member it's charged in. */
export type MemberPnl = SavedPnlRow & { member: string | null };

/** Operating revenue, expenses, gross and net. */
export interface TopLine {
  revenue_cents: number;
  expense_cents: number;
  /** Revenue less the direct program costs, before overhead. */
  gross_cents: number;
  net_cents: number;
}

/**
 * The top-line numbers from some lines, leaving out fundraising and capital as platform's engine does for the
 * organization's operating totals.
 */
export function topLine(lines: Pick<PlanLine, "amount_cents" | "revenue" | "capital" | "function">[]): TopLine {
  const operating = lines.filter((l) => !l.capital && l.function !== "fundraising");
  const sum = (ls: typeof lines) => ls.reduce((total, l) => total + l.amount_cents, 0);
  const revenue = sum(operating.filter((l) => l.revenue));
  const expenses = operating.filter((l) => !l.revenue);
  const expense = sum(expenses);
  return {
    revenue_cents: revenue,
    expense_cents: expense,
    gross_cents: revenue - sum(expenses.filter((l) => l.function === "program")),
    net_cents: revenue - expense,
  };
}

/**
 * What a member's per-day and per-sailor-day amounts divide by: its offerings' days and sailor-days. The Operations
 * Plan's shared costs, and a Financial Plan's totals (no member), are spread over every offering, so they divide by all.
 */
export function measuresOf(results: Pick<Results, "pnl">, member: Pick<Member, "id" | "kind"> | null): Measures {
  const offerings = results.pnl.filter(
    (p) => p.level === "offering" && (!member || member.kind === "operations" || p.member === member.id),
  );
  const rows = offerings.length
    ? offerings
    : results.pnl.filter((p) => p.level === "program_area" && p.member === member?.id);
  return {
    days: rows.reduce((total, p) => total + p.days, 0),
    sailor_days: rows.reduce((total, p) => total + p.sailor_days, 0),
  };
}

/** A Financial Plan's P&L, as platform last worked it out: for a draft, after its latest change; for a saved one, once. */
export interface Results {
  calculated_at: string | null;
  totals: Totals;
  pnl: MemberPnl[];
  lines: PlanLine[];
  warnings: EngineWarning[];
}

/** A member's net: its program area's, or, for the Operations Plan, its lines'. */
export function memberNet(results: Results, member: Member): number {
  const area = results.pnl.find((p) => p.member === member.id && p.level === "program_area");
  if (area) {
    return area.net_cents;
  }
  return results.lines.filter((l) => l.member === member.id).reduce((sum, l) => sum + signedCents(l), 0);
}

/** Names as a sentence lists them: `a`, `a and b`, or `a, b, and c`. */
export function listOf(names: string[]): string {
  if (names.length <= 2) {
    return names.join(" and ");
  }
  return `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`;
}

/** One row of a Financial Plan's summary: a program area, Non-program, or the total. */
export interface SummaryRow {
  name: string;
  /** The member it's for. Null for the total. */
  member: Member | null;
  topLine: TopLine;
  /** What its per-day and per-sailor-day amounts divide by. */
  measures: Measures;
}

/** A row for each program area by name, then Non-program, then the total, which adds them up. */
export function summaryRows(members: Member[], results: Results): { rows: SummaryRow[]; total: SummaryRow } {
  const rows = membersInOrder(members)
    .sort((a, b) => Number(a.kind === "operations") - Number(b.kind === "operations"))
    .map((member): SummaryRow => {
      return {
        name: memberName(member),
        member,
        topLine: topLine(results.lines.filter((l) => l.member === member.id)),
        measures: measuresOf(results, member),
      };
    });
  return {
    rows,
    total: {
      name: "Total",
      member: null,
      topLine: topLine(results.lines),
      measures: measuresOf(results, null),
    },
  };
}

/** Revenue as a share of expenses: 1 when a row pays its way. Null when it has no expenses. */
export const costRecovery = (t: TopLine): number | null =>
  t.expense_cents > 0 ? t.revenue_cents / t.expense_cents : null;

/** What the top-line numbers leave out: fundraising, and spending on lasting things. */
export function outsideTopLine(lines: Pick<PlanLine, "amount_cents" | "revenue" | "capital" | "function">[]) {
  const fundraising = lines.filter((l) => !l.capital && l.function === "fundraising");
  const sum = (ls: typeof lines) => ls.reduce((total, l) => total + l.amount_cents, 0);
  const revenue = sum(fundraising.filter((l) => l.revenue));
  const expense = sum(fundraising.filter((l) => !l.revenue));
  return {
    fundraising: { revenue_cents: revenue, expense_cents: expense, net_cents: revenue - expense },
    capital_cents: sum(lines.filter((l) => l.capital)),
  };
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
