// Made-up numbers for the Planning report wireframes. Never real figures.
import type { OperationsAssumptions } from "@/model/assumptions";
import type { ListedPlan, Totals } from "@/model/financial-plans";
import type {
  AccountAmount,
  LineAmount,
  OverviewRow,
  PlanWarning,
  Product,
  ProgramSettings,
  ReportOffering,
  SharedCost,
} from "@/model/reports";

const area = (
  report: string,
  name: string,
  revenue: number,
  direct: number,
  indirect: number,
  offerings: number,
  sailors: number,
  days: number,
): OverviewRow => ({
  report,
  name,
  revenue_cents: revenue,
  direct_cents: direct,
  indirect_cents: indirect,
  offerings,
  sailors,
  days,
  sailor_days: Math.round((sailors * days) / offerings),
});

export const overviewRows: OverviewRow[] = [
  area("lts", "Learn to Sail", 4_100_000, 2_300_000, 1_100_000, 8, 64, 48),
  area("singlehanded", "Singlehanded", 6_800_000, 4_900_000, 1_700_000, 6, 52, 120),
  area("summer", "Summer", 21_500_000, 12_200_000, 5_600_000, 21, 210, 105),
  area("adventure", "Adventure", 2_200_000, 1_500_000, 600_000, 4, 30, 40),
  area("doublehanded", "Doublehanded", 9_300_000, 6_100_000, 2_400_000, 6, 66, 132),
  area("hp", "High Performance", 3_600_000, 3_100_000, 900_000, 2, 12, 60),
  area("non-program", "Non-program", 2_400_000, 900_000, 1_300_000, 0, 0, 0),
];

/** Every report a Financial Plan has, in the order the switcher lists them. */
export const reports = [
  { key: "overview", name: "Overview" },
  { key: "rates", name: "Assumptions" },
  ...overviewRows
    .filter((r) => r.offerings > 0)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((r) => ({ key: r.report, name: r.name })),
  { key: "non-program", name: "Non-program" },
  { key: "fundraising", name: "Fundraising and capital" },
];

const account = (number: string | null, name: string, cents: number, lines?: LineAmount[]): AccountAmount => ({
  number,
  name,
  cents,
  ...(lines && { lines }),
});

const line = (name: string, explanation: string | null, offerings: number, cents: number): LineAmount => ({
  name,
  explanation,
  offerings,
  cents,
});

export const summerStatement = {
  revenue: [
    account("4140", "Summer camp tuition", 21_900_000, [
      line("Revenue", "52500¢ × 16 enrolled", 6, 5_040_000),
      line("Revenue", "39500¢ × 9 enrolled", 7, 2_488_500),
      line("Revenue", "61000¢ × 8 enrolled", 3, 1_464_000),
    ]),
    account("4900", "Scholarships", -400_000),
  ],
  direct: [
    account("5010", "Coach wages", 7_400_000, [
      line("Coach wages", "Staff × paid hours × each one's hourly rate", 21, 6_980_000),
      line("Program Director: coaching", "Program Director: 120 hours at the salary's hourly equivalent", 3, 420_000),
    ]),
    account("5020", "Payroll tax", 740_000),
    account("5030", "Workers' comp", 310_000),
    account("5110", "RIB fuel", 690_000),
    account("5120", "RIB upkeep", 420_000),
    account("5130", "Boat upkeep", 960_000),
    account("5210", "Coach gear and uniforms", 280_000),
    account("5310", "Card fees", 650_000),
    account("5320", "B&O tax", 330_000),
    account("5410", "Salaried coaching", 420_000),
  ],
  indirect: [
    account(null, "G&A", 3_900_000, [
      line(
        "G&A share: Executive Director: rest of salary",
        "G&A: Executive Director: salary not charged to coaching or bookings",
        21,
        2_700_000,
      ),
      line("G&A share: Insurance", "G&A: Insurance", 21, 900_000),
      line("G&A share: Payroll tax", "G&A: 0.1 × wages", 21, 300_000),
    ]),
    account(null, "Program admin", 1_100_000),
    account(null, "Space", 600_000),
  ],
};

export const summerPrograms: ProgramSettings[] = [
  {
    name: "Guppies",
    staff_level: "Level 1 Instructor",
    sailors_per_coach: 10,
    rules:
      "If there are more than 12 Guppies, add a Junior Instructor.\nGuppies sail Sailqubes. The Harpoon can take up to 10 instead.",
  },
  {
    name: "Opti Camp",
    staff_level: "Level 2 Instructor",
    sailors_per_coach: 8,
    rules: "About a third bring their own Optis.\nNever fewer than 2 coaches on the water.",
  },
  { name: "Race Camp", staff_level: "Level 3 Coach", sailors_per_coach: 10, rules: null },
];

