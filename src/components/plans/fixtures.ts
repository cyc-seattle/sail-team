// Made-up P&Ls for the stories. Never real club figures.
import type { EngineWarning, Pnl } from "@cyc-seattle/platform/planning";
import type { Assumptions, OfferingAssumptions } from "@/model/assumptions";
import type { FinancialPlanSummary, Member, PlanLine, Results, Totals } from "@/model/financial-plans";

export function offering(key: string, revenue: number, expense: number, days: number, sailors: number): Pnl {
  return {
    level: "offering",
    key,
    revenue_cents: revenue,
    expense_cents: expense,
    net_cents: revenue - expense,
    by_account: [],
    mtdc_cents: expense,
    enrollment: sailors,
    days,
    sailor_days: days * sailors,
  };
}

export const offerings = [
  { name: "Beginner camp, week 1", pnl: offering("camp-1", 1_000_000, 600_000, 10, 10) },
  { name: "Beginner camp, week 2", pnl: offering("camp-2", 800_000, 650_000, 10, 8) },
  { name: "Race clinic", pnl: offering("clinic", 150_000, 210_000, 2, 6) },
];

export const warnings: EngineWarning[] = [
  { code: "closed_day", message: "A practice on Monday, July 5 falls on a day the club is closed.", key: "practice-7" },
  { code: "no_area", message: "Laser Masters belongs to no program area, so its costs aren't shared with any." },
];

// A made-up 2027 Financial Plan and the options started from it.
const plan = (id: string, fields: Partial<FinancialPlanSummary>): FinancialPlanSummary => ({
  id,
  organization_id: "org",
  fiscal_year: 2027,
  name: id,
  message: null,
  status: "saved",
  saved_at: null,
  saved_by: null,
  parent: null,
  ...fields,
});

const totals = (operating: number): Totals => ({
  operating_net_cents: operating,
  fundraising_net_cents: 120_000,
  capital_cents: 300_000,
  total_cents: operating - 180_000,
});

export const budget = {
  ...plan("budget", {
    name: "Budget",
    message: "Reviewed with the board",
    saved_at: "2027-03-10T18:00:00Z",
  }),
  totals: totals(500_000),
};
export const twoCoaches = {
  ...plan("two", { name: "Two coaches", status: "draft", parent: { id: "budget", name: "Budget" } }),
  totals: null,
};
export const threeCoaches = {
  ...plan("three", { name: "Three coaches", status: "draft", parent: { id: "budget", name: "Budget" } }),
  totals: null,
};

const member = (id: string, kind: Member["kind"], area: string | null): Member => ({
  id,
  plan_id: `${id}-plan`,
  version_id: `${id}-copy`,
  plan_name: `${area ?? "Operations"} 2027`,
  kind,
  program_area_id: area,
  area_name: area,
});
export const members = [
  member("youth", "program_area", "Youth Racing"),
  member("adult", "program_area", "Adult Programs"),
  member("ops", "operations", null),
];

const accounts: Record<string, string> = {
  Tuition: "4000",
  Sales: "4500",
  "Coach wages": "5000",
  "Payroll tax": "5100",
  Salaries: "5200",
  "Boats and equipment": "6000",
  Travel: "6200",
  Scholarships: "6400",
  "Card fees": "6500",
  Insurance: "7000",
  Office: "7100",
};

/** A made-up line, booked to the category its name says, with a key the engine would give it. */
export function line(name: string, category: string, cents: number, revenue = false, key = name): PlanLine {
  return {
    key,
    name,
    account_number: accounts[category] ?? null,
    account_name: category,
    cost_center_name: "Beginner camp, week 1",
    amount_cents: cents,
    revenue,
    member: "youth",
  };
}

/** A share of a pool's line, as the engine charges it to each offering. */
const share = (pool: string, name: string, category: string, cents: number, offering: string) => ({
  ...line(`${pool} share: ${name}`, category, cents, false, `pool:${pool}:${name}`),
  cost_center_name: offering,
});

// Youth Racing's lines, two offerings each, so the table adds them up by name.
const youthLines: PlanLine[] = ["Beginner camp, week 1", "Beginner camp, week 2", "Race clinic"].flatMap(
  (offering, i) =>
    [
      line("Revenue", "Tuition", [1_000_000, 800_000, 150_000][i]!, true),
      line("Card fees", "Card fees", [30_000, 24_000, 4_500][i]!),
      line("Coach wages", "Coach wages", [240_000, 240_000, 96_000][i]!),
      line("Payroll tax", "Payroll tax", [24_000, 24_000, 9_600][i]!),
      line("RIBs", "Boats and equipment", [60_000, 60_000, 24_000][i]!),
      line("Boat maintenance: Opti", "Boats and equipment", [18_000, 14_000, 0][i]!),
      line("Scholarships", "Scholarships", [50_000, 40_000, 7_500][i]!),
      share("G&A", "Insurance", "Insurance", [80_000, 75_000, 30_000][i]!, offering),
      share("G&A", "Office rent", "Office", [60_000, 55_000, 22_000][i]!, offering),
      share("G&A", "Executive Director: rest of salary", "Salaries", [90_000, 85_000, 34_000][i]!, offering),
      share("Program admin", "Registrar", "Salaries", [20_000, 18_000, 7_000][i]!, offering),
      ...(i === 2 ? [line("Regatta travel", "Travel", 45_000)] : []),
    ].map((l) => ({ ...l, cost_center_name: offering })),
);

