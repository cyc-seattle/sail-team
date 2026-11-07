/** A financial model as the list shows it: a frozen set of the club's active versions for a year. */
export interface FinancialModelSummary {
  id: string;
  organization_id: string;
  fiscal_year: number;
  name: string;
  message: string | null;
  saved_at: string | null;
}

/**
 * The newest financial model for each organization and year: the financial model as it was last frozen. Financial models are never
 * changed, so a later one follows an earlier one.
 */
export function newestFinancialModels<T extends FinancialModelSummary>(sets: T[]): Map<number, T> {
  const newest = new Map<number, T>();
  for (const set of sets) {
    const seen = newest.get(set.fiscal_year);
    if (!seen || (set.saved_at ?? "") > (seen.saved_at ?? "")) {
      newest.set(set.fiscal_year, set);
    }
  }
  return newest;
}

/** One cost or revenue line of a financial model, with its plain name and whether its account is revenue. */
export interface ModelLine {
  name: string;
  cost_center_name: string;
  amount_cents: number;
  revenue: boolean;
}

/** A line's amount as it adds to the net: revenue as it is, a cost taken away. */
export const signedCents = (line: ModelLine) => (line.revenue ? line.amount_cents : -line.amount_cents);

/** A plan in a financial model, as the comparison with today's active versions needs it. */
export interface MemberRef {
  version_id: string;
  kind: "program_area" | "operations";
  /** The program area's id, for an area's plan. */
  program_area_id: string | null;
  /** What the page calls it: the area's name, or "the Operations Plan". */
  name: string;
}

/**
 * Each part of the financial model whose active version isn't the one the financial model holds, so the club has moved on since:
 * an area that made another version active, the Operations Plan likewise, or an area that has made one active since
 * and wasn't in the financial model.
 */
export function movedOn(
  members: MemberRef[],
  active: { areas: { program_area_id: string; version_id: string }[]; operations: string | null },
  areaNames: Map<string, string>,
): string[] {
  const moved: string[] = [];
  const operations = members.find((m) => m.kind === "operations");
  if (active.operations && active.operations !== operations?.version_id) {
    moved.push("the Operations Plan");
  }
  for (const area of active.areas) {
    const member = members.find((m) => m.kind === "program_area" && m.program_area_id === area.program_area_id);
    if (member?.version_id !== area.version_id) {
      moved.push(member?.name ?? areaNames.get(area.program_area_id) ?? "A program area");
    }
  }
  return moved;
}

/** Names as a sentence lists them: `a`, `a and b`, or `a, b, and c`. */
export function listOf(names: string[]): string {
  if (names.length <= 2) {
    return names.join(" and ");
  }
  return `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`;
}