const week = (n: number) => {
  const start = new Date(Date.UTC(2027, 5, 21 + 7 * n));
  const end = new Date(start.getTime() + 4 * 86_400_000);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { session: `Week ${n + 1}`, starts_on: iso(start), ends_on: iso(end) };
};

const camp = (program: string, n: number, fee: number, estimated: number, max: number, hours: number) => ({
  key: `${program}-${n}`,
  program,
  ...week(n),
  fee_cents: fee,
  estimated,
  max,
  days: 5,
  hours,
});

// Listed out of order on purpose: the report sorts them by start date.
export const summerOfferings: ReportOffering[] = [
  ...[0, 2, 4, 6, 8, 1, 3, 5, 7].map((n) => camp("Opti Camp", n, 52_500, n % 3 === 0 ? 12 : 16, 16, 30)),
  ...[0, 1, 2, 3, 4, 5, 6, 7, 8].map((n) => camp("Guppies", n, 39_500, n < 2 ? 6 : 9, 10, 15)),
  ...[1, 4, 7].map((n) => camp("Race Camp", n, 61_000, 8, 12, 35)),
];

const season = (
  program: string,
  session: string,
  starts_on: string,
  ends_on: string,
  estimated: number,
): ReportOffering => ({
  key: `${program}-${session}`,
  program,
  session,
  starts_on,
  ends_on,
  fee_cents: 145_000,
  estimated,
  max: 16,
  days: 22,
  hours: 66,
});

// Spring and fall interleaved, as the old pages listed them.
export const doublehandedOfferings: ReportOffering[] = [
  season("J-Pod", "Spring", "2027-03-01", "2027-06-11", 12),
  season("J-Pod", "Fall", "2027-09-07", "2027-11-19", 10),
  season("K-Pod", "Spring", "2027-03-02", "2027-06-12", 14),
  season("L-Pod", "Spring", "2027-03-04", "2027-06-10", 8),
  season("K-Pod", "Fall", "2027-09-08", "2027-11-20", 12),
  season("L-Pod", "Fall", "2027-09-09", "2027-11-18", 10),
  season("J-Pod", "Summer", "2027-06-22", "2027-08-12", 9),
  season("K-Pod", "Summer", "2027-06-23", "2027-08-13", 11),
];

const offering = (
  program: string,
  session: string,
  starts_on: string,
  ends_on: string,
  fee_cents: number,
  estimated: number,
  max: number,
  days: number,
  hours: number,
): ReportOffering => ({
  key: `${program}-${session}`,
  program,
  session,
  starts_on,
  ends_on,
  fee_cents,
  estimated,
  max,
  days,
  hours,
});

/** Every program area's offerings, for the Overview's fees and enrollment. */
export const areaOfferings: Record<string, ReportOffering[]> = {
  summer: summerOfferings,
  doublehanded: doublehandedOfferings,
  singlehanded: [
    offering("Opti Green", "Spring", "2027-03-06", "2027-06-05", 98_000, 10, 12, 14, 42),
    offering("Opti Green", "Fall", "2027-09-11", "2027-11-13", 88_000, 8, 12, 10, 30),
    offering("Opti Gold", "Spring", "2027-03-07", "2027-06-06", 125_000, 9, 10, 14, 49),
    offering("Opti Gold", "Fall", "2027-09-12", "2027-11-14", 110_000, 8, 10, 10, 35),
    offering("ILCA", "Spring", "2027-03-07", "2027-06-06", 135_000, 9, 12, 14, 49),
    offering("ILCA", "Fall", "2027-09-12", "2027-11-14", 120_000, 8, 12, 10, 35),
  ],
  lts: [
    offering("Adult Learn to Sail", "Spring", "2027-04-10", "2027-05-15", 52_000, 6, 6, 6, 21),
    offering("Adult Learn to Sail", "Summer", "2027-06-12", "2027-07-17", 52_000, 6, 6, 6, 21),
    offering("Adult Learn to Sail", "Fall", "2027-08-21", "2027-09-25", 52_000, 6, 6, 6, 21),
    offering("Youth Learn to Sail", "Spring", "2027-04-06", "2027-05-25", 42_000, 10, 12, 8, 24),
    offering("Youth Learn to Sail", "Fall", "2027-09-14", "2027-10-26", 42_000, 10, 12, 7, 21),
  ],
  adventure: [
    offering("Adventure", "Spring", "2027-04-03", "2027-06-05", 72_000, 8, 12, 10, 35),
    offering("Adventure", "Fall", "2027-09-11", "2027-11-06", 72_000, 7, 12, 9, 31),
  ],
  hp: [
    offering("High Performance", "Spring", "2027-03-06", "2027-06-12", 300_000, 6, 6, 30, 180),
    offering("High Performance", "Fall", "2027-09-11", "2027-11-20", 300_000, 6, 6, 30, 180),
  ],
};

