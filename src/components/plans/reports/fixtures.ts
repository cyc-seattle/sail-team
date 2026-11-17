// Made-up numbers for the Planning report wireframes. Never real figures.
import type { Bonus, FixedCost, OperationsAssumptions, StaffTime } from "@/model/assumptions";
import type { ScheduleBlock, ScheduledActivity } from "@/model/schedule";
import type { BonusResult, ListedPlan, Totals } from "@/model/financial-plans";
import type {
  StorageCost,
  AccountAmount,
  InAndOut,
  CapitalItem,
  FunctionalExpenses,
  LineAmount,
  OverviewRow,
  PlanWarning,
  Product,
  ProgramSettings,
  ReportOffering,
  Trip,
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
    staff_level: "Instructor",
    sailors_per_coach: 10,
    indirect_cost_rate: 0.15,
    notes: [
      "If there are more than 12 Guppies, add a **Junior Instructor**.",
      "Guppies sail Sailqubes. The Harpoon can take up to 10 instead.",
    ],
  },
  {
    name: "Opti Camp",
    staff_level: "Senior Instructor",
    sailors_per_coach: 8,
    indirect_cost_rate: 0.15,
    notes: ["About a third bring their own Optis.", "Never fewer than 2 coaches on the water."],
  },
  {
    name: "Race Camp",
    program_id: "product-race-camp",
    staff_level: "Coach",
    sailors_per_coach: 10,
    indirect_cost_rate: null,
    notes: null,
  },
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
  program_id: `product-${program.toLowerCase().replace(" ", "-")}`,
  ...week(n),
  fee_cents: fee,
  estimated,
  max,
  max_set: true,
  // Race Camp runs outside the summer term, as a one-off.
  term: program === "Race Camp" ? null : "Summer 2027",
  // Week 5's Opti Camp is short a coach, and Race Camp needs more sailors than it expects.
  room: program === "Opti Camp" && n === 4 ? 12 : max,
  breakeven: program === "Race Camp" ? 9 : program === "Guppies" ? 7 : 10,
  days: 5,
  hours,
  cogs_rate: program === "Race Camp" ? 0.08 : null,
  note: program === "Race Camp" && n === 4 ? "Doubles as the regional qualifier." : null,
});

// Listed out of order on purpose: the report sorts them by start date.
export const summerOfferings: ReportOffering[] = [
  ...[0, 2, 4, 6, 8, 1, 3, 5, 7].map((n) => camp("Opti Camp", n, 52_500, n % 3 === 0 ? 12 : 16, 16, 30)),
  ...[0, 1, 2, 3, 4, 5, 6, 7, 8].map((n) => camp("Guppies", n, 39_500, n < 2 ? 6 : 9, 10, 15)),
  ...[1, 4, 7].map((n) => camp("Race Camp", n, 61_000, 8, 12, 35)),
];

const termOffering = (
  program: string,
  session: string,
  starts_on: string,
  ends_on: string,
  estimated: number,
): ReportOffering => ({
  key: `${program}-${session}`,
  program,
  session,
  term_key: `term-${session.toLowerCase()}`,
  term: `${session} 2027`,
  starts_on,
  ends_on,
  fee_cents: 145_000,
  estimated,
  max: 16,
  max_set: true,
  room: 16,
  breakeven: session === "Summer" ? null : 9,
  days: 22,
  hours: 66,
  cogs_rate: null,
  note: session === "Summer" ? "Only if enough sailors sign up by May." : null,
});

// Spring and fall interleaved, as the old pages listed them.
export const doublehandedOfferings: ReportOffering[] = [
  termOffering("J-Pod", "Spring", "2027-03-01", "2027-06-11", 12),
  termOffering("J-Pod", "Fall", "2027-09-07", "2027-11-19", 10),
  termOffering("K-Pod", "Spring", "2027-03-02", "2027-06-12", 14),
  termOffering("L-Pod", "Spring", "2027-03-04", "2027-06-10", 8),
  termOffering("K-Pod", "Fall", "2027-09-08", "2027-11-20", 12),
  termOffering("L-Pod", "Fall", "2027-09-09", "2027-11-18", 10),
  termOffering("J-Pod", "Summer", "2027-06-22", "2027-08-12", 9),
  termOffering("K-Pod", "Summer", "2027-06-23", "2027-08-13", 11),
];

