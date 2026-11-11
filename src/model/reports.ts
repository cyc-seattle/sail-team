// The shapes the Planning reports show, and how they're made from a Financial Plan's results and inputs.
import type { PlanActivity, PlanOffering } from "@cyc-seattle/platform/planning";
import type { Member, PlanLine, ResultWarning } from "./financial-plans.ts";

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
  staff_level: string | null;
  sailors_per_coach: number | null;
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
  /** The share of its revenue that goes to the cost of what it sells. */
  cogs_rate: number | null;
  note: string | null;
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

/** One of the engine's warnings, on a date, about a program area or Non-program, when it names them. */
export interface PlanWarning {
  key: string;
  /** The report key of the plan it's about: a program area's, or `non-program` for the Operations Plan or none. */
  area: string;
  date: string | null;
  message: string;
}

/** A rules field's text as the list it's read as: one rule a line, blank lines dropped. */
export const rulesOf = (text: string | null) =>
  (text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

/** A report's key: a Program Plan's id, or `non-program` for the Operations Plan. */
export const reportKey = (member: Pick<Member, "kind" | "plan_id">) =>
  member.kind === "operations" ? "non-program" : member.plan_id;

/** What a member's report is called: its program area's name, or Non-program. */
export const reportName = (member: Member) =>
  member.kind === "operations" ? "Non-program" : (member.area_name ?? member.plan_name);

/** A Financial Plan's reports, in the order the switcher lists them: program areas A to Z between Assumptions and Non-program. */
export function reportsOf(members: Member[]): { key: string; name: string }[] {
  const areas = members
    .filter((m) => m.kind === "program_area")
    .map((m) => ({ key: reportKey(m), name: reportName(m) }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return [
    { key: "overview", name: "Overview" },
    { key: "rates", name: "Assumptions" },
    ...areas,
    { key: "non-program", name: "Non-program" },
    { key: "fundraising", name: "Fundraising and capital" },
  ];
}

type Line = Pick<
  PlanLine,
  "key" | "name" | "account_number" | "account_name" | "amount_cents" | "revenue" | "capital" | "function"
>;

/** The lines in the operating net: neither fundraising nor capital. */
export const operating = <T extends Line>(lines: T[]) =>
  lines.filter((l) => !l.capital && l.function !== "fundraising");

/** A share of a pool, such as G&A, which the engine spreads over every offering. */
export const isShare = (line: Pick<PlanLine, "key">) => line.key.startsWith("pool:");

/** The pool a share is from, from its name: "G&A share: Insurance" is from G&A. */
const poolOf = (line: Pick<PlanLine, "name">) => line.name.split(" share: ")[0]!;

const sum = (lines: Pick<PlanLine, "amount_cents">[]) => lines.reduce((total, l) => total + l.amount_cents, 0);

/** Lines' revenue, their own costs, and their shares of the pools. */
export function stepsOf(lines: Line[]): Steps {
  const costs = operating(lines).filter((l) => !l.revenue);
  return {
    revenue_cents: sum(operating(lines).filter((l) => l.revenue)),
    direct_cents: sum(costs.filter((l) => !isShare(l))),
    indirect_cents: sum(costs.filter(isShare)),
  };
}

const byNumber = (a: AccountAmount, b: AccountAmount) =>
  (a.number ?? "\uffff").localeCompare(b.number ?? "\uffff", undefined, { numeric: true }) ||
  a.name.localeCompare(b.name);

/** Lines added up by account, in account-number order. */
export function byAccount(lines: Line[]): AccountAmount[] {
  const accounts = new Map<string, AccountAmount>();
  for (const line of lines) {
    const id = `${line.account_number ?? ""} ${line.account_name}`;
    const account = accounts.get(id) ?? { number: line.account_number, name: line.account_name, cents: 0 };
    accounts.set(id, { ...account, cents: account.cents + line.amount_cents });
  }
  return [...accounts.values()].sort(byNumber);
}

/** A plan's revenue and own costs by account, and its shares of the pools, one line a pool, such as G&A. */
export function statementOf(lines: Line[]): {
  revenue: AccountAmount[];
  direct: AccountAmount[];
  indirect: AccountAmount[];
} {
  const own = operating(lines);
  const shares = own.filter((l) => !l.revenue && isShare(l));
  const pools = [...new Set(shares.map(poolOf))].sort();
  return {
    revenue: byAccount(own.filter((l) => l.revenue)),
    direct: byAccount(own.filter((l) => !l.revenue && !isShare(l))),
    indirect: pools.map((pool) => ({ number: null, name: pool, cents: sum(shares.filter((l) => poolOf(l) === pool)) })),
  };
}

/**
 * The Overview's rows: each program area, with its offerings' counts, then Non-program, the Operations Plan, which
 * has none to compare, so it stays last. Every operating line is in one row, so they add up to the plan's totals.
 */
export function overviewRows(
  members: Member[],
  lines: Pick<PlanLine, keyof Line | "member">[],
  offerings: Record<string, ReportOffering[]>,
): OverviewRow[] {
  return members.map((member) => {
    const own = member.kind === "operations" ? [] : (offerings[reportKey(member)] ?? []);
    return {
      report: reportKey(member),
      name: reportName(member),
      ...stepsOf(lines.filter((l) => l.member === member.id)),
      offerings: own.length,
      sailors: own.reduce((total, o) => total + o.estimated, 0),
      days: own.reduce((total, o) => total + o.days, 0),
      sailor_days: own.reduce((total, o) => total + o.estimated * o.days, 0),
    };
  });
}

/** One shared cost, such as G&A's insurance: what it costs, and how much of it the programs' offerings carry. */
export interface SharedCost {
  number: string | null;
  name: string;
  /** The pool it's spread from, such as G&A. */
  pool: string;
  total_cents: number;
  /** The part spread over the programs' offerings. The rest falls on what's sold outside them. */
  allocated_cents: number;
}

/** Each pool's lines at their full amount, added back up from every offering's share, by pool and account. */
export function sharedCostsOf(lines: Pick<PlanLine, keyof Line | "member">[], operations: string | null): SharedCost[] {
  const costs = new Map<string, SharedCost>();
  for (const line of operating(lines).filter((l) => !l.revenue && isShare(l))) {
    const cost = costs.get(line.key) ?? {
      number: line.account_number,
      name: line.name.split(" share: ").slice(1).join(" share: ") || line.name,
      pool: poolOf(line),
      total_cents: 0,
      allocated_cents: 0,
    };
    costs.set(line.key, {
      ...cost,
      total_cents: cost.total_cents + line.amount_cents,
      allocated_cents: cost.allocated_cents + (line.member === operations ? 0 : line.amount_cents),
    });
  }
  return [...costs.values()].sort(
    (a, b) => a.pool.localeCompare(b.pool) || byNumber({ ...a, cents: 0 }, { ...b, cents: 0 }),
  );
}

/** Something sold outside the programs, such as boat storage, with its revenue and its own costs. */
export interface Product {
  name: string;
  revenue_cents: number;
  direct_cents: number;
}

/**
 * What the Operations Plan sells, by product, from its offerings' lines, leaving out their shares of the pools. Its
 * costs that are no offering's, such as a salary's rest charged to the organization, are a row of their own.
 */
export function productsOf(
  lines: Pick<PlanLine, keyof Line | "cost_center_key">[],
  offerings: { key: string; product: string }[],
): Product[] {
  const productOf = new Map(offerings.map((o) => [o.key, o.product]));
  const products = new Map<string, Product>();
  for (const line of operating(lines).filter((l) => !isShare(l))) {
    const name = (line.cost_center_key && productOf.get(line.cost_center_key)) ?? "Organization";
    const product = products.get(name) ?? { name, revenue_cents: 0, direct_cents: 0 };
    products.set(name, {
      ...product,
      revenue_cents: product.revenue_cents + (line.revenue ? line.amount_cents : 0),
      direct_cents: product.direct_cents + (line.revenue ? 0 : line.amount_cents),
    });
  }
  return [...products.values()].sort(
    (a, b) => Number(a.name === "Organization") - Number(b.name === "Organization") || a.name.localeCompare(b.name),
  );
}

/** Fundraising's revenue and costs by account, and each capital purchase by name, such as a coach boat. */
export function fundraisingAndCapital(lines: Line[]): {
  fundraising: { revenue: AccountAmount[]; costs: AccountAmount[] };
  capital: AccountAmount[];
} {
  const fundraising = lines.filter((l) => !l.capital && l.function === "fundraising");
  return {
    fundraising: {
      revenue: byAccount(fundraising.filter((l) => l.revenue)),
      costs: byAccount(fundraising.filter((l) => !l.revenue)),
    },
    capital: byAccount(lines.filter((l) => l.capital).map((l) => ({ ...l, account_name: l.name }))),
  };
}

/** The engine's warnings, each with the report of the plan it's about, or Non-program's when it names none. */
export function planWarnings(warnings: ResultWarning[], members: Member[]): PlanWarning[] {
  return warnings.map((w, i) => {
    const member = members.find((m) => m.id === w.member);
    return { key: String(i), area: member ? reportKey(member) : "non-program", date: w.date, message: w.message };
  });
}

/** An activity's minutes on the water, as the engine counts them: none for a travel day or one without boats. */
export function onWaterMinutes(
  activity: Pick<PlanActivity, "kind" | "uses_boats" | "start_time" | "end_time" | "on_water_minutes">,
): number {
  if (activity.kind === "travel" || !activity.uses_boats) {
    return 0;
  }
  if (activity.on_water_minutes !== null) {
    return activity.on_water_minutes;
  }
  if (!activity.start_time || !activity.end_time) {
    return 0;
  }
  const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
  const span = minutes(activity.end_time) - minutes(activity.start_time);
  // One that ends before it starts runs past midnight.
  return span < 0 ? span + 24 * 60 : span;
}

/**
 * An offering as its program area's report shows it: its session, or its name when it has none, its sailors, its days,
 * which are the dates it has an activity other than travel, and one sailor's hours on the water.
 */
export function reportOffering(
  offering: Pick<
    PlanOffering,
    "key" | "name" | "season_term" | "starts_on" | "ends_on" | "price_cents" | "capacity" | "cogs_rate" | "note"
  > & {
    program: string;
    estimated: number;
  },
  activities: Pick<PlanActivity, "date" | "kind" | "uses_boats" | "start_time" | "end_time" | "on_water_minutes">[],
): ReportOffering {
  return {
    key: offering.key,
    program: offering.program,
    session: offering.season_term || offering.name,
    starts_on: offering.starts_on,
    ends_on: offering.ends_on,
    fee_cents: offering.price_cents ?? 0,
    estimated: offering.estimated,
    max: offering.capacity ?? offering.estimated,
    days: new Set(activities.filter((a) => a.kind !== "travel").map((a) => a.date)).size,
    hours: activities.reduce((total, a) => total + onWaterMinutes(a), 0) / 60,
    cogs_rate: offering.cogs_rate,
    note: offering.note,
  };
}

/** A regatta trip, with what each coach's travel costs. */
export interface Trip {
  key: string;
  offering_key: string;
  name: string;
  nights: number | null;
  airfare_cents: number | null;
  miles: number | null;
}

/** One activity on a program area's schedule. */
export interface ScheduledActivity {
  key: string;
  offering_key: string;
  kind: PlanActivity["kind"];
  start_time: string | null;
  end_time: string | null;
  setup_minutes: number | null;
  putaway_minutes: number | null;
  on_water_minutes: number;
}

/**
 * A block on a date: activities that share their staff, coach boats and boats, each listed as "Name: count". An
 * activity in no block has one of its own, with no name and nothing shared.
 */
export interface ScheduleBlock {
  key: string;
  date: string;
  name: string | null;
  activities: ScheduledActivity[];
  staff: string[];
  equipment: string[];
  boats: string[];
}

type BlockRow = { id: string; key: string; date: string; name: string | null };

/**
 * A block's name, or none when it only repeats its date and names already on the page, such as "J-Pod 2027-03-02".
 * `known` is those names: the program area's, its programs' and its offerings'.
 */
export function blockName(name: string, date: string, known: string[]): string | null {
  let rest = name.split(date).join("");
  for (const k of [...known].sort((a, b) => b.length - a.length)) {
    rest = rest.split(k).join("");
  }
  return /[\p{L}\p{N}]/u.test(rest) ? name : null;
}
type ActivityRow = Pick<
  PlanActivity,
  | "id"
  | "key"
  | "offering_id"
  | "block_id"
  | "date"
  | "kind"
  | "uses_boats"
  | "start_time"
  | "end_time"
  | "on_water_minutes"
  | "setup_minutes"
  | "putaway_minutes"
>;

/** What one block shares, with the names of the levels, positions, equipment and boat classes it uses. */
export interface BlockParts {
  staff: { block_id: string; staff_level: string | null; position: string | null; count: number; pay: string | null }[];
  resources: { block_id: string; resource: string; quantity: number; hours: number | null }[];
  boats: { block_id: string; boat_class: string; count: number; sailor_owned: number | null }[];
}

const amount = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

/** A program area's activities by date and start time, each in its block, with the offering keys they belong to. */
export function scheduleOf(
  blocks: BlockRow[],
  activities: ActivityRow[],
  parts: BlockParts,
  offeringKey: (offeringId: string) => string,
): ScheduleBlock[] {
  const scheduled = (a: ActivityRow): ScheduledActivity => ({
    key: a.key,
    offering_key: offeringKey(a.offering_id),
    kind: a.kind,
    start_time: a.start_time,
    end_time: a.end_time,
    setup_minutes: a.setup_minutes,
    putaway_minutes: a.putaway_minutes,
    on_water_minutes: onWaterMinutes(a),
  });
  const byStart = (a: ScheduledActivity, b: ScheduledActivity) =>
    (a.start_time ?? "").localeCompare(b.start_time ?? "") || a.offering_key.localeCompare(b.offering_key);
  const own = (rows: { block_id: string }[], id: string) => rows.filter((r) => r.block_id === id);
  const shared: ScheduleBlock[] = blocks.map((b) => ({
    key: b.key,
    date: b.date,
    name: b.name,
    activities: activities
      .filter((a) => a.block_id === b.id)
      .map(scheduled)
      .sort(byStart),
    staff: (own(parts.staff, b.id) as BlockParts["staff"]).map(
      (s) =>
        `${s.position ?? s.staff_level ?? "Staff"}${s.position && s.pay === "hourly" ? ", by the hour" : ""}: ${amount(s.count)}`,
    ),
    equipment: (own(parts.resources, b.id) as BlockParts["resources"]).map(
      (r) => `${r.resource}: ${amount(r.quantity)}${r.hours === null ? "" : `, ${amount(r.hours)} hours each`}`,
    ),
    boats: (own(parts.boats, b.id) as BlockParts["boats"]).map(
      (x) =>
        `${x.boat_class}: ${amount(x.count)}${x.sailor_owned ? `, plus ${amount(x.sailor_owned)} sailors' own` : ""}`,
    ),
  }));
  const blockIds = new Set(blocks.map((b) => b.id));
  const alone: ScheduleBlock[] = activities
    .filter((a) => !a.block_id || !blockIds.has(a.block_id))
    .map((a) => ({
      key: a.key,
      date: a.date,
      name: null,
      activities: [scheduled(a)],
      staff: [],
      equipment: [],
      boats: [],
    }));
  const first = (b: ScheduleBlock) => b.activities[0]?.start_time ?? "";
  return [...shared, ...alone].sort(
    (a, b) => a.date.localeCompare(b.date) || first(a).localeCompare(first(b)) || a.key.localeCompare(b.key),
  );
}
