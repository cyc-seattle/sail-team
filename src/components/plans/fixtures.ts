// Made-up P&Ls for the stories. Never real club figures.
import type { EngineWarning, Pnl } from "@cyc-seattle/platform/planning";
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
  topLine: { revenue_cents: 1_400_000, expense_cents: 900_000, gross_cents: 1_000_000, net_cents: 500_000 },
};
export const twoCoaches = {
  ...plan("two", { name: "Two coaches", status: "draft", parent: { id: "budget", name: "Budget" } }),
  topLine: null,
};
export const threeCoaches = {
  ...plan("three", { name: "Three coaches", status: "draft", parent: { id: "budget", name: "Budget" } }),
  topLine: null,
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

export const lines: PlanLine[] = [
  {
    name: "Tuition",
    cost_center_name: "Beginner camp, week 1",
    amount_cents: 1_000_000,
    revenue: true,
    capital: false,
    function: "program",
    member: "youth",
  },
  {
    name: "Coach wages",
    cost_center_name: "Beginner camp, week 1",
    amount_cents: 300_000,
    revenue: false,
    capital: false,
    function: "program",
    member: "youth",
  },
  {
    name: "Office share: Office rent",
    cost_center_name: "Beginner camp, week 1",
    amount_cents: 300_000,
    revenue: false,
    capital: false,
    function: "management",
    member: "youth",
  },
  {
    name: "Insurance",
    cost_center_name: "Organization",
    amount_cents: 200_000,
    revenue: false,
    capital: false,
    function: "management",
    member: "ops",
  },
];

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

// A fuller made-up year for the Financial Plan page: three program areas, Operations, fundraising, and a coach boat.
type Line = Omit<PlanLine, "member">;
const money = (name: string, cents: number, revenue: boolean, fn: PlanLine["function"], capital = false): Line => ({
  name,
  cost_center_name: "Organization",
  amount_cents: cents,
  revenue,
  capital,
  function: fn,
});

/** A program area's offerings: name, sailors, days, price a sailor, direct costs, and share of overhead. */
const areas: { member: Member; offerings: [string, number, number, number, number, number][] }[] = [
  {
    member: member("youth", "program_area", "Youth Racing"),
    offerings: [
      ["Opti green fleet · spring", 18, 24, 65_000, 640_000, 190_000],
      ["Opti race team · summer", 14, 30, 120_000, 1_020_000, 310_000],
      ["ILCA race team · fall", 9, 22, 95_000, 610_000, 170_000],
    ],
  },
  {
    member: member("double", "program_area", "Doublehanded"),
    offerings: [
      ["J-Pod · fall practices", 12, 26, 110_000, 780_000, 240_000],
      ["K-Pod · fall practices", 10, 26, 90_000, 650_000, 200_000],
    ],
  },
  {
    member: member("adult", "program_area", "Adult Programs"),
    offerings: [
      ["Learn to sail · weekends", 24, 8, 45_000, 420_000, 150_000],
      ["Keelboat clinic", 8, 4, 38_000, 160_000, 60_000],
    ],
  },
];

const ops = member("ops", "operations", null);
export const clubMembers: Member[] = [...areas.map((a) => a.member), ops];

const offeringRows = areas.flatMap(({ member: m, offerings: os }) =>
  os.map(([name, sailors, days, price, direct, overhead]) => ({
    m,
    name,
    pnl: offering(name, sailors * price, direct + overhead, days, sailors),
    lines: [
      money("Tuition", sailors * price, true, "program"),
      money("Coaches, boats, and RIBs", direct, false, "program"),
      money("G&A share", overhead, false, "management"),
    ].map((l) => ({ ...l, cost_center_name: name, member: m.id })),
  })),
);

const opsProducts = [
  { name: "Merchandise", revenue: 180_000, expense: 120_000 },
  { name: "Boat storage", revenue: 420_000, expense: 90_000 },
];

const opsLines: PlanLine[] = [
  ...opsProducts.flatMap((p) => [
    { ...money(p.name, p.revenue, true, "program"), cost_center_name: p.name, member: "ops" },
    { ...money(`${p.name} costs`, p.expense, false, "program"), cost_center_name: p.name, member: "ops" },
  ]),
  { ...money("Office not shared out", 240_000, false, "management"), member: "ops" },
  { ...money("Spring gala", 900_000, true, "fundraising"), member: "ops" },
  { ...money("Gala costs", 210_000, false, "fundraising"), member: "ops" },
  { ...money("Coach boat", 650_000, false, null, true), member: "ops" },
];

const pnlRow = (pnl: Pnl, name: string, memberId: string) => ({
  level: pnl.level,
  subject_key: pnl.key,
  name,
  revenue_cents: pnl.revenue_cents,
  expense_cents: pnl.expense_cents,
  net_cents: pnl.net_cents,
  mtdc_cents: pnl.mtdc_cents,
  enrollment: pnl.enrollment,
  days: pnl.days,
  sailor_days: pnl.sailor_days,
  member: memberId,
});

const sumOf = (rows: Pnl[], level: Pnl["level"], key: string): Pnl => ({
  level,
  key,
  revenue_cents: rows.reduce((t, r) => t + r.revenue_cents, 0),
  expense_cents: rows.reduce((t, r) => t + r.expense_cents, 0),
  net_cents: rows.reduce((t, r) => t + r.net_cents, 0),
  by_account: [],
  mtdc_cents: rows.reduce((t, r) => t + r.mtdc_cents, 0),
  enrollment: rows.reduce((t, r) => t + r.enrollment, 0),
  days: rows.reduce((t, r) => t + r.days, 0),
  sailor_days: rows.reduce((t, r) => t + r.sailor_days, 0),
});

/** The fuller year's results. */
export const clubResults = (live = false): Results => {
  const lines = [...offeringRows.flatMap((o) => o.lines), ...opsLines];
  const pnl = [
    ...offeringRows.map((o) => pnlRow(o.pnl, o.name, o.m.id)),
    ...areas.map(({ member: m }) =>
      pnlRow(
        sumOf(
          offeringRows.filter((o) => o.m.id === m.id).map((o) => o.pnl),
          "program_area",
          m.id,
        ),
        m.area_name!,
        m.id,
      ),
    ),
    ...opsProducts.map((p) =>
      pnlRow({ ...offering(p.name, p.revenue, p.expense, 0, 0), level: "product" }, p.name, "ops"),
    ),
  ];
  return { live, totals: totals(500_000), pnl, lines, warnings: live ? [] : warnings.slice(0, 1) };
};
