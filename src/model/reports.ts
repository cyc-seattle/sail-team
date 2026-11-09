// The shapes the Planning reports show. Wireframes only: nothing fills these from Directus yet (#63).

/** One account's amount in a statement, such as coach wages. */
export interface AccountAmount {
  /** Its number in the chart of accounts. None for a share of a pool, such as G&A. */
  number: string | null;
  name: string;
  cents: number;
}

/** Revenue, direct costs, and indirect costs: the steps from revenue to net. */
export interface Steps {
  revenue_cents: number;
  direct_cents: number;
  indirect_cents: number;
}

export const expensesOf = (s: Steps) => s.direct_cents + s.indirect_cents;
export const grossOf = (s: Steps) => s.revenue_cents - s.direct_cents;
export const netOf = (s: Steps) => s.revenue_cents - s.direct_cents - s.indirect_cents;

/** A program area on the Overview, or Non-program, with its counts. Non-program has no offerings. */
export interface OverviewRow extends Steps {
  /** Its report's key: a plan's id, or `non-program`. */
  report: string;
  name: string;
  offerings: number;
  sailors: number;
  days: number;
  sailor_days: number;
}

export type SortKey = "name" | "revenue_cents" | "direct_cents" | "gross_cents" | "indirect_cents" | "net_cents";
export interface Sort {
  key: SortKey;
  descending: boolean;
}

/** The Overview opens with the largest revenue first. */
export const defaultSort: Sort = { key: "revenue_cents", descending: true };

/** Program areas in the given order. Non-program, which sells no offerings, always stays last. */
export function sortRows(rows: OverviewRow[], sort: Sort): OverviewRow[] {
  const value = (row: OverviewRow) =>
    sort.key === "net_cents" ? netOf(row) : sort.key === "gross_cents" ? grossOf(row) : row[sort.key];
  const sorted = rows
    .filter((r) => r.offerings > 0)
    .sort((a, b) => {
      const [x, y] = [value(a), value(b)];
      const order = typeof x === "string" ? x.localeCompare(String(y)) : x - Number(y);
      return sort.descending ? -order : order;
    });
  return [...sorted, ...rows.filter((r) => r.offerings === 0)];
}

/** The next sort when a column's header is pressed: the same column turns around, another starts from the top. */
export function nextSort(current: Sort, key: SortKey): Sort {
  if (current.key === key) {
    return { key, descending: !current.descending };
  }
  return { key, descending: key !== "name" };
}

export function totalOf(rows: OverviewRow[]): OverviewRow {
  const sum = (field: keyof Steps | "offerings" | "sailors" | "days" | "sailor_days") =>
    rows.reduce((total, r) => total + r[field], 0);
  return {
    report: "total",
    name: "Total",
    revenue_cents: sum("revenue_cents"),
    direct_cents: sum("direct_cents"),
    indirect_cents: sum("indirect_cents"),
    offerings: sum("offerings"),
    sailors: sum("sailors"),
    days: sum("days"),
    sailor_days: sum("sailor_days"),
  };
}

/** A program's hard rules, which hold for every one of its offerings. */
export interface ProgramSettings {
  name: string;
  /** The staff level that leads it, such as an instructor or a coach. */
  staff_level: string;
  sailors_per_coach: number;
  /** Free text the planning agent reads, one rule a line. */
  rules: string | null;
}

/** One offering in a program area's report. */
export interface ReportOffering {
  key: string;
  program: string;
  /** When it runs, as staff name it: Week 3 of summer, or Spring. */
  session: string;
  starts_on: string;
  ends_on: string;
  /** What one sailor pays for the whole offering. */
  fee_cents: number;
  /** How many sailors the plan expects. */
  estimated: number;
  max: number;
  days: number;
  /** Hours on the water for one sailor, across the whole offering. */
  hours: number;
}

/** An offering with its number within its program, such as Guppies 3, counted by start date. */
export type NumberedOffering = ReportOffering & { label: string };

const byStart = (offerings: ReportOffering[]) =>
  [...offerings].sort((a, b) => a.starts_on.localeCompare(b.starts_on) || a.key.localeCompare(b.key));

/**
 * Offerings grouped by program, each program's by start date and numbered from 1. Programs come in the order their
 * first offering starts.
 */
export function numberedOfferings(offerings: ReportOffering[]): { program: string; offerings: NumberedOffering[] }[] {
  const sorted = byStart(offerings);
  const programs = [...new Set(sorted.map((o) => o.program))];
  return programs.map((program) => ({
    program,
    offerings: sorted.filter((o) => o.program === program).map((o, i) => ({ ...o, label: `${program} ${i + 1}` })),
  }));
}

/**
 * Each program's offerings by session: the sessions in the order they first start, and for each program, its offering
 * in each session, if it has one.
 */
export function sessionGrid(offerings: ReportOffering[]): {
  sessions: string[];
  rows: { program: string; cells: (NumberedOffering | undefined)[] }[];
} {
  const sessions = [...new Set(byStart(offerings).map((o) => o.session))];
  const rows = numberedOfferings(offerings).map(({ program, offerings: own }) => ({
    program,
    cells: sessions.map((session) => own.find((o) => o.session === session)),
  }));
  return { sessions, rows };
}

/** What a sailor pays in one program, on average: for an offering, for a day, and for an hour on the water. */
export interface ProgramFee {
  program: string;
  per_offering_cents: number;
  per_day_cents: number;
  per_hour_cents: number;
}

/** Each program's average fees, weighted by the sailors expected in each offering, programs in the order they start. */
export function programFees(offerings: ReportOffering[]): ProgramFee[] {
  return numberedOfferings(offerings).map(({ program, offerings: own }) => {
    const sum = (of: (o: ReportOffering) => number) => own.reduce((total, o) => total + of(o), 0);
    const paid = sum((o) => o.fee_cents * o.estimated);
    const per = (by: number) => (by > 0 ? Math.round(paid / by) : 0);
    return {
      program,
      per_offering_cents: per(sum((o) => o.estimated)),
      per_day_cents: per(sum((o) => o.estimated * o.days)),
      per_hour_cents: per(sum((o) => o.estimated * o.hours)),
    };
  });
}

/** One row of enrollment: a session, or a program. */
export interface EnrollmentRow {
  name: string;
  offerings: number;
  sailors: number;
  max: number;
  sailor_days: number;
}

export type EnrollmentBy = "session" | "program";

/** Offerings added up by session or by program, in the order each first starts. */
export function enrollment(offerings: ReportOffering[], by: EnrollmentBy): EnrollmentRow[] {
  const sorted = byStart(offerings);
  const names = [...new Set(sorted.map((o) => o[by]))];
  return names.map((name) => {
    const own = sorted.filter((o) => o[by] === name);
    return {
      name,
      offerings: own.length,
      sailors: own.reduce((total, o) => total + o.estimated, 0),
      max: own.reduce((total, o) => total + o.max, 0),
      sailor_days: own.reduce((total, o) => total + o.estimated * o.days, 0),
    };
  });
}

/** One of the engine's warnings, on a date, in a program area. */
export interface PlanWarning {
  key: string;
  /** The program area's report key. */
  area: string;
  date: string;
  message: string;
}

/** A rules field's text as the list it's read as: one rule a line, blank lines dropped. */
export const rulesOf = (text: string | null) =>
  (text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