const adultLines: PlanLine[] = [
  share("G&A", "Insurance", "Insurance", 60_000, "Adult keelboat"),
  share("G&A", "Office rent", "Office", 40_000, "Adult keelboat"),
].map((l) => ({ ...l, member: "adult" }));

const opsLines: PlanLine[] = [
  line("Revenue", "Sales", 120_000, true),
  line("Cost of goods sold", "Sales", 70_000),
  line("Boat purchase", "Boats and equipment", 300_000),
].map((l) => ({ ...l, cost_center_name: "Organization", member: "ops" }));

export const lines: PlanLine[] = [...youthLines, ...adultLines, ...opsLines];

const areaRow = (key: string, name: string, net: number, memberId: string) => ({
  level: "program_area" as const,
  subject_key: key,
  name,
  revenue_cents: net + 300_000,
  expense_cents: 300_000,
  net_cents: net,
  mtdc_cents: 300_000,
  enrollment: 10,
  days: 10,
  sailor_days: 100,
  member: memberId,
});

export const results = (operating: number, live = false): Results => ({
  live,
  totals: totals(operating),
  pnl: [
    areaRow("youth", "Youth Racing", operating - 100_000, "youth"),
    areaRow("adult", "Adult Programs", 300_000, "adult"),
  ],
  lines,
  warnings: live ? [] : warnings.slice(0, 1),
});

const offeringAssumptions = (
  key: string,
  name: string,
  program: string,
  fields: Partial<OfferingAssumptions>,
): OfferingAssumptions => ({
  key,
  name,
  program,
  starts_on: "2027-07-05",
  ends_on: "2027-07-16",
  price_cents: 100_000,
  capacity: 12,
  enrollment: 10,
  days: 10,
  sailors_per_coach: 5,
  min_coaches: 2,
  coach_level: "Lead coach",
  ribs_per_coach: 1,
  byob_share: 0,
  ...fields,
});

/** Youth Racing's offerings, as its planner entered them. */
export const youthAssumptions: Assumptions = {
  offerings: [
    offeringAssumptions("camp-1", "Beginner camp, week 1", "Beginner camp", {}),
    offeringAssumptions("camp-2", "Beginner camp, week 2", "Beginner camp", {
      starts_on: "2027-07-19",
      ends_on: "2027-07-30",
      enrollment: 8,
    }),
    offeringAssumptions("clinic", "Race clinic", "Race team", {
      starts_on: "2027-08-14",
      ends_on: "2027-08-15",
      price_cents: 25_000,
      capacity: 8,
      enrollment: 6,
      days: 2,
      sailors_per_coach: 6,
      min_coaches: null,
      coach_level: "Race coach",
      byob_share: 0.5,
    }),
  ],
  operations: null,
};

/** The Operations Plan's rates for the year. */
export const operationsAssumptions: Assumptions = {
  offerings: [
    offeringAssumptions("merch", "Club store", "Merchandise", {
      starts_on: "2027-01-01",
      ends_on: "2027-12-31",
      price_cents: 3_000,
      capacity: null,
      enrollment: 40,
      days: null,
      sailors_per_coach: null,
      min_coaches: null,
      coach_level: null,
      ribs_per_coach: null,
      byob_share: null,
    }),
  ],
  operations: {
    rates: { payroll_tax_rate: 0.1, lodging_per_night_cents: 15_000, mileage_rate_cents: 70 },
    staffLevels: [
      { key: "assistant", name: "Assistant coach", pay_type: "hourly", hourly_rate_cents: 2_200 },
      { key: "lead", name: "Lead coach", pay_type: "hourly", hourly_rate_cents: 3_000 },
      { key: "race", name: "Race coach", pay_type: "hourly", hourly_rate_cents: 4_000 },
      { key: "parent", name: "Parent helper", pay_type: "volunteer", hourly_rate_cents: null },
    ],
    positions: [
      {
        key: "ed",
        name: "Executive Director",
        annual_salary_cents: 9_000_000,
        paid_hours_per_year: 2_080,
        ga_share: 0.6,
      },
      {
        key: "pd",
        name: "Program Director",
        annual_salary_cents: 6_500_000,
        paid_hours_per_year: 2_080,
        ga_share: 0.1,
      },
    ],
    charges: [
      { key: "card", name: "Card fees", rate: 0.03, product_kinds: ["program", "charter"] },
      { key: "scholarships", name: "Scholarships", rate: 0.05, product_kinds: ["program"] },
      { key: "bo", name: "B&O tax", rate: 0.015, product_kinds: null },
    ],
    resources: [
      {
        key: "rib",
        name: "RIBs",
        quantity: 6,
        cost_per_hour_cents: 0,
        cost_per_day_cents: 1_000,
        fuel_per_hour_cents: 1_500,
        maintenance_per_hour_cents: 800,
      },
    ],
    boatRates: [
      { key: "opti", boat_class: "Opti", maintenance_per_boat_hour_cents: 150 },
      { key: "420", boat_class: "420", maintenance_per_boat_hour_cents: 300 },
    ],
    bonuses: [{ key: "director", role_name: "Youth Racing Director", bonus_rate: 0.1, basis: "after_shared_costs" }],
  },
};

/** What the stories' per-day amounts divide by: the made-up offerings' days and sailor-days. */
export const measures = { days: 22, sailor_days: 192 };
