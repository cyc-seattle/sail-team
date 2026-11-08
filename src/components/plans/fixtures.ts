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