/** Each Doublehanded offering's Tuesday and Thursday practices, J-Pod on Tuesdays and the rest on Thursdays. */
export const doublehandedSchedule: ScheduleBlock[] = doublehandedOfferings.flatMap((o) => {
  const out: ScheduleBlock[] = [];
  for (
    let d = new Date(`${o.starts_on}T00:00:00Z`);
    d <= new Date(`${o.ends_on}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1)
  ) {
    if (d.getUTCDay() !== (o.program === "J-Pod" ? 2 : 4)) {
      continue;
    }
    const date = d.toISOString().slice(0, 10);
    out.push({
      key: `${o.key} ${date}`,
      date,
      // Named after its one offering, as a block often is.
      name: `${o.program} ${o.session} ${date}`,
      activities: [
        {
          key: `${o.key} ${date}`,
          offering_key: o.key,
          kind: "practice",
          start_time: "16:00:00",
          end_time: "19:00:00",
          setup_minutes: 30,
          putaway_minutes: 30,
          on_water_minutes: 150,
        },
      ],
      parts: ["2 Coaches", "2 RIBs", "6 420s", "4 sailor-owned 420s"],
    });
  }
  return out;
});

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
  cogs_rate: null,
  note: null,
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
  {
    name: "J-Pod",
    staff_level: "Coach",
    sailors_per_coach: 8,
    indirect_cost_rate: 0.2,
    notes: ["Travel regattas take two coaches."],
  },
  { name: "K-Pod", staff_level: "Coach", sailors_per_coach: 10, notes: null },
  {
    name: "L-Pod",
    staff_level: "Head Coach",
    sailors_per_coach: 12,
    indirect_cost_rate: 0.2,
    notes: ["Most sailors bring their own 420s."],
  },
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

/** An area's revenue and expenses, from its statement. */
const totalOf = (statement: { revenue: AccountAmount[]; direct: AccountAmount[]; indirect: AccountAmount[] }) => ({
  revenue_cents: statement.revenue.reduce((t, a) => t + a.cents, 0),
  expense_cents: [...statement.direct, ...statement.indirect].reduce((t, a) => t + a.cents, 0),
});

/**
 * Shares an area's total out among its offerings, revenue by what their sailors pay and expenses by how big they're
 * planned, all but `charged`, which is the area's own, so the Budget adds up to the statement.
 */
function fit(offerings: ReportOffering[], total: InAndOut, charged: number): void {
  const share = (cents: number, weight: (o: ReportOffering) => number) => {
    const all = offerings.reduce((t, o) => t + weight(o), 0);
    let left = cents;
    return offerings.map((o, i) => {
      const part = i === offerings.length - 1 ? left : Math.round((cents * weight(o)) / all);
      left -= part;
      return part;
    });
  };
  const revenue = share(total.revenue_cents, (o) => o.fee_cents * o.estimated);
  // Summer's coaches cost more than its sailors pay.
  const expenses = share(total.expense_cents - charged, (o) => o.fee_cents * o.max * (o.session === "Summer" ? 2 : 1));
  offerings.forEach((o, i) => Object.assign(o, { revenue_cents: revenue[i], expense_cents: expenses[i] }));
}

/** Doublehanded's total, with $7,000 of coaching charged to the area itself. */
export const doublehandedTotal = totalOf(doublehandedStatement);
fit(doublehandedOfferings, doublehandedTotal, 700_000);

/** Summer's total, with $9,000 of its director's time charged to the area itself. */
export const summerTotal = totalOf(summerStatement);
fit(summerOfferings, summerTotal, 900_000);

/** What CSC sells outside the programs. */
export const products: Product[] = [
  { name: "Boat storage", revenue_cents: 1_500_000, direct_cents: 300_000 },
  { name: "Charters", id: "product-charters", revenue_cents: 700_000, direct_cents: 450_000 },
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

const item = (
  rank: number | null,
  name: string,
  amount_cents: number,
  running_cents: number,
  extra: Partial<CapitalItem> = {},
): CapitalItem => ({
  key: `capital-${name}`,
  rank,
  name,
  account_number: "1510",
  account_name: "Equipment",
  amount_cents,
  running_cents,
  funded: running_cents <= 6_000_000,
  note: null,
  link: null,
  ...extra,
});

/** Four ranked purchases, where the money runs out after the second, and one entered as a budget line. */
export const capital: { items: CapitalItem[]; available_cents: number } = {
  available_cents: 6_000_000,
  items: [
    item(1, "Coach boat", 3_500_000, 3_500_000, {
      note: "Replaces the oldest RIB, which failed its survey.",
      link: "https://example.org/quote",
    }),
    item(2, "Six Optis", 2_100_000, 5_600_000),
    item(3, "Float repairs", 1_200_000, 6_800_000, { account_number: "1520", account_name: "Buildings" }),
    item(4, "Sail locker", 500_000, 7_300_000),
    item(null, "Trailer", 500_000, 7_800_000),
  ],
};

const programDirectorBonus: Bonus = {
  key: "pd-bonus",
  role_name: "Program Director",
  bonus_rate: 0.1,
  basis: "after_shared_costs",
  products: ["Guppies", "J-Pod", "Opti Camp"],
  account: { number: "5030", name: "Salaries" },
  position: "Program Director",
};

/** What each bonus pays: Summer Director's on a loss in Fall pays nothing, and Program Director's no-term offerings on the year. */
export const bonusAmounts: BonusResult[] = [
  {
    bonus_owner_key: "summer",
    role_name: "Summer Director",
    term_name: "Fall 2027",
    term_starts_on: "2027-09-01",
    net_cents: -120_050,
    bonus_cents: 0,
  },
  {
    bonus_owner_key: "pd-bonus",
    role_name: "Program Director",
    term_name: null,
    term_starts_on: null,
    net_cents: 1_800_000,
    bonus_cents: 180_000,
  },
  {
    bonus_owner_key: "pd-bonus",
    role_name: "Program Director",
    term_name: "Summer 2027",
    term_starts_on: "2027-06-16",
    net_cents: 4_512_340,
    bonus_cents: 451_234,
  },
  {
    bonus_owner_key: "summer",
    role_name: "Summer Director",
    term_name: "Summer 2027",
    term_starts_on: "2027-06-16",
    net_cents: 3_100_000,
    bonus_cents: 155_000,
  },
];

const fixedCost = (
  key: string,
  name: string,
  account: string,
  amount_cents: number,
  charged_to: string,
  more: Partial<FixedCost> = {},
): FixedCost => ({
  key,
  name,
  account: { number: account.split(" ")[0]!, name: account.slice(account.indexOf(" ") + 1) },
  amount_cents,
  charged_to,
  in_mtdc: true,
  note: null,
  revenue: false,
  ...more,
});

/** Summer's own fixed costs and staff time, on its report's assumptions. */
export const summerFixedCosts: FixedCost[] = [
  fixedCost("tents", "Tent rental", "5410 Rentals", 180_000, "Summer", { in_mtdc: false }),
  fixedCost("shirts", "Camp shirts", "5420 Supplies", 95_000, "Opti Camp", { note: "One per sailor." }),
];
export const summerStaffTime: StaffTime[] = [
  {
    key: "setup",
    name: "Camp setup",
    staff_level: "Instructor",
    hours: 40,
    account: { number: "5010", name: "Coach wages" },
    charged_to: "Summer",
    note: null,
  },
];

/** The Operations Plan's rates for the year, with each bonus on the salaried position it pays. */
export const reportAssumptions: OperationsAssumptions = {
  rates: {
    lodging_per_night_cents: 15_000,
    mileage_rate_cents: 70,
  },
  payrollTaxes: [
    { key: "ss", name: "Social Security", wage_share: 0.062, hourly_cents: null },
    { key: "medicare", name: "Medicare", wage_share: 0.0145, hourly_cents: null },
    { key: "suta", name: "WA unemployment", wage_share: 0.0027, hourly_cents: null },
    { key: "li", name: "L&I", wage_share: null, hourly_cents: 45.235 },
  ],
  staffLevels: [
    { id: "jr", name: "Junior Instructor", hourly_rate_cents: 0 },
    { id: "l1", name: "Instructor", hourly_rate_cents: 2_200 },
    { id: "l2", name: "Senior Instructor", hourly_rate_cents: 2_600 },
    { id: "vc", name: "Volunteer Coach", hourly_rate_cents: 0 },
    { id: "l3", name: "Coach", hourly_rate_cents: 3_200 },
  ],
  positions: [
    {
      key: "ed",
      name: "Executive Director",
      annual_salary_cents: 9_000_000,
      paid_hours_per_year: 2_080,
      ga_share: 0.6,
      hourly_coaching_rate_cents: null,
      remainder_pool: "G&A",
      bonuses: [],
    },
    {
      key: "pd",
      name: "Program Director",
      annual_salary_cents: 6_500_000,
      paid_hours_per_year: 2_080,
      ga_share: 0.1,
      hourly_coaching_rate_cents: 3_500,
      remainder_pool: "Program admin",
      bonuses: [programDirectorBonus],
    },
  ],
  charges: [
    {
      key: "card",
      name: "Card fees",
      rate: 0.03,
      product_kinds: ["program", "charter"],
      account: { number: "5310", name: "Card fees" },
      in_mtdc: true,
      note: null,
    },
    {
      key: "scholarships",
      name: "Scholarships",
      rate: 0.05,
      product_kinds: ["program"],
      account: { number: "4900", name: "Scholarships" },
      in_mtdc: false,
      note: "Matches what the board set aside last year.",
    },
    {
      key: "bo",
      name: "B&O tax",
      rate: 0.015,
      product_kinds: null,
      account: { number: "6510", name: "B&O tax" },
      in_mtdc: true,
      note: null,
    },
  ],
  boatRates: [
    {
      key: "opti",
      boat_class: "Opti",
      fuel_per_hour_cents: null,
      maintenance_per_boat_hour_cents: 150,
      charter_per_day_cents: null,
    },
    {
      key: "sailqube",
      boat_class: "Sailqube",
      boat_class_id: "class-sailqube",
      fuel_per_hour_cents: null,
      maintenance_per_boat_hour_cents: 200,
      charter_per_day_cents: null,
    },
    {
      key: "420",
      boat_class: "420",
      fuel_per_hour_cents: null,
      maintenance_per_boat_hour_cents: 300,
      charter_per_day_cents: 7_500,
    },
    {
      key: "rib",
      boat_class: "RIB",
      fuel_per_hour_cents: 1_500,
      maintenance_per_boat_hour_cents: 800,
      charter_per_day_cents: 30_000,
    },
  ],
  bonuses: [
    programDirectorBonus,
    {
      key: "summer",
      role_name: "Summer Director",
      bonus_rate: 0.05,
      basis: "before_shared_costs",
      products: ["Guppies", "Opti Camp"],
      account: { number: "5030", name: "Salaries" },
      position: null,
    },
  ],
  fixedCosts: [
    fixedCost("insurance", "Insurance", "6110 Insurance", 900_000, "G&A"),
    fixedCost("rent", "Clubhouse rent", "6310 Clubhouse rent", 600_000, "G&A", { note: "Lease renews in March." }),
    fixedCost("audit", "Audit", "6410 Audit", 450_000, "G&A", { in_mtdc: false }),
    fixedCost("software", "Registration software", "6420 Software", 240_000, "Program admin"),
    fixedCost("gala", "Spring gala costs", "7010 Event costs", 300_000, "Example Sailing Club"),
    fixedCost("gifts", "Spring gala gifts", "4500 Individual gifts", 2_000_000, "Example Sailing Club", {
      revenue: true,
    }),
    fixedCost("dock", "Storage dock upkeep", "5130 Boat upkeep", 300_000, "Boat storage 2027"),
  ],
  staffTime: [
    {
      key: "repairs",
      name: "Winter boat repairs",
      staff_level: "Instructor",
      hours: 120,
      account: { number: "5130", name: "Boat upkeep" },
      charged_to: "Program admin",
      note: "Two instructors, three weeks in February.",
    },
    {
      key: "training",
      name: "Staff training week",
      staff_level: "Junior Instructor",
      hours: 240,
      account: { number: "5010", name: "Coach wages" },
      charged_to: "Summer",
      note: null,
    },
  ],
  salariedHours: [
    { key: "pd-summer", position: "Program Director", booked_to: "Summer", hours: 400 },
    { key: "pd-jpod", position: "Program Director", booked_to: "J-Pod", hours: 120.5 },
  ],
  closedDays: [
    { key: "july4", date: "2027-07-05", name: "Independence Day, observed" },
    { key: "labor", date: "2027-09-06", name: "Labor Day" },
  ],
};

export const summerNotes = [
  "Guppies and Opti Camp share the dock in the morning.",
  "No sailing on Monday, July 5.",
  "The Program Director coaches Race Camp, *at salary*.",
];

export const doublehandedNotes = ["J-Pod and K-Pod share coaches on Wednesdays."];

export const operationsNotes = [
  "Keep one RIB ashore for repairs on summer weekdays.",
  "No more than 6 RIBs on the water at once.",
];

export const storageCosts: StorageCost[] = [
  { payer: "Doublehanded", kind: "area", name: "Storage (dinghy float and dry storage, by area)", cents: 699_500 },
  { payer: "Summer", kind: "area", name: "Storage (dinghy float and dry storage, by area)", cents: 982_400 },
  { payer: "Shared (G&A)", kind: "shared", name: "Self storage facility", cents: 172_800 },
  { payer: "No program", kind: "unallocated", name: "Storage not allocated to programs", cents: 1_307_000 },
];

export const warnings: PlanWarning[] = [
  {
    key: "w1",
    code: "short_of_boats",
    category: "allocation",
    severity: "error",
    subject: "RIB",
    area: "summer",
    date: "2027-07-12",
    message: "Guppies, Opti Camp, and Race Camp need 4 RIBs. CSC has 3.",
  },
  {
    key: "w2",
    code: "over_inventory_boats",
    category: "allocation",
    severity: "warning",
    subject: "Sailqube",
    area: "summer",
    date: "2027-07-12",
    message: "11 Sailqubes out: Guppies 7, Opti Camp 4. CSC has 8.",
  },
  {
    key: "w3",
    code: "closed_date",
    category: "allocation",
    severity: "warning",
    subject: "guppies-2027-07-05",
    area: "summer",
    date: "2027-07-05",
    message: "Guppies Week 3 is on Independence Day, observed.",
  },
  {
    key: "w4",
    code: "no_indirect_cost_rate",
    category: "data",
    severity: "warning",
    subject: "product-race-camp",
    area: "summer",
    date: null,
    message: "Race Camp pays no shared costs.",
  },
  {
    key: "w7",
    code: "breakeven_above_target",
    category: "data",
    severity: "warning",
    subject: "Race Camp-1",
    area: "summer",
    date: null,
    message: "Race Camp Week 2 breaks even at 9. Target is 8.",
  },
  {
    key: "w8",
    code: "breakeven_above_target",
    category: "data",
    severity: "warning",
    subject: "Race Camp-4",
    area: "summer",
    date: null,
    message: "Race Camp Week 5 breaks even at 9. Target is 8.",
  },
  {
    key: "w9",
    code: "breakeven_above_target",
    category: "data",
    severity: "warning",
    subject: "Race Camp-7",
    area: "summer",
    date: null,
    message: "Race Camp Week 8 breaks even at 9. Target is 8.",
  },
  {
    key: "w10",
    code: "breakeven_above_target",
    category: "data",
    severity: "warning",
    subject: "Guppies-0",
    area: "summer",
    date: null,
    message: "Guppies Week 1 breaks even at 7. Target is 6.",
  },
  {
    key: "w11",
    code: "breakeven_above_target",
    category: "data",
    severity: "warning",
    subject: "Guppies-1",
    area: "summer",
    date: null,
    message: "Guppies Week 2 breaks even at 7. Target is 6.",
  },
  {
    key: "w12",
    code: "capacity_below_max",
    category: "allocation",
    severity: "warning",
    subject: "Opti Camp-4",
    area: "summer",
    date: null,
    message: "Opti Camp Week 5's blocks take 12. Max is 16.",
  },
  {
    key: "w5",
    code: "position_double_booked",
    category: "allocation",
    severity: "warning",
    subject: "program-director",
    area: "doublehanded",
    date: "2027-08-02",
    message: "Program Director is on J-Pod and Race Camp at once for 2 hours.",
  },
  {
    key: "w6",
    code: "capital_unranked",
    category: "data",
    severity: "warning",
    subject: "launch-ramp",
    area: "non-program",
    date: null,
    message: "Add Launch ramp repair to the capital list to rank it.",
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

/** The same year's expenses by function: G&A's shares are management, and fundraising's costs are fundraising. */
export const functions: FunctionalExpenses = (() => {
  const management = overviewRows.reduce((total, r) => total + r.indirect_cents, 0);
  return {
    program_cents: totals.operating_expense_cents - management,
    management_cents: management,
    fundraising_cents: totals.fundraising_expense_cents,
  };
})();

const planSummary = (
  fields: Partial<Omit<ListedPlan, "net_cents">> & Pick<ListedPlan, "id" | "name" | "status">,
): ListedPlan => ({
  year: 2027,
  in_force: null,
  frozen_at: null,
  frozen_by: null,
  parent: null,
  archived: false,
  note: null,
  platform: null,
  warnings: 0,
  revenue_cents: 49_900_000,
  expense_cents: 44_600_000,
  ...fields,
  net_cents: (fields.revenue_cents ?? 49_900_000) - (fields.expense_cents ?? 44_600_000),
});

/**
 * Two years of Financial Plans: each year's plan in force, a draft made active from a later date, drafts including one
 * from the planning agent, an older frozen one that was in force, and an archived one.
 */
export const planningPlans: ListedPlan[] = [
  planSummary({
    id: "budget",
    name: "Budget",
    status: "frozen",
    in_force: { when: "now", from: "2026-07-01", to: "2027-08-31" },
    frozen_at: "2027-03-10T18:00:00Z",
    frozen_by: "Morgan Keel",
    platform: "1.38.1",
    note: "From the [board's budget spreadsheet](https://example.com/budget-2027)",
    warnings: 2,
  }),
  planSummary({
    id: "agent",
    name: "2027 allocations, Nov 9",
    status: "draft",
    parent: { id: "budget", name: "Budget" },
    warnings: 4,
    expense_cents: 44_100_000,
    note: "Allocated every summer week and the spring and fall terms. **4 warnings** left",
  }),
  planSummary({
    id: "two-coaches",
    name: "Fall re-plan",
    status: "draft",
    in_force: { when: "later", from: "2027-09-01", to: null },
    parent: { id: "budget", name: "Budget" },
    note: "What a second full-time coach would cost.",
    platform: "1.39.0",
    expense_cents: 47_800_000,
  }),
  planSummary({
    id: "board",
    name: "Board review",
    status: "frozen",
    in_force: { when: "past", from: "2026-03-01", to: "2026-06-30" },
    frozen_at: "2027-02-02T18:00:00Z",
    frozen_by: "Sam Halyard",
    platform: "1.36.0",
    expense_cents: 45_500_000,
  }),
  planSummary({
    id: "first",
    name: "First pass",
    status: "frozen",
    frozen_at: "2027-01-15T18:00:00Z",
    expense_cents: 48_700_000,
    archived: true,
  }),
  planSummary({
    id: "2026",
    name: "2026 Budget",
    year: 2026,
    status: "frozen",
    in_force: { when: "now", from: "2025-07-01", to: null },
    frozen_at: "2026-03-04T18:00:00Z",
    revenue_cents: 45_200_000,
    expense_cents: 42_900_000,
  }),
];

const scheduled = (key: string, offering_key: string, start_time: string, end_time: string): ScheduledActivity => ({
  key,
  offering_key,
  kind: "practice",
  start_time,
  end_time,
  setup_minutes: 30,
  putaway_minutes: 30,
  on_water_minutes: 150,
});

/**
 * Summer's nine weeks: Guppies and Opti Camp share the dock each weekday morning, short an instructor in week 2 and
 * over on Sailqubes in week 4, and Race Camp has a Wednesday clinic in its weeks.
 */
export const summerSchedule: ScheduleBlock[] = summerOfferings
  .filter((o) => o.program === "Guppies")
  .flatMap((guppies) => {
    const n = Number(guppies.key.split("-")[1]);
    const days = [0, 1, 2, 3, 4].map((d) => {
      const date = new Date(`${guppies.starts_on}T00:00:00Z`);
      date.setUTCDate(date.getUTCDate() + d);
      return date.toISOString().slice(0, 10);
    });
    return days.flatMap((date, d) => {
      const dock: ScheduleBlock = {
        key: `dock-${date}`,
        date,
        name: "Morning dock",
        activities: [
          scheduled(`guppies-${date}`, guppies.key, "09:00:00", "12:00:00"),
          scheduled(`opti-${date}`, `Opti Camp-${n}`, "09:00:00", "15:00:00"),
        ],
        parts: [
          n === 1 ? "2 Instructors" : "3 Instructors",
          "2 RIBs",
          n === 3 ? "11 Sailqubes" : "5 Sailqubes",
          "14 Optis",
        ],
      };
      const clinic: ScheduleBlock[] =
        d === 2 && [1, 4, 7].includes(n)
          ? [
              {
                key: `clinic-${date}`,
                date,
                name: null,
                activities: [scheduled(`race-${date}`, `Race Camp-${n}`, "13:00:00", "16:00:00")],
                parts: ["1 Program Director, by the hour", "1 RIB", "6 420s", "4 sailor-owned 420s"],
              },
            ]
          : [];
      return [dock, ...clinic];
    });
  });

export const closedDays = [{ date: "2027-07-05", name: "Independence Day, observed" }];
export const doublehandedTrips: Trip[] = [
  {
    key: "fall-regatta",
    offering_key: "J-Pod-Fall",
    name: "Fall regatta",
    nights: 2,
    airfare_cents: null,
    miles: 240,
  },
  {
    key: "nationals",
    offering_key: "K-Pod-Summer",
    name: "Nationals",
    nights: 5,
    airfare_cents: 45_000,
    miles: null,
  },
];

const rowWarning = (
  key: string,
  code: string,
  subject: string,
  area: string,
  message: string,
  date: string | null = null,
): PlanWarning => ({ key, code, category: "data", severity: "warning", subject, area, date, message });

/** Warnings about one row each, which show on that row: on Assumptions, Non-program, and an area's tables. */
export const rowWarnings: PlanWarning[] = [
  rowWarning(
    "r1",
    "position_overbooked",
    "pd",
    "non-program",
    "Program Director's hours on programs cost more than its salary allows, so they're cut to fit.",
  ),
  rowWarning(
    "r2",
    "bonus_without_revenue",
    "summer",
    "non-program",
    "Summer Director's offerings have no revenue, so its bonus is split evenly.",
  ),
  rowWarning(
    "r3",
    "no_charter_rate",
    "class-sailqube",
    "summer",
    "Morning dock charters Sailqubes, which have no charter rate. They cost nothing.",
    "2027-07-12",
  ),
  rowWarning(
    "r4",
    "cost_off_programs",
    "tents",
    "summer",
    "Tent rental is left out of the shared-cost split, so other areas pay more.",
  ),
  rowWarning(
    "r5",
    "trip_without_staff",
    "fall-regatta",
    "doublehanded",
    "Fall regatta has no staff on its travel days, so no coach airfare or lodging.",
    "2027-10-16",
  ),
  rowWarning(
    "r6",
    "area_on_non_program",
    "product-charters",
    "non-program",
    "Charters isn't a program, but it's in a program area.",
  ),
  rowWarning("r7", "capital_unranked", "capital-Trailer", "non-program", "Add Trailer to the capital list to rank it."),
];
