// Made-up numbers for the Planning report wireframes. Never real figures.
import type { AccountAmount, OverviewRow, ProgramSettings, ReportOffering } from "@/model/reports";
import type { Product, SharedCost } from "./non-program-report";

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

const account = (number: string | null, name: string, cents: number): AccountAmount => ({ number, name, cents });

export const summerStatement = {
  revenue: [account("4140", "Summer camp tuition", 21_900_000), account("4900", "Scholarships", -400_000)],
  direct: [
    account("5010", "Coach wages", 7_400_000),
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
    account(null, "G&A", 3_900_000),
    account(null, "Program admin", 1_100_000),
    account(null, "Space", 600_000),
  ],
};

export const summerPrograms: ProgramSettings[] = [
  { name: "Guppies", staff_level: "Instructor 1", sailors_per_coach: 5 },
  { name: "Opti Camp", staff_level: "Instructor 2", sailors_per_coach: 8 },
  { name: "Race Camp", staff_level: "Coach 3", sailors_per_coach: 10 },
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
];

export const doublehandedPrograms: ProgramSettings[] = [
  { name: "J-Pod", staff_level: "Coach 3", sailors_per_coach: 8 },
  { name: "K-Pod", staff_level: "Coach 3", sailors_per_coach: 10 },
  { name: "L-Pod", staff_level: "Coach 4", sailors_per_coach: 12 },
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