export const doublehandedPrograms: ProgramSettings[] = [
  { name: "J-Pod", staff_level: "Level 3 Coach", sailors_per_coach: 8, rules: "Travel regattas take two coaches." },
  { name: "K-Pod", staff_level: "Level 3 Coach", sailors_per_coach: 10, rules: null },
  { name: "L-Pod", staff_level: "Level 4 Coach", sailors_per_coach: 12, rules: "Most sailors bring their own 420s." },
];

export const doublehandedStatement = {
  revenue: [account("4130", "Doublehanded tuition", 9_500_000), account("4900", "Scholarships", -200_000)],
  direct: [
    account("5010", "Coach wages", 3_600_000),
    account("5020", "Payroll tax", 360_000),
    account("5110", "RIB fuel", 410_000),
    account("5130", "Boat upkeep", 520_000),
    account("5310", "Card fees", 280_000),
    account("5510", "Regatta travel", 930_000),
  ],
  indirect: [account(null, "G&A", 1_700_000), account(null, "Program admin", 500_000), account(null, "Space", 200_000)],
};

/** What CSC sells outside the programs. */
export const products: Product[] = [
  { name: "Boat storage", revenue_cents: 1_500_000, direct_cents: 300_000 },
  { name: "Charters", revenue_cents: 700_000, direct_cents: 450_000 },
  { name: "Merchandise", revenue_cents: 200_000, direct_cents: 150_000 },
];

export const sharedCosts: SharedCost[] = [
  { number: "6010", name: "Director's salary", pool: "G&A", total_cents: 5_400_000, allocated_cents: 4_900_000 },
  { number: "6110", name: "Insurance", pool: "G&A", total_cents: 1_800_000, allocated_cents: 1_600_000 },
  { number: "6210", name: "Accounting", pool: "G&A", total_cents: 600_000, allocated_cents: 550_000 },
  { number: "6220", name: "Clubspot and QuickBooks", pool: "G&A", total_cents: 450_000, allocated_cents: 400_000 },
  {
    number: "6020",
    name: "Program Director",
    pool: "Program admin",
    total_cents: 3_300_000,
    allocated_cents: 3_300_000,
  },
  { number: "6310", name: "Clubhouse fee", pool: "Space", total_cents: 1_200_000, allocated_cents: 900_000 },
  { number: "6320", name: "Dinghy floats", pool: "Space", total_cents: 800_000, allocated_cents: 600_000 },
];

export const fundraising = {
  revenue: [
    account("4510", "Individual gifts", 3_000_000),
    account("4520", "Grants", 2_500_000),
    account("4530", "Event tickets and auction", 1_800_000),
    account("4540", "In-kind gifts", 400_000),
  ],
  costs: [account("7010", "Event costs", 900_000), account("7020", "Donor mailings", 150_000)],
};

export const capital = [
  account("1510", "Coach boat", 4_500_000),
  account("1520", "Six Optis", 2_100_000),
  account("1530", "Float repairs", 1_200_000),
];

