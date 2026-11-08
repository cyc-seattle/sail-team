import type { EngineWarning } from "@cyc-seattle/platform/planning";
import type { SavedPnlRow } from "./saved-results.ts";

/** A Financial Plan as the list shows it: the organization's plan for a year, a draft or saved. */
export interface FinancialPlanSummary {
  id: string;
  organization_id: string;
  fiscal_year: number;
  name: string;
  /** Its note, such as "Reviewed with the board". */
  message: string | null;
  status: "draft" | "saved";
  saved_at: string | null;
  saved_by: string | null;
  /** The Financial Plan it started as a copy of. */
  parent: { id: string; name: string } | null;
}

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
        if (a.status !== b.status) {
          return a.status === "draft" ? -1 : 1;
        }
        return a.status === "draft" ? a.name.localeCompare(b.name) : (b.saved_at ?? "").localeCompare(a.saved_at ?? "");
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

/** What a member is called on the page: its program area's name, or "Operations Plan". */
export function memberName(member: Member): string {
  return member.kind === "operations" ? "Operations Plan" : (member.area_name ?? member.plan_name);
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
  member: string | null;
}

/** A line's amount as it adds to the net: revenue as it is, a cost taken away. */
export const signedCents = (line: Pick<PlanLine, "amount_cents" | "revenue">) =>
  line.revenue ? line.amount_cents : -line.amount_cents;

/** One P&L row, with the member it's charged in. */
export type MemberPnl = SavedPnlRow & { member: string | null };

/** A Financial Plan's P&L: as it was saved, or, for a draft, calculated now. */
export interface Results {
  /** Whether it was calculated now, for a draft, rather than read as it was saved. */
  live: boolean;
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

/** What the engine knows about each thing a line can be charged to, to find the member that holds it. */
export interface Owners {
  /** Each offering's plan copy, by the offering's key. */
  offeringVersion: Map<string, string>;
  /** Each product's program area, by its id. */
  productArea: Map<string, string | null>;
  /** Each program area's plan copy in the Financial Plan, by the area's id. */
  areaVersion: Map<string, string>;
  /** The Operations Plan's copy. */
  operations: string | null;
}

/**
 * The plan copy that holds what a line or P&L row is charged to, as platform's saved-versions hook decides it: an
 * offering goes with its own plan, a product or program area with that area's Program Plan, and the rest, such as
 * pools and the organization, with the Operations Plan.
 */
export function ownerOf(type: string, key: string | null, owners: Owners): string | null {
  if (type === "offering" && key) {
    return owners.offeringVersion.get(key) ?? owners.operations;
  }
  if (type === "product" && key) {
    const area = owners.productArea.get(key);
    return (area && owners.areaVersion.get(area)) ?? owners.operations;
  }
  if (type === "program_area" && key) {
    return owners.areaVersion.get(key) ?? owners.operations;
  }
  return owners.operations;
}

/** Names as a sentence lists them: `a`, `a and b`, or `a, b, and c`. */
export function listOf(names: string[]): string {
  if (names.length <= 2) {
    return names.join(" and ");
  }
  return `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`;
}