/** The Operations Plan's rates for the year, with each bonus on the salaried position it pays. */
export const reportAssumptions: OperationsAssumptions = {
  rates: { payroll_tax_rate: 0.1, lodging_per_night_cents: 15_000, mileage_rate_cents: 70 },
  staffLevels: [
    { key: "jr", name: "Junior Instructor", pay_type: "hourly", hourly_rate_cents: 1_900 },
    { key: "l1", name: "Level 1 Instructor", pay_type: "hourly", hourly_rate_cents: 2_200 },
    { key: "l2", name: "Level 2 Instructor", pay_type: "hourly", hourly_rate_cents: 2_600 },
    { key: "l3", name: "Level 3 Coach", pay_type: "hourly", hourly_rate_cents: 3_200 },
    { key: "parent", name: "Parent helper", pay_type: "volunteer", hourly_rate_cents: null },
  ],
  positions: [
    {
      key: "ed",
      name: "Executive Director",
      annual_salary_cents: 9_000_000,
      paid_hours_per_year: 2_080,
      ga_share: 0.6,
      bonuses: [],
    },
    {
      key: "pd",
      name: "Program Director",
      annual_salary_cents: 6_500_000,
      paid_hours_per_year: 2_080,
      ga_share: 0.1,
      bonuses: [{ key: "pd-bonus", role_name: "Program Director", bonus_rate: 0.1, basis: "after_shared_costs" }],
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
    { key: "opti", boat_class: "Opti", maintenance_per_boat_hour_cents: 150, quantity: 30, sailors_per_boat: 1 },
    {
      key: "sailqube",
      boat_class: "Sailqube",
      maintenance_per_boat_hour_cents: 200,
      quantity: 12,
      sailors_per_boat: 2,
    },
    { key: "420", boat_class: "420", maintenance_per_boat_hour_cents: 300, quantity: 14, sailors_per_boat: 2 },
  ],
  bonuses: [{ key: "summer", role_name: "Summer Director", bonus_rate: 0.05, basis: "before_shared_costs" }],
};

export const summerRules =
  "Guppies and Opti Camp share the dock in the morning.\nNo sailing on Monday, July 5.\nThe Program Director coaches Race Camp, at salary.";

export const doublehandedRules = "J-Pod and K-Pod share coaches on Wednesdays.";

export const assumptionsRules =
  "Keep one RIB ashore for repairs on summer weekdays.\nNo more than 6 RIBs on the water at once.";

export const warnings: PlanWarning[] = [
  {
    key: "w1",
    code: "over_capacity",
    category: "allocation",
    area: "summer",
    date: "2027-07-12",
    message: "Guppies Week 4: 14 sailors, but the boats can take 12",
  },
  {
    key: "w2",
    code: "over_capacity",
    category: "allocation",
    area: "summer",
    date: "2027-07-13",
    message: "Guppies Week 4: 14 sailors, but the staff can take 10",
  },
  {
    key: "w3",
    code: "no_program_settings",
    category: "data",
    area: "summer",
    date: "2027-07-19",
    message:
      "Race Camp Week 2's program has no staff level or sailors per coach, so its sailors aren't checked against its staff",
  },
  {
    key: "w4",
    code: "unallocated_activity",
    category: "allocation",
    area: "doublehanded",
    date: "2027-08-02",
    message: "J-Pod Summer's practice has no staff",
  },
];

/** The organization's totals, from the Overview's rows, the fundraising, and the capital below. */
export const totals: Totals = (() => {
  const add = (of: (r: OverviewRow) => number) => overviewRows.reduce((total, r) => total + of(r), 0);
  const revenue = add((r) => r.revenue_cents);
  const expense = add((r) => r.direct_cents + r.indirect_cents);
  return {
    operating_revenue_cents: revenue,
    operating_expense_cents: expense,
    operating_net_cents: revenue - expense,
    fundraising_revenue_cents: 7_700_000,
    fundraising_expense_cents: 1_050_000,
    fundraising_net_cents: 6_650_000,
    capital_cents: 7_800_000,
    total_cents: revenue - expense + 6_650_000 - 7_800_000,
  };
})();

const planSummary = (
  fields: Partial<Omit<ListedPlan, "net_cents" | "total_cents">> & Pick<ListedPlan, "id" | "name" | "status">,
): ListedPlan => {
  const net = (fields.revenue_cents ?? 49_900_000) - (fields.expense_cents ?? 44_600_000);
  const fundraising = fields.fundraising_net_cents ?? 6_650_000;
  const capital = fields.capital_cents ?? 7_800_000;
  return {
    year: 2027,
    saved_at: null,
    saved_by: null,
    parent: null,
    note: null,
    platform: null,
    warnings: 0,
    revenue_cents: 49_900_000,
    expense_cents: 44_600_000,
    fundraising_net_cents: fundraising,
    capital_cents: capital,
    ...fields,
    net_cents: net,
    total_cents: net + fundraising - capital,
  };
};

/** Two years of Financial Plans: each year's active one, drafts including one from the planning agent, and older saved ones. */
export const planningPlans: ListedPlan[] = [
  planSummary({
    id: "budget",
    name: "Budget",
    status: "active",
    saved_at: "2027-03-10T18:00:00Z",
    saved_by: "Morgan Keel",
    platform: "1.38.1",
    warnings: 2,
  }),
  planSummary({
    id: "agent",
    name: "2027 allocations, Nov 9",
    status: "draft",
    parent: { id: "budget", name: "Budget" },
    warnings: 4,
    expense_cents: 44_100_000,
    note: "Allocated every summer week and the spring and fall seasons. 4 warnings left",
  }),
  planSummary({
    id: "two-coaches",
    name: "Two more coaches",
    status: "draft",
    parent: { id: "budget", name: "Budget" },
    note: "What a second full-time coach would cost.",
    expense_cents: 47_800_000,
  }),
  planSummary({
    id: "board",
    name: "Board review",
    status: "saved",
    saved_at: "2027-02-02T18:00:00Z",
    saved_by: "Sam Halyard",
    platform: "1.36.0",
    expense_cents: 45_500_000,
  }),
  planSummary({
    id: "first",
    name: "First pass",
    status: "saved",
    saved_at: "2027-01-15T18:00:00Z",
    expense_cents: 48_700_000,
  }),
  planSummary({
    id: "2026",
    name: "2026 Budget",
    year: 2026,
    status: "active",
    saved_at: "2026-03-04T18:00:00Z",
    revenue_cents: 45_200_000,
    expense_cents: 42_900_000,
  }),
];
